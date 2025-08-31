
"use client"

import { Download, Tag, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"

type BatchActionsProps = {
  selectionCount: number
  onClear: () => void
  onTag: () => void
  onDownload: () => void
  onDelete: () => void
}

export default function BatchActions({
  selectionCount,
  onClear,
  onTag,
  onDownload,
  onDelete,
}: BatchActionsProps) {
  return (
    <div className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-fit animate-in fade-in slide-in-from-bottom-5">
      <div className="flex items-center gap-2 rounded-full border bg-background/80 p-2 shadow-lg backdrop-blur-sm">
        <span className="mr-2 hidden rounded-full bg-primary px-3 py-1 text-sm font-medium text-primary-foreground sm:block">
          {selectionCount} seleccionados
        </span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onTag}>
                <Tag className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Añadir etiquetas</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onDownload}>
                <Download className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Descargar</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive hover:text-destructive">
                <Trash2 className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Eliminar</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="mx-2 h-6 w-px bg-border" />
        <Button variant="ghost" size="icon" onClick={onClear}>
          <X className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
