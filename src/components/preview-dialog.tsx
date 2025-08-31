
"use client"

import * as React from "react"
import { useState, useRef } from "react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ChevronLeft, ChevronRight, X, Tag as TagIcon, Trash2, Download, ImagePlus, Loader2, Edit, Link, Copy, Check } from "lucide-react"
import type { MediaFile, Tag } from "@/lib/types"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CreatableCombobox } from "@/components/ui/combobox"
import { Input } from "./ui/input"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import { useAuth } from "@/context/auth-context"

type PreviewDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedFile: MediaFile
  onNext: () => void
  onPrevious: () => void
  hasNext: boolean
  hasPrevious: boolean
  allTags: Tag[]
  onAddTag: (fileId: string, tagLabel: string) => void
  onRemoveTag: (fileId: string, tagId: string) => void
  onDelete: (fileId: string) => void
  onDownload: () => void;
  onUpdateThumbnail: (fileId: string, thumbnailFile: File) => Promise<void>;
  onEdit: (fileId: string) => void;
}

export default function PreviewDialog({ open, onOpenChange, selectedFile, onNext, onPrevious, hasNext, hasPrevious, allTags, onAddTag, onRemoveTag, onDelete, onDownload, onUpdateThumbnail, onEdit }: PreviewDialogProps) {
  const [newTag, setNewTag] = useState("")
  const [isUploadingThumb, setIsUploadingThumb] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const { isCopied, copy } = useCopyToClipboard();
  const { user } = useAuth();

  if (!selectedFile) return null;
  
  const fileTags = selectedFile.tags.map(tagId => allTags.find(t => t.id === tagId)).filter(Boolean) as Tag[];
  const isExternal = !selectedFile.url.includes('firebasestorage.googleapis.com');

  const handleAddTag = (tagLabel: string) => {
    if(tagLabel.trim()){
      onAddTag(selectedFile.id, tagLabel.trim());
      setNewTag("");
    }
  }

  const handleThumbnailChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        setIsUploadingThumb(true);
        try {
            await onUpdateThumbnail(selectedFile.id, file);
        } catch (error) {
            // Error is handled in client-page
        } finally {
            setIsUploadingThumb(false);
        }
    }
  }

  const tagOptions = allTags.map(tag => ({ value: tag.label, label: tag.label }));

  const details = [
    { label: "Tipo", value: selectedFile.type === 'image' ? "Imagen" : "Vídeo" },
    { label: "Tamaño", value: `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` },
    { label: "Resolución", value: selectedFile.width && selectedFile.height ? `${selectedFile.width} x ${selectedFile.height}px` : "no guardada" },
    { label: "Subido", value: format(new Date(selectedFile.createdAt), "MMM d, yyyy") }
  ].filter(d => d.value);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] p-0 flex flex-col md:flex-row">
        <DialogHeader className="sr-only">
          <DialogTitle>{selectedFile.name}</DialogTitle>
          <DialogDescription>
              Vista previa del archivo multimedia. Aquí puedes ver el archivo, sus detalles, y realizar acciones como descargar, etiquetar o eliminar.
          </DialogDescription>
        </DialogHeader>
        <div className="relative h-3/5 md:h-full flex-1 flex items-center justify-center bg-black/90">
          {selectedFile.type === 'image' ? (
            <Image
              src={selectedFile.url}
              alt={selectedFile.name}
              fill
              className="object-contain"
              sizes="80vw"
            />
          ) : (
            <video
              src={selectedFile.url}
              controls
              autoPlay
              className="max-w-full max-h-full"
            >
              Your browser does not support the video tag.
            </video>
          )}
        </div>

        <aside className="w-full md:w-80 h-2/5 md:h-full border-t md:border-t-0 md:border-l bg-background flex flex-col">
            <ScrollArea className="flex-1">
                <div className="p-6 space-y-6">
                    <div>
                        <h3 className="font-semibold text-lg break-words">{selectedFile.name}</h3>
                        <div className="text-sm text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                           {details.map(detail => (
                               <React.Fragment key={detail.label}>
                                   <span className="font-medium">{detail.label}</span>
                                   <span>{detail.value}</span>
                               </React.Fragment>
                           ))}
                        </div>
                    </div>

                    <Separator />
                    
                    <div>
                        <h4 className="flex items-center gap-2 font-semibold mb-3">
                            <Link className="h-4 w-4" />
                            URL del archivo
                        </h4>
                        <div className="flex items-center gap-2">
                           <Input value={selectedFile.url} readOnly className="h-9"/>
                           <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => copy(selectedFile.url)}>
                                            {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Copiar URL</p>
                                    </TooltipContent>
                                </Tooltip>
                           </TooltipProvider>
                        </div>
                    </div>


                    {(selectedFile.type === 'video' && !isExternal) && (
                        <div>
                            <h4 className="flex items-center gap-2 font-semibold mb-3">
                                <ImagePlus className="h-4 w-4" />
                                Miniatura
                            </h4>
                            <div className="relative h-40 rounded-md overflow-hidden mb-2">
                                <Image src={selectedFile.thumbnailUrl} alt="Current thumbnail" fill className="object-cover" />
                            </div>
                            <input
                                type="file"
                                ref={thumbnailInputRef}
                                onChange={handleThumbnailChange}
                                accept="image/png, image/jpeg, image/webp"
                                className="hidden"
                            />
                            <Button 
                                variant="outline" 
                                className="w-full" 
                                onClick={() => thumbnailInputRef.current?.click()}
                                disabled={isUploadingThumb || !user}
                            >
                                {isUploadingThumb ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <ImagePlus className="mr-2 h-4 w-4" />
                                )}
                                Cambiar Miniatura
                            </Button>
                        </div>
                    )}
                    
                    <div>
                        <h4 className="flex items-center gap-2 font-semibold mb-3">
                            <TagIcon className="h-4 w-4" />
                            Etiquetas
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {fileTags.map(tag => (
                                <Badge key={tag.id} variant="secondary" className="pl-2">
                                    <span className={cn("h-2 w-2 rounded-full mr-2", tag.color)} />
                                    {tag.label}
                                    <button onClick={() => onRemoveTag(selectedFile.id, tag.id)} className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5">
                                        <X className="h-3 w-3"/>
                                    </button>
                                </Badge>
                            ))}
                        </div>
                        <div className="relative mt-4">
                            <CreatableCombobox 
                                options={tagOptions}
                                value={newTag}
                                onChange={(value) => handleAddTag(value)}
                                onCreate={handleAddTag}
                                placeholder="Añadir una etiqueta..."
                                searchPlaceholder="Buscar o crear una etiqueta..."
                            />
                        </div>
                    </div>
                </div>
            </ScrollArea>
             <div className="border-t p-4 flex gap-2">
                <Button variant="outline" className="w-full" onClick={onDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Descargar
                </Button>
                 {isExternal && (
                    <Button variant="outline" className="w-full" onClick={() => onEdit(selectedFile.id)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                    </Button>
                )}
                <Button variant="destructive" className="w-full" onClick={() => onDelete(selectedFile.id)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                </Button>
            </div>
        </aside>

        {hasPrevious && (
            <Button
                variant="ghost"
                size="icon"
                onClick={onPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full h-12 w-12 bg-black/50 text-white hover:bg-black/75 hover:text-white md:top-1/2"
            >
                <ChevronLeft className="h-8 w-8" />
            </Button>
        )}
        {hasNext && (
            <Button
                variant="ghost"
                size="icon"
                onClick={onNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full h-12 w-12 bg-black/50 text-white hover:bg-black/75 hover:text-white md:right-[21rem] md:top-1/2"
            >
                <ChevronRight className="h-8 w-8" />
            </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
