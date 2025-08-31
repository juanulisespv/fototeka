
"use client"

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { z } from 'zod';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { UploadCloud, File as FileIcon, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';


const postImportSchema = z.object({
  title: z.string().min(1, { message: 'El título es obligatorio'}),
  text: z.string().optional().default(''),
  explicacion: z.string().optional().default(''),
  link: z.string().url({ message: "El enlace debe ser una URL válida" }).or(z.literal('')).optional().default(''),
  mediaUrls: z.string().transform(val => val.split(',').map(s => s.trim()).filter(Boolean)).optional().default(''),
  socialNetwork: z.enum(['Instagram', 'Facebook', 'LinkedIn', 'X', 'TikTok'], { errorMap: () => ({ message: "Red social no válida" }) }),
  campaign: z.string().optional().default(''),
  publicationDate: z.string()
    .refine((val) => !isNaN(Date.parse(val)), { message: "Formato de fecha inválido" })
    .transform(str => new Date(str).toISOString()),
  tags: z.string().transform(val => val.split(',').map(s => s.trim()).filter(Boolean)).optional().default(''),
  status: z.enum(['Draft', 'Scheduled', 'Published'], { errorMap: () => ({ message: "Estado no válido" }) }),
});

type ImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: (summary: { success: number; errors: number }) => void;
};

type ImportError = {
    row: number;
    errors: string[];
}

const CHUNK_SIZE = 50;

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export default function ImportDialog({ open, onOpenChange, onImportComplete }: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState<{ success: number; errors: number } | null>(null);
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setSummary(null);
      setImportErrors([]);
      setProgress(0);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'application/json': ['.json'] },
    multiple: false,
  });
  
  const resetState = () => {
    setFile(null);
    setIsLoading(false);
    setProgress(0);
    setSummary(null);
    setImportErrors([]);
  }

  const handleClose = () => {
    if (isLoading) return;
    onOpenChange(false);
    setTimeout(resetState, 300);
  }

  const processImport = async () => {
    if (!file) return;
    setIsLoading(true);
    setImportErrors([]);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      let records: any[];
      
      try {
        if (file.type === 'application/json') {
          records = JSON.parse(content);
        } else {
          const result = Papa.parse(content, { header: true, skipEmptyLines: true });
          records = result.data;
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error al Leer el Archivo', description: 'No se pudo procesar el archivo. Por favor, comprueba su formato.' });
        setIsLoading(false);
        return;
      }
      
      const allErrors: ImportError[] = [];
      let successCount = 0;
      
      for (let i = 0; i < records.length; i += CHUNK_SIZE) {
          const chunk = records.slice(i, i + CHUNK_SIZE);
          const validPostsInChunk: any[] = [];
          
          for (let j = 0; j < chunk.length; j++) {
              const record = chunk[j];
              const rowIndex = i + j;
              const validation = postImportSchema.safeParse(record);

              if (validation.success) {
                  validPostsInChunk.push(validation.data);
              } else {
                  allErrors.push({
                      row: rowIndex + 2, // Account for header row
                      errors: validation.error.issues.map(issue => `${issue.path.join('.')} - ${issue.message}`)
                  });
              }
          }

          if (allErrors.length > 0) {
              setImportErrors(allErrors);
              setIsLoading(false);
              setProgress(0);
              toast({ variant: 'destructive', title: `Importación Cancelada`, description: `Se encontraron errores en tu archivo.` });
              return;
          }

          if (validPostsInChunk.length > 0) {
              const batch = writeBatch(db);
              const postsCollection = collection(db, 'editorialPosts');
              validPostsInChunk.forEach((post) => {
                  const newPostRef = doc(postsCollection);
                  batch.set(newPostRef, { ...post, creationDate: new Date().toISOString() });
              });

              try {
                  await batch.commit();
                  successCount += validPostsInChunk.length;
              } catch (error) {
                  console.error("Firestore batch write error:", error);
                  toast({ variant: 'destructive', title: 'Error de Importación', description: 'No se pudieron guardar algunas publicaciones en la base de datos.' });
                  setIsLoading(false);
                  return;
              }
          }
          
          setProgress(((i + chunk.length) / records.length) * 100);
          await sleep(50); // Small delay to allow UI to update
      }

      setSummary({ success: successCount, errors: allErrors.length });
      onImportComplete({ success: successCount, errors: allErrors.length });
      setIsLoading(false);
    };

    reader.readAsText(file);
  };

  const renderContent = () => {
    if (summary) {
        return (
            <div className="mt-6 flex flex-col items-center justify-center text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                <h3 className="text-xl font-semibold">Importación Completa</h3>
                <p className="text-muted-foreground mt-2">
                    Se importaron {summary.success} publicaciones correctamente.
                </p>
            </div>
        )
    }

    if (importErrors.length > 0) {
        return (
            <div className="mt-4">
                <div className="flex items-center gap-2 text-destructive font-semibold">
                    <AlertCircle className="h-5 w-5" />
                    <p>Importación Cancelada. Se encontraron {importErrors.length} error(es) en tu archivo.</p>
                </div>
                <ScrollArea className="h-48 mt-4 rounded-md border p-4 text-sm">
                    {importErrors.map(error => (
                        <div key={error.row} className="mb-2">
                            <p className="font-bold">Fila {error.row}:</p>
                            <ul className="list-disc pl-5 text-destructive/80">
                                {error.errors.map((msg, i) => <li key={i}>{msg}</li>)}
                            </ul>
                        </div>
                    ))}
                </ScrollArea>
            </div>
        )
    }

    return (
        <>
        <Accordion type="single" collapsible className="w-full mt-4">
            <AccordionItem value="item-1">
                <AccordionTrigger>Ver ejemplo de estructura</AccordionTrigger>
                <AccordionContent>
                    <div className="text-xs text-muted-foreground space-y-2 p-2 rounded-md bg-secondary/50">
                        <p>Tu archivo debe ser un CSV o JSON con las siguientes columnas/claves:</p>
                        <code className="block p-2 rounded bg-background text-wrap">title, text, explicacion, link, mediaUrls, socialNetwork, campaign, publicationDate, tags, status</code>
                        <p className="font-semibold">Ejemplo JSON:</p>
                        <pre className="p-2 rounded bg-background whitespace-pre-wrap">
{`[
  {
    "title": "Nuevo Lanzamiento",
    "text": "Descubre nuestro increíble producto nuevo.",
    "explicacion": "Campaña de Q2 para el producto X.",
    "publicationDate": "2024-09-15T10:00:00.000Z",
    "socialNetwork": "Instagram",
    "status": "Scheduled",
    "link": "https://example.com/new-product",
    "campaign": "Lanzamiento Q2",
    "tags": "nuevo, innovador",
    "mediaUrls": "https://picsum.photos/1080/1080,https://picsum.photos/1080/1350"
  }
]`}
                        </pre>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
        <div {...getRootProps()} className={`mt-4 border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary'}`}>
          <input {...getInputProps()} />
          <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">
            {isDragActive ? "Suelta el archivo aquí..." : "Arrastra y suelta un archivo, o haz clic para seleccionar"}
          </p>
           <p className="text-xs text-muted-foreground mt-2">Soporta CSV y JSON</p>
        </div>
        
        {file && (
          <div className="mt-4 flex items-center gap-4 rounded-md border p-3">
            <FileIcon className="h-6 w-6 text-muted-foreground" />
            <div className="flex-1">
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
            </div>
            {isLoading && <Progress value={progress} className="w-1/3" />}
          </div>
        )}
      </>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Importar Publicaciones</DialogTitle>
          <DialogDescription>
            Sube un archivo CSV o JSON para crear publicaciones de forma masiva. El archivo será validado antes de la importación.
          </DialogDescription>
        </DialogHeader>

        {renderContent()}
        
        <DialogFooter className='mt-4'>
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                {summary || importErrors.length > 0 ? "Cerrar" : "Cancelar"}
            </Button>
            {!summary && (
              <Button onClick={importErrors.length > 0 ? () => setImportErrors([]) : processImport} disabled={!file || isLoading}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importando...</> : (importErrors.length > 0 ? "Intentar de Nuevo" : "Iniciar Importación")}
              </Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
