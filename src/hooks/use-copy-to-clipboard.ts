
"use client"

import { useState } from "react";
import { useToast } from "./use-toast";

export function useCopyToClipboard() {
    const [isCopied, setIsCopied] = useState(false);
    const { toast } = useToast();

    const copy = (text: string) => {
        navigator.clipboard.writeText(text)
            .then(() => {
                setIsCopied(true);
                toast({
                    title: "Copiado al portapapeles",
                });
                setTimeout(() => setIsCopied(false), 2000);
            })
            .catch(err => {
                console.error("Failed to copy text: ", err);
                toast({
                    variant: "destructive",
                    title: "Error al copiar",
                    description: "No se pudo copiar el texto al portapapeles."
                });
            });
    }

    return { isCopied, copy };
}
