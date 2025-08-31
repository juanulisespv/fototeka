
"use client"

import type { Dispatch, SetStateAction } from "react"
import { Grid, List, Search, UploadCloud, ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

type HeaderProps = {
  onUploadClick: () => void
  viewMode: "grid" | "list"
  setViewMode: Dispatch<SetStateAction<"grid" | "list">>
  searchTerm: string
  setSearchTerm: Dispatch<SetStateAction<string>>
  gridCols: number
  setGridCols: Dispatch<SetStateAction<number>>
}

export default function Header({
  onUploadClick,
  viewMode,
  setViewMode,
  searchTerm,
  setSearchTerm,
  gridCols,
  setGridCols
}: HeaderProps) {
  
  const sizeControls = viewMode === 'grid' && (
      <div className="flex items-center gap-2 w-full sm:w-40">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
               <Button variant="ghost" size="icon" onClick={() => setGridCols(c => Math.min(c + 1, 6))}><ZoomOut className="h-5 w-5"/></Button>
            </TooltipTrigger>
            <TooltipContent><p>Reducir tamaño</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => setGridCols(c => Math.max(c - 1, 1))}><ZoomIn className="h-5 w-5"/></Button>
            </TooltipTrigger>
            <TooltipContent><p>Aumentar tamaño</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
         <Slider
          value={[gridCols]}
          onValueChange={(value) => setGridCols(value[0])}
          min={1}
          max={6}
          step={1}
          inverted={true}
          className="w-full"
          aria-label="Grid columns"
        />
      </div>
  );

  return (
    <header className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4 w-full">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                placeholder="Buscar por nombre, descripción o etiqueta..."
                className="pl-10 text-base md:text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className={cn("hidden sm:flex items-center gap-2", gridCols !== 1 && "order-last")}>
                {sizeControls}
            </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="sm:hidden flex-1">
                {sizeControls}
            </div>
            <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('grid')}
                    aria-label='Vista de cuadrícula'
                >
                    <Grid className="h-5 w-5" />
                </Button>
                </TooltipTrigger>
                <TooltipContent>
                <p>Vista de cuadrícula</p>
                </TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('list')}
                    aria-label='Vista de lista'
                >
                    <List className="h-5 w-5" />
                </Button>
                </TooltipTrigger>
                <TooltipContent>
                <p>Vista de lista</p>
                </TooltipContent>
            </Tooltip>
            </TooltipProvider>
            <Button onClick={onUploadClick} className="ml-auto sm:ml-4 flex-1 sm:flex-initial">
            <UploadCloud className="mr-2 h-4 w-4" />
            Subir
            </Button>
        </div>
    </header>
  )
}

    

    