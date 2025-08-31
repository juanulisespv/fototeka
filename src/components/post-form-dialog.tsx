
"use client"

import { useEffect, useState, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon, ImagePlus, Link, Trash2, X, ImageOff } from "lucide-react"
import Image from "next/image"

import { cn, isValidUrl } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "./ui/scroll-area"
import type { EditorialPost, MediaFile, Campaign, Tag } from "@/lib/types"
import MediaSelectorDialog from "./media-selector-dialog"
import { Combobox, CreatableCombobox } from "./ui/combobox"

const postFormSchema = z.object({
  title: z.string().min(2, {
    message: "El título debe tener al menos 2 caracteres.",
  }),
  text: z.string().optional(),
  explicacion: z.string().optional(),
  link: z.string().url({ message: "Por favor, introduce una URL válida." }).optional().or(z.literal('')),
  mediaUrls: z.array(z.string()).optional(),
  socialNetwork: z.enum(['Instagram', 'Facebook', 'LinkedIn', 'X', 'TikTok'], { required_error: "Debes seleccionar una red social."}),
  campaign: z.string().optional(),
  publicationDate: z.date({
    required_error: "La fecha de publicación es obligatoria.",
  }),
  status: z.enum(['Draft', 'Scheduled', 'Published']),
  tags: z.string().optional(), // Simple string for now, can be parsed into an array
})

type PostFormValues = z.infer<typeof postFormSchema>

type PostFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: Omit<any, 'id' | 'creationDate'>, id?: string) => void
  selectedDate?: Date | null
  post?: EditorialPost | null;
  mediaFiles: MediaFile[];
  campaigns: Campaign[];
  allTags: Tag[];
}

export default function PostFormDialog({ open, onOpenChange, onSave, selectedDate, post, mediaFiles, campaigns, allTags }: PostFormDialogProps) {
  const [isMediaSelectorOpen, setIsMediaSelectorOpen] = useState(false);
  
  const form = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: "",
      text: "",
      explicacion: "",
      link: "",
      mediaUrls: [],
      campaign: "",
      status: "Draft",
      tags: ""
    },
  })

  useEffect(() => {
    if (post) {
      form.reset({
        title: post.title,
        text: post.text,
        explicacion: post.explicacion,
        link: post.link,
        mediaUrls: post.mediaUrls || [],
        socialNetwork: post.socialNetwork,
        campaign: post.campaign,
        publicationDate: new Date(post.publicationDate),
        status: post.status,
        tags: post.tags?.join(', ') || '',
      });
    } else if (selectedDate) {
        form.reset({
            ...form.getValues(),
            publicationDate: selectedDate,
            mediaUrls: [],
        });
    }
  }, [post, selectedDate, form, open])

  function onSubmit(data: PostFormValues) {
    const postData = {
        ...data,
        publicationDate: data.publicationDate.toISOString(),
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
    };
    onSave(postData, post?.id)
  }

  const handleMediaSelect = (selectedFiles: MediaFile[]) => {
    const currentUrls = form.getValues('mediaUrls') || [];
    const newUrls = selectedFiles.map(f => f.url);
    const combined = Array.from(new Set([...currentUrls, ...newUrls]));
    form.setValue('mediaUrls', combined, { shouldDirty: true });
    setIsMediaSelectorOpen(false);
  }

  const handleRemoveMedia = (urlToRemove: string) => {
    const currentUrls = form.getValues('mediaUrls') || [];
    form.setValue('mediaUrls', currentUrls.filter(url => url !== urlToRemove), { shouldDirty: true });
  }

  const watchedMediaUrls = form.watch('mediaUrls') || [];

  const selectedMedia = useMemo(() => {
    const foundInLibrary = mediaFiles.filter(mf => watchedMediaUrls.includes(mf.url));
    const notFoundUrls = watchedMediaUrls.filter(url => !mediaFiles.some(mf => mf.url === url));
    
    const externalMediaAsFiles: MediaFile[] = notFoundUrls.map(url => ({
        id: url, // Use URL as a temporary unique key
        url: url,
        thumbnailUrl: url,
        name: 'Archivo externo',
        type: url.includes('.mp4') || url.includes('.mov') ? 'video' : 'image',
        size: 0,
        createdAt: new Date().toISOString(),
        tags: [],
    }));

    return [...foundInLibrary, ...externalMediaAsFiles];
  }, [watchedMediaUrls, mediaFiles]);

  const campaignOptions = useMemo(() => {
      return campaigns.map(c => ({ value: c.title, label: c.title}));
  }, [campaigns]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{post ? "Editar Publicación" : "Crear Nueva Publicación"}</DialogTitle>
            <DialogDescription>
              Rellena los detalles de tu publicación. Haz clic en guardar cuando hayas terminado.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <ScrollArea className="h-[60vh] p-4">
                <div className="space-y-8">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input placeholder="p. ej., Lanzamiento de nuestro nuevo producto" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <FormLabel>Contenido Multimedia</FormLabel>
                    <div className="mt-2 flex items-center gap-4">
                         <Button type="button" variant="outline" onClick={() => setIsMediaSelectorOpen(true)}>
                            <ImagePlus className="mr-2 h-4 w-4" />
                            Seleccionar de la Biblioteca
                        </Button>
                    </div>
                    {selectedMedia.length > 0 && (
                        <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                            {selectedMedia.map(file => (
                                <div key={file.id} className="relative group aspect-square">
                                    {isValidUrl(file.thumbnailUrl) ? (
                                        <Image src={file.thumbnailUrl} alt={file.name} fill sizes="150px" className="rounded-md object-cover" />
                                    ) : (
                                        <div className="w-full h-full rounded-md bg-secondary flex flex-col items-center justify-center text-destructive">
                                            <ImageOff className="h-8 w-8" />
                                            <p className="text-xs mt-2 text-center break-all">{file.name}</p>
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveMedia(file.url)}
                                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Texto</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Cuéntanos un poco sobre esta publicación"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="explicacion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Explicación</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Añade una explicación o nota interna..."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                      control={form.control}
                      name="socialNetwork"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Red Social</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona una red social" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Instagram">Instagram</SelectItem>
                              <SelectItem value="Facebook">Facebook</SelectItem>
                              <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                              <SelectItem value="X">X (antes Twitter)</SelectItem>
                              <SelectItem value="TikTok">TikTok</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un estado" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Draft">Borrador</SelectItem>
                              <SelectItem value="Scheduled">Programado</SelectItem>
                              <SelectItem value="Published">Publicado</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="publicationDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Fecha de Publicación</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: es })
                                ) : (
                                  <span>Elige una fecha</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              locale={es}
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="link"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Enlace (URL)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://ejemplo.com/promo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                      control={form.control}
                      name="campaign"
                      render={({ field }) => (
                          <FormItem>
                              <FormLabel>Campaña</FormLabel>
                              <FormControl>
                                   <Combobox
                                      options={campaignOptions}
                                      value={field.value}
                                      onChange={field.onChange}
                                      placeholder="Seleccionar campaña..."
                                      searchPlaceholder="Buscar campaña..."
                                      noResultsMessage="No se encontró la campaña."
                                  />
                              </FormControl>
                              <FormMessage />
                          </FormItem>
                      )}
                  />
                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Etiquetas</FormLabel>
                        <FormControl>
                          <Input placeholder="p. ej., rebajas, promo, nuevo" {...field} />
                        </FormControl>
                        <FormDescription>
                          Separa las etiquetas con una coma.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </ScrollArea>
              <DialogFooter className="pt-6 border-t mt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <Button type="submit">Guardar Publicación</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <MediaSelectorDialog
        open={isMediaSelectorOpen}
        onOpenChange={setIsMediaSelectorOpen}
        mediaFiles={mediaFiles}
        allTags={allTags}
        onSelect={handleMediaSelect}
        selectedUrls={form.getValues('mediaUrls') || []}
      />
    </>
  )
}
