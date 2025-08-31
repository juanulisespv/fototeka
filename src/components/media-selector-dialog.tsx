
"use client"

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox";
import type { MediaFile, Tag } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PlayCircle, Search } from "lucide-react";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Combobox } from "./ui/combobox";

const INITIAL_LOAD_COUNT = 25;
const LOAD_MORE_COUNT = 25;

type MediaSelectorDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mediaFiles: MediaFile[];
    allTags: Tag[];
    selectedUrls: string[];
    onSelect: (selectedFiles: MediaFile[]) => void;
};

export default function MediaSelectorDialog({ open, onOpenChange, mediaFiles, allTags, selectedUrls, onSelect }: MediaSelectorDialogProps) {
    const [selection, setSelection] = useState<Set<string>>(new Set(selectedUrls));
    const [searchTerm, setSearchTerm] = useState("");
    const [fileTypeFilter, setFileTypeFilter] = useState<'all' | 'image' | 'video'>('all');
    const [tagFilter, setTagFilter] = useState<string>('all');
    const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD_COUNT);

    useEffect(() => {
        if(open) {
            setSelection(new Set(selectedUrls));
            setVisibleCount(INITIAL_LOAD_COUNT);
            setSearchTerm("");
            setFileTypeFilter('all');
            setTagFilter('all');
        }
    }, [open, selectedUrls]);

    const filteredMedia = useMemo(() => {
        return mediaFiles.filter(file => {
            if (fileTypeFilter !== 'all' && file.type !== fileTypeFilter) return false;
            if (tagFilter !== 'all' && !file.tags.includes(tagFilter)) return false;
            
            const searchLower = searchTerm.toLowerCase();
            if (searchLower) {
                const fileTags = file.tags.map(tagId => allTags.find(t => t.id === tagId)?.label || '').join(' ');
                return (
                    file.name.toLowerCase().includes(searchLower) ||
                    (file.description || '').toLowerCase().includes(searchLower) ||
                    fileTags.toLowerCase().includes(searchLower)
                );
            }
            return true;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [mediaFiles, fileTypeFilter, tagFilter, searchTerm, allTags]);

    const displayedMedia = useMemo(() => {
        return filteredMedia.slice(0, visibleCount);
    }, [filteredMedia, visibleCount]);

    const tagOptions = useMemo(() => {
        return [{value: 'all', label: 'Todas las etiquetas'}, ...allTags.map(t => ({ value: t.id, label: t.label }))]
    }, [allTags]);
    
    const handleToggle = (file: MediaFile) => {
        setSelection(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(file.url)) {
                newSelection.delete(file.url);
            } else {
                newSelection.add(file.url);
            }
            return newSelection;
        });
    }

    const handleConfirm = () => {
        const selectedFiles = mediaFiles.filter(file => selection.has(file.url));
        onSelect(selectedFiles);
    }
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Seleccionar Multimedia</DialogTitle>
                    <DialogDescription>
                        Elige fotos o vídeos de tu biblioteca para añadir a la publicación.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col sm:flex-row gap-2 border-b pb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Buscar por nombre o etiqueta..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={fileTypeFilter} onValueChange={(v: any) => setFileTypeFilter(v)}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Tipo de archivo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los tipos</SelectItem>
                            <SelectItem value="image">Imágenes</SelectItem>
                            <SelectItem value="video">Vídeos</SelectItem>
                        </SelectContent>
                    </Select>
                     <Combobox 
                        options={tagOptions}
                        value={tagFilter}
                        onChange={setTagFilter}
                        placeholder="Filtrar por etiqueta"
                        searchPlaceholder="Buscar etiqueta..."
                        noResultsMessage="No se encontraron etiquetas."
                        triggerClassName="w-full sm:w-[180px]"
                     />
                </div>
                <ScrollArea className="flex-1 -mx-6">
                    <div className="px-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {displayedMedia.map(file => (
                             <div 
                                key={file.id} 
                                className="relative group cursor-pointer"
                                onClick={() => handleToggle(file)}
                            >
                                <div className={cn(
                                    "absolute inset-0 rounded-md ring-offset-background transition-all ring-2 ring-transparent",
                                    selection.has(file.url) && "ring-primary ring-offset-2"
                                )}/>
                                <Checkbox
                                    checked={selection.has(file.url)}
                                    className="absolute top-2 right-2 z-10 h-5 w-5 border-white text-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                    aria-label={`Select ${file.name}`}
                                />
                                <div className="relative aspect-square w-full overflow-hidden rounded-md">
                                    <Image 
                                        src={file.thumbnailUrl}
                                        alt={file.name}
                                        fill
                                        sizes="(max-width: 768px) 33vw, 20vw"
                                        className="object-cover"
                                    />
                                    {file.type === 'video' && (
                                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                            <PlayCircle className="h-8 w-8 text-white/80" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs font-medium truncate mt-1">{file.name}</p>
                            </div>
                        ))}
                    </div>
                    {displayedMedia.length === 0 && (
                        <div className="text-center py-16 text-muted-foreground">
                            <p>No se encontraron archivos.</p>
                        </div>
                    )}
                </ScrollArea>
                {filteredMedia.length > visibleCount && (
                    <div className="flex justify-center mt-4">
                        <Button variant="outline" onClick={() => setVisibleCount(v => v + LOAD_MORE_COUNT)}>
                            Cargar más
                        </Button>
                    </div>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleConfirm}>
                        Confirmar ({selection.size} seleccionados)
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
