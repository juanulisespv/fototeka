
"use client"

import React, { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
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
import { Progress } from "@/components/ui/progress"
import { UploadCloud, File as FileIcon, X, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { collection, addDoc } from "firebase/firestore"
import { ref, getDownloadURL, uploadBytesResumable } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
import { useAuth } from "@/context/auth-context"

type UploadDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadComplete: (file: any) => void
}

type UploadableFile = {
    file: File;
    progress: number;
    error?: string;
}

// Helper to get dimensions from image/video files
const getFileDimensions = (file: File): Promise<{width: number, height: number} | null> => {
  return new Promise((resolve) => {
    if (file.type.startsWith('image/')) {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => resolve(null);
      img.src = URL.createObjectURL(file);
    } else if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        resolve({ width: video.videoWidth, height: video.videoHeight });
      };
      video.onerror = () => resolve(null);
      video.src = URL.createObjectURL(file);
    } else {
      resolve(null);
    }
  });
};

export default function UploadDialog({ open, onOpenChange, onUploadComplete }: UploadDialogProps) {
  const [files, setFiles] = useState<UploadableFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newUploads = acceptedFiles.map(file => ({ file, progress: 0 }));
    setFiles((prevFiles) => [...prevFiles, ...newUploads]);
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "image/webp": [],
      "video/mp4": [],
      "video/quicktime": [],
      "video/x-msvideo": [],
    },
  })

  const removeFile = (fileName: string) => {
    setFiles(files.filter(f => f.file.name !== fileName));
  }
  
  const handleUpload = async () => {
    if (files.length === 0 || !user) return;
    setIsUploading(true);

    const uploadPromises = files.map((uploadableFile) => {
        return new Promise<void>(async (resolve, reject) => {
            const fileType = uploadableFile.file.type;
            const metadata: { contentType: string, cacheControl?: string } = {
                contentType: fileType,
            };
            
            if (fileType && (fileType.startsWith('image/') || fileType.startsWith('video/'))) {
                metadata.cacheControl = 'public, max-age=31536000, immutable';
            }
            
            const storageRef = ref(storage, `media/${user.uid}/${uploadableFile.file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, uploadableFile.file, metadata);
            
            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setFiles(current => current.map(f => f.file.name === uploadableFile.file.name ? { ...f, progress } : f));
                },
                (error) => {
                    setFiles(current => current.map(f => f.file.name === uploadableFile.file.name ? { ...f, error: error.message } : f));
                    console.error("Upload failed:", error);
                    reject(error);
                },
                async () => {
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        const isVideo = uploadableFile.file.type.startsWith('video/');
                        const dimensions = await getFileDimensions(uploadableFile.file);
                        
                        const fileData: any = {
                            name: uploadableFile.file.name,
                            url: downloadURL,
                            thumbnailUrl: isVideo ? "https://picsum.photos/400/300" : downloadURL,
                            type: isVideo ? 'video' : 'image',
                            size: uploadableFile.file.size,
                            createdAt: new Date().toISOString(),
                            tags: [],
                            dataAiHint: isVideo ? "video reel" : "photo image",
                            width: dimensions?.width,
                            height: dimensions?.height
                        };

                        await addDoc(collection(db, "mediaFiles"), fileData);
                        onUploadComplete(fileData);
                        resolve();
                    } catch (error) {
                         console.error("Firestore document creation failed:", error);
                         reject(error);
                    }
                }
            );
        });
    });

    try {
        await Promise.all(uploadPromises);
        toast({
            title: "Subida completa",
            description: `Se han subido ${files.length} archivo(s) correctamente.`
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error al subir",
            description: "Algunos archivos no se pudieron subir. Por favor, inténtalo de nuevo."
        });
    } finally {
        setIsUploading(false);
        setFiles([]);
        onOpenChange(false);
    }
  }

  const closeDialog = () => {
      if (isUploading) return;
      onOpenChange(false);
      // Give dialog time to close before clearing files
      setTimeout(() => setFiles([]), 300);
  }

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Subir Multimedia</DialogTitle>
          <DialogDescription>
            Arrastra y suelta archivos aquí o haz clic para seleccionarlos. Se admiten imágenes y vídeos.
          </DialogDescription>
        </DialogHeader>
        
        {!isUploading && (
            <div {...getRootProps()} className={`mt-4 border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary'}`}>
                <input {...getInputProps()} />
                <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">
                    {isDragActive ? "Suelta los archivos aquí..." : "Arrastra y suelta algunos archivos aquí, o haz clic para seleccionar archivos"}
                </p>
            </div>
        )}

        {files.length > 0 && (
          <ScrollArea className="mt-4 h-[200px] w-full pr-4">
            <div className="space-y-4">
              {files.map((f, i) => (
                <div key={`${f.file.name}-${i}`} className="flex items-center gap-4">
                  <FileIcon className="h-6 w-6 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium truncate">{f.file.name}</p>
                    <Progress value={f.progress} className={`h-2 mt-1 ${f.error ? 'bg-destructive' : ''}`} />
                    {f.error && <p className="text-xs text-destructive mt-1">{f.error}</p>}
                  </div>
                  {!isUploading && (
                    <Button variant="ghost" size="icon" onClick={() => removeFile(f.file.name)}>
                        <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={isUploading}>Cancelar</Button>
            <Button onClick={handleUpload} disabled={files.length === 0 || isUploading || !user}>
                {isUploading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Subiendo...
                    </>
                ) : `Subir ${files.length} archivo(s)`}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
