
"use client"

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { z } from 'zod';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { UploadCloud, File as FileIcon, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

const campaignImportSchema = z.object({
  title: z.string().min(3, { message: "El título debe tener al menos 3 caracteres." }),
  stars: z.coerce.number().min(1, {message: "Las estrellas deben ser al menos 1"}).max(5, {message: "Las estrellas no pueden ser más de 5"}),
  desc: z.string().min(10, { message: "La descripción debe tener al menos 10 caracteres." }),
  example: z.string().min(5, { message: "El ejemplo debe tener al menos 5 caracteres." }),
  objective: z.string().min(10, { message: "El objetivo debe tener al menos 10 caracteres." }),
  format: z.string().min(5, { message: "El formato debe tener al menos 5 caracteres." }),
});

type ImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: (summary: { success: number; errors: number }) => void;
  currentOrder: number;
};

type ImportError = {
    row: number;
    errors: string[];
}

const CHUNK_SIZE = 50;

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


export default function CampaignImportDialog({ open, onOpenChange, onImportComplete, currentOrder }: ImportDialogProps) {
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
          const validCampaignsInChunk: any[] = [];
          
          for (let j = 0; j < chunk.length; j++) {
              const record = chunk[j];
              const rowIndex = i + j;
              const validation = campaignImportSchema.safeParse(record);

              if (validation.success) {
                  validCampaignsInChunk.push(validation.data);
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

          if (validCampaignsInChunk.length > 0) {
              const batch = writeBatch(db);
              const campaignsCollection = collection(db, 'campaigns');
              validCampaignsInChunk.forEach((campaign, index) => {
                  const newCampaignRef = doc(campaignsCollection);
                  batch.set(newCampaignRef, { 
                    ...campaign, 
                    order: currentOrder + i + index,
                    createdAt: serverTimestamp() 
                  });
              });

              try {
                  await batch.commit();
                  successCount += validCampaignsInChunk.length;
              } catch (error) {
                  console.error("Firestore batch write error:", error);
                  toast({ variant: 'destructive', title: 'Error de Importación', description: 'No se pudieron guardar algunas campañas en la base de datos.' });
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
                    Se importaron {summary.success} campañas correctamente.
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
                        <code className="block p-2 rounded bg-background">title, stars, desc, example, objective, format</code>
                        <p className="font-semibold">Ejemplo JSON:</p>
                        <pre className="p-2 rounded bg-background whitespace-pre-wrap">
{`[
  {
    "title": "Campaña de Producto",
    "stars": 5,
    "desc": "Destacar novedades y beneficios clave.",
    "example": "Nueva serie Filux Pro...",
    "objective": "Impulsar ventas directas.",
    "format": "Fichas visuales, comparativas."
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar Campañas</DialogTitle>
          <DialogDescription>
            Sube un archivo CSV o JSON para crear campañas de forma masiva. El archivo será validado antes de la importación.
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
