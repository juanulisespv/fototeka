
"use client"

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import CalendarView from '@/components/calendar-view';
import PostFormDialog from '@/components/post-form-dialog';
import { collection, addDoc, onSnapshot, query, doc, updateDoc, deleteDoc, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { EditorialPost, MediaFile, Campaign, Tag } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import DayDetailsSidebar from '@/components/day-details-sidebar';
import DeletePostDialog from '@/components/delete-post-dialog';
import PostPreviewDialog from '@/components/post-preview-dialog';
import { isSameDay, startOfMonth, endOfMonth } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Upload, Search } from 'lucide-react';
import ExportButton from '@/components/export-button';
import { useSidebar } from '@/components/ui/sidebar';
import withAuth from '@/hoc/withAuth';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/page-header';

const ImportDialog = dynamic(() => import('@/components/import-dialog'), { ssr: false });


function CalendarPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [posts, setPosts] = useState<EditorialPost[]>([]);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [postToEdit, setPostToEdit] = useState<EditorialPost | null>(null);
  const [postToDelete, setPostToDelete] = useState<EditorialPost | null>(null);
  const [postToPreview, setPostToPreview] = useState<EditorialPost | null>(null);
  const { toast } = useToast();
  const { isMobile } = useSidebar();

  const [searchTerm, setSearchTerm] = useState("");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [socialNetworkFilter, setSocialNetworkFilter] = useState("all");

  useEffect(() => {
    const today = new Date();
    setSelectedDate(today);
    
    // Set initial date for fetching
    setCurrentDate(today);
  }, []);

  useEffect(() => {
    // Fetch posts for the current month
    const firstDay = startOfMonth(currentDate);
    const lastDay = endOfMonth(currentDate);

    const postsQuery = query(
      collection(db, "editorialPosts"),
      where("publicationDate", ">=", firstDay.toISOString()),
      where("publicationDate", "<=", lastDay.toISOString())
    );
    
    const postsUnsub = onSnapshot(postsQuery, (querySnapshot) => {
      const postsData: EditorialPost[] = [];
      querySnapshot.forEach((doc) => {
        postsData.push({ id: doc.id, ...doc.data() } as EditorialPost);
      });
      setPosts(postsData);
    });

    return () => postsUnsub();
  }, [currentDate]);

  useEffect(() => {
    // These listeners don't need to be month-dependent, so they are kept separate.
    const mediaQuery = query(collection(db, "mediaFiles"));
    const mediaUnsub = onSnapshot(mediaQuery, (querySnapshot) => {
      const filesData: MediaFile[] = [];
      querySnapshot.forEach((doc) => {
        filesData.push({ id: doc.id, ...doc.data() } as MediaFile);
      });
      setMediaFiles(filesData);
    });

    const campaignsQuery = query(collection(db, "campaigns"));
    const campaignsUnsub = onSnapshot(campaignsQuery, (snapshot) => {
        const campaignsData: Campaign[] = [];
        snapshot.forEach((doc) => {
            campaignsData.push({ id: doc.id, ...doc.data()} as Campaign);
        });
        setCampaigns(campaignsData);
    });
    
    const tagsQuery = query(collection(db, "tags"), orderBy("order", "asc"));
    const tagsUnsub = onSnapshot(tagsQuery, (snapshot) => {
        const tagsData: Tag[] = [];
        snapshot.forEach((doc) => {
            tagsData.push({ id: doc.id, ...doc.data() } as Tag);
        });
        setTags(tagsData);
    });

    return () => {
        mediaUnsub();
        campaignsUnsub();
        tagsUnsub();
    };
  }, []);

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = searchTerm === '' || 
        post.title.toLowerCase().includes(searchLower) ||
        post.text.toLowerCase().includes(searchLower) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchLower));
      
      const matchesCampaign = campaignFilter === 'all' || post.campaign === campaignFilter;
      const matchesSocial = socialNetworkFilter === 'all' || post.socialNetwork === socialNetworkFilter;

      return matchesSearch && matchesCampaign && matchesSocial;
    })
  }, [posts, searchTerm, campaignFilter, socialNetworkFilter]);

  const postsForSelectedDay = useMemo(() => {
    if (!selectedDate) return [];
    return filteredPosts.filter(p => isSameDay(new Date(p.publicationDate), selectedDate));
  }, [filteredPosts, selectedDate]);
  
  const handleNewPost = () => {
    setPostToEdit(null);
    setIsFormOpen(true);
  }

  const handleEditPost = (post: EditorialPost) => {
    setPostToEdit(post);
    setIsFormOpen(true);
  }

  const handleDeleteRequest = (post: EditorialPost) => {
    setPostToDelete(post);
  }
  
  const handlePreviewPost = (post: EditorialPost) => {
    setPostToPreview(post);
    setIsPreviewOpen(true);
  }

  const handleDeletePost = async () => {
    if (!postToDelete) return;

    try {
        await deleteDoc(doc(db, "editorialPosts", postToDelete.id));
        toast({
            title: "Publicación Eliminada",
            description: "La publicación ha sido eliminada con éxito.",
        });
    } catch (error) {
        console.error("Error deleting post:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo eliminar la publicación. Por favor, inténtalo de nuevo.",
        });
    } finally {
        setPostToDelete(null);
    }
  }

  const handleSavePost = async (postData: Omit<EditorialPost, 'id' | 'creationDate'>, id?: string) => {
    try {
      if (id) {
        const postRef = doc(db, "editorialPosts", id);
        await updateDoc(postRef, postData);
        toast({
            title: "Publicación Actualizada",
            description: "Tu publicación ha sido actualizada correctamente.",
        });
      } else {
        await addDoc(collection(db, "editorialPosts"), {
            ...postData,
            creationDate: new Date().toISOString(),
        });
        toast({
            title: "Publicación Creada",
            description: "Tu nueva publicación se ha guardado correctamente.",
        });
      }
      setIsFormOpen(false);
      setPostToEdit(null);
    } catch (error) {
      console.error("Error saving post:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar la publicación. Por favor, inténtalo de nuevo.",
      });
    }
  };

  const handleImportComplete = (summary: { success: number, errors: number }) => {
    toast({
        title: "Importación Completada",
        description: `${summary.success} publicaciones importadas con éxito. ${summary.errors} filas fallaron.`,
    });
    setIsImportOpen(false);
  }

  const allCampaigns = useMemo(() => {
    const campaignSet = new Set(posts.map(p => p.campaign).filter(Boolean));
    return Array.from(campaignSet);
  }, [posts]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
      <div className="flex flex-col md:flex-row h-full gap-6">
          <div className="flex-1 min-w-0">
              <PageHeader title="Calendario Editorial">
                  <div className="flex items-center gap-2">
                      <ExportButton posts={posts} />
                      <Button variant="outline" onClick={() => setIsImportOpen(true)}>
                          <Upload className="mr-2 h-4 w-4" />
                          Importar
                      </Button>
                  </div>
              </PageHeader>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative w-full sm:max-w-xs">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                          placeholder="Buscar por texto..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                      />
                  </div>
                  <Select value={socialNetworkFilter} onValueChange={setSocialNetworkFilter}>
                      <SelectTrigger className="w-full sm:w-[200px]">
                          <SelectValue placeholder="Filtrar por red social" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">Todas las redes</SelectItem>
                          <SelectItem value="Instagram">Instagram</SelectItem>
                          <SelectItem value="Facebook">Facebook</SelectItem>
                          <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                          <SelectItem value="X">X (Twitter)</SelectItem>
                          <SelectItem value="TikTok">TikTok</SelectItem>
                      </SelectContent>
                  </Select>
                   <Select value={campaignFilter} onValueChange={setCampaignFilter}>
                      <SelectTrigger className="w-full sm:w-[200px]">
                          <SelectValue placeholder="Filtrar por campaña" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">Todas las campañas</SelectItem>
                          {allCampaigns.map(campaign => (
                            <SelectItem key={campaign} value={campaign}>{campaign}</SelectItem>  
                          ))}
                      </SelectContent>
                  </Select>
              </div>
              <CalendarView 
                  onNewPost={handleNewPost}
                  posts={filteredPosts}
                  currentDate={currentDate}
                  setCurrentDate={setCurrentDate}
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
              />
          </div>
           {(isMobile && postsForSelectedDay.length > 0) || !isMobile ? (
              <aside className="w-full shrink-0 md:w-96 md:border-l md:bg-secondary/50 dark:md:bg-background/50 md:overflow-y-auto">
                  <DayDetailsSidebar 
                      selectedDate={selectedDate}
                      posts={postsForSelectedDay}
                      onEditPost={handleEditPost}
                      onDeletePost={handleDeleteRequest}
                      onPreviewPost={handlePreviewPost}
                  />
              </aside>
          ) : null}
          <PostFormDialog
              key={postToEdit?.id || 'new'}
              open={isFormOpen}
              onOpenChange={setIsFormOpen}
              onSave={handleSavePost}
              selectedDate={selectedDate}
              post={postToEdit}
              mediaFiles={mediaFiles}
              campaigns={campaigns}
              allTags={tags}
          />
          <DeletePostDialog
              open={!!postToDelete}
              onOpenChange={() => setPostToDelete(null)}
              onConfirm={handleDeletePost}
              postTitle={postToDelete?.title}
          />
          <ImportDialog 
              open={isImportOpen}
              onOpenChange={setIsImportOpen}
              onImportComplete={handleImportComplete}
          />
          {postToPreview && (
          <PostPreviewDialog
              open={isPreviewOpen}
              onOpenChange={setIsPreviewOpen}
              post={postToPreview}
          />
          )}
      </div>
    </div>
  );
}

export default withAuth(CalendarPage);
