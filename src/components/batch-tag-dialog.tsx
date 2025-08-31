
"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Tag } from "lucide-react"
import { CreatableCombobox } from "@/components/ui/combobox"
import { useToast } from "@/hooks/use-toast"

type BatchTagDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onApplyTags: (tags: string[]) => void
  fileCount: number
  allTags: { value: string; label: string }[];
}

export default function BatchTagDialog({
  open,
  onOpenChange,
  onApplyTags,
  fileCount,
  allTags,
}: BatchTagDialogProps) {
  const [tags, setTags] = useState<string[]>([])
  const [inputValue, setInputValue] = useState("")
  const { toast } = useToast()

  const handleAddTag = (newTag: string) => {
    const tagToAdd = newTag.trim();
    if (tagToAdd && !tags.some(t => t.toLowerCase() === tagToAdd.toLowerCase())) {
      setTags([...tags, tagToAdd])
    }
    setInputValue("")
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleApply = () => {
    onApplyTags(tags)
    toast({
      title: "Etiquetas Aplicadas",
      description: `Se agregaron ${tags.length} etiqueta(s) a ${fileCount} archivo(s) con éxito.`,
    })
    reset()
  }
  
  const reset = () => {
    onOpenChange(false);
    setTimeout(() => {
        setTags([]);
        setInputValue('');
    }, 300);
  }

  const tagOptions = allTags.filter(
      (option) => !tags.some(t => t.toLowerCase() === option.label.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Añadir etiquetas a {fileCount} archivo(s)
          </DialogTitle>
          <DialogDescription>
            Selecciona etiquetas existentes o crea nuevas para aplicar a todos los archivos seleccionados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
            <CreatableCombobox 
                options={tagOptions}
                value={inputValue}
                onChange={handleAddTag}
                onCreate={handleAddTag}
                placeholder="Añadir etiquetas..."
                searchPlaceholder="Buscar o crear etiquetas..."
            />
            {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="pl-2">
                        {tag}
                        <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                        >
                        <X className="h-3 w-3" />
                        </button>
                    </Badge>
                    ))}
                </div>
            )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={reset}>Cancelar</Button>
          <Button onClick={handleApply} disabled={tags.length === 0}>
            Aplicar Etiquetas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
