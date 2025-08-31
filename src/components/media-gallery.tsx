
"use client"

import type { Dispatch, SetStateAction } from "react"
import { cn } from "@/lib/utils"
import type { MediaFile } from "@/lib/types"
import MediaCard from "./media-card"

type MediaGalleryProps = {
  files: MediaFile[]
  selection: Set<string>
  setSelection: Dispatch<SetStateAction<Set<string>>>
  lastSelectedIndex: number | null
  setLastSelectedIndex: Dispatch<SetStateAction<number | null>>
  viewMode: 'grid' | 'list'
  onPreview: (fileId: string) => void
  gridCols: number
}

export default function MediaGallery({
  files,
  selection,
  setSelection,
  lastSelectedIndex,
  setLastSelectedIndex,
  viewMode,
  onPreview,
  gridCols
}: MediaGalleryProps) {

  const handleSelect = (index: number, e: React.MouseEvent | React.KeyboardEvent) => {
    const fileId = files[index].id;
    if (e.nativeEvent instanceof MouseEvent && e.nativeEvent.shiftKey && lastSelectedIndex !== null) {
      const newSelection = new Set(selection);
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      for (let i = start; i <= end; i++) {
        newSelection.add(files[i].id);
      }
      setSelection(newSelection);
    } else {
      const newSelection = new Set(selection);
      if (newSelection.has(fileId)) {
        newSelection.delete(fileId);
      } else {
        newSelection.add(fileId);
      }
      setSelection(newSelection);
    }
    setLastSelectedIndex(index);
  };
  
  if (files.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-muted-foreground">No media files found.</p>
      </div>
    );
  }

  const gridClasses: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  };

  return (
    <div
      className={cn(
        "w-full",
        viewMode === 'grid' 
          ? `grid ${gridClasses[gridCols] || 'grid-cols-4'} gap-4`
          : 'flex flex-col gap-2'
      )}
    >
      {files.map((file, index) => (
        <MediaCard
          key={file.id}
          file={file}
          isSelected={selection.has(file.id)}
          onSelect={(e) => handleSelect(index, e)}
          onCardClick={() => onPreview(file.id)}
          viewMode={viewMode}
          priority={index < 8}
        />
      ))}
    </div>
  )
}

    

    