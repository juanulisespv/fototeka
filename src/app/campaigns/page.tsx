
'use client';

import { useState, useMemo, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Star, MoreVertical, Pencil, Trash2, Plus, Upload } from 'lucide-react';
import withAuth from "@/hoc/withAuth";
import type { Campaign } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import CampaignFormDialog from '@/components/campaign-form-dialog';
import DeleteCampaignDialog from '@/components/delete-campaign-dialog';
import CampaignImportDialog from '@/components/campaign-import-dialog';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

function CampaignCard({ campaign, onEdit, onDelete }: { campaign: Campaign, onEdit: () => void, onDelete: () => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: campaign.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 'auto',
    };

    return (
        <div ref={setNodeRef} style={style} className="touch-none">
            <Card className={cn("h-full group", isDragging && "shadow-2xl")}>
                <CardHeader>
                    <CardTitle className="flex items-start justify-between">
                       <div className="flex-1 pr-2">
                            <span>{campaign.title.charAt(0).toUpperCase() + campaign.title.slice(1).toLowerCase()}</span>
                            <div className="flex items-center mt-1">
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <Star key={index} className={cn("h-4 w-4 text-muted-foreground", index < campaign.stars && "fill-current text-yellow-500")} />
                                ))}
                            </div>
                        </div>
                         <div className="flex items-center">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={onEdit}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={onDelete} className="text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Eliminar
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <div {...attributes} {...listeners} className="cursor-grab p-2 -mr-2">
                                <GripVertical className="h-5 w-5 text-muted-foreground" />
                            </div>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <p><strong>Descripción:</strong> {campaign.desc}</p>
                    <p><strong>Ejemplo:</strong> {campaign.example}</p>
                    <p><strong>Objetivo:</strong> {campaign.objective}</p>
                    <p><strong>Formato:</strong> {campaign.format}</p>
                </CardContent>
            </Card>
        </div>
    );
}


function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [starFilter, setStarFilter] = useState('all');
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [campaignToEdit, setCampaignToEdit] = useState<Campaign | null>(null);
    const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);

    const { toast } = useToast();

    useEffect(() => {
        const q = query(collection(db, "campaigns"), orderBy("order", "asc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const campaignsData: Campaign[] = [];
            querySnapshot.forEach((doc) => {
                campaignsData.push({ id: doc.id, ...doc.data() } as Campaign);
            });
            setCampaigns(campaignsData);
        });

        return () => unsubscribe();
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor)
    );

    const filteredCampaigns = useMemo(() => {
        return campaigns.filter(campaign => {
            const matchesText = searchTerm === '' ||
                campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                campaign.desc.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStars = starFilter === 'all' || campaign.stars === parseInt(starFilter, 10);

            return matchesText && matchesStars;
        });
    }, [campaigns, searchTerm, starFilter]);
    
    const handleNewCampaign = () => {
        setCampaignToEdit(null);
        setIsFormOpen(true);
    };

    const handleEditCampaign = (campaign: Campaign) => {
        setCampaignToEdit(campaign);
        setIsFormOpen(true);
    };

    const handleDeleteRequest = (campaign: Campaign) => {
        setCampaignToDelete(campaign);
    };
    
    const handleSaveCampaign = async (data: Omit<Campaign, 'id' | 'createdAt' | 'order'>) => {
        if (campaignToEdit) {
            const campaignRef = doc(db, "campaigns", campaignToEdit.id);
            await updateDoc(campaignRef, data);
        } else {
            await addDoc(collection(db, "campaigns"), {
                ...data,
                order: campaigns.length,
                createdAt: serverTimestamp(),
            });
        }
        setIsFormOpen(false);
    };
    
    const handleDeleteCampaign = async () => {
        if (!campaignToDelete) return;
        await deleteDoc(doc(db, "campaigns", campaignToDelete.id));
        setCampaignToDelete(null);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = campaigns.findIndex((item) => item.id === active.id);
            const newIndex = campaigns.findIndex((item) => item.id === over?.id);
            
            if (oldIndex === -1 || newIndex === -1) return;

            const newCampaigns = arrayMove(campaigns, oldIndex, newIndex);
            setCampaigns(newCampaigns);
            
            const batch = writeBatch(db);
            newCampaigns.forEach((campaign, index) => {
                const docRef = doc(db, "campaigns", campaign.id);
                batch.update(docRef, { order: index });
            });
            await batch.commit();
        }
    };
    
    const handleImportComplete = (summary: { success: number, errors: number }) => {
        toast({
            title: "Importación Completada",
            description: `${summary.success} campañas importadas con éxito. ${summary.errors} filas fallaron.`,
        });
        setIsImportOpen(false);
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
            <PageHeader
                title="Tipos de Campañas"
                description="Explora y organiza los diferentes tipos de campañas de contenido para tu estrategia."
            >
                 <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setIsImportOpen(true)}>
                        <Upload className="mr-2 h-4 w-4" />
                        Importar
                    </Button>
                    <Button onClick={handleNewCampaign}>
                        <Plus className="mr-2 h-4 w-4" />
                        Crear Campaña
                    </Button>
                </div>
            </PageHeader>
            
            <div className="flex flex-col sm:flex-row gap-4">
                <Input
                    placeholder="Filtrar por texto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
                <Select value={starFilter} onValueChange={setStarFilter}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Filtrar por estrellas" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas las estrellas</SelectItem>
                        <SelectItem value="5">⭐⭐⭐⭐⭐</SelectItem>
                        <SelectItem value="4">⭐⭐⭐⭐</SelectItem>
                        <SelectItem value="3">⭐⭐⭐</SelectItem>
                        <SelectItem value="2">⭐⭐</SelectItem>
                        <SelectItem value="1">⭐</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={filteredCampaigns} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                        {filteredCampaigns.map(campaign => (
                            <CampaignCard 
                                key={campaign.id} 
                                campaign={campaign} 
                                onEdit={() => handleEditCampaign(campaign)}
                                onDelete={() => handleDeleteRequest(campaign)}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            <CampaignFormDialog
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                onSave={handleSaveCampaign}
                campaign={campaignToEdit}
            />

            <DeleteCampaignDialog
                open={!!campaignToDelete}
                onOpenChange={() => setCampaignToDelete(null)}
                onConfirm={handleDeleteCampaign}
                campaignName={campaignToDelete?.title}
            />

            <CampaignImportDialog 
                open={isImportOpen}
                onOpenChange={setIsImportOpen}
                onImportComplete={handleImportComplete}
                currentOrder={campaigns.length}
            />
        </div>
    );
}

export default withAuth(CampaignsPage);
