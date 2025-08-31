
"use client"

import Image from "next/image";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Instagram, Facebook, Linkedin, Twitter, MessageCircle, Link2, Calendar, Tag, PlayCircle, Link as LinkIcon, Edit, FileText, ImageOff, Copy, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge";
import type { EditorialPost } from "@/lib/types";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { cn, isValidUrl } from "@/lib/utils";
import { Button } from "./ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

type PostPreviewDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    post: EditorialPost;
};

const socialNetworkIcons: Record<string, React.ElementType> = {
    Instagram: Instagram,
    Facebook: Facebook,
    LinkedIn: Linkedin,
    X: Twitter,
    TikTok: MessageCircle,
};

const SocialIcon = ({ network }: { network: string }) => {
    const Icon = socialNetworkIcons[network] || Link2;
    return <Icon className="h-5 w-5" />;
};

const statusBadgeVariant: Record<EditorialPost['status'], "default" | "secondary" | "outline"> = {
    'Published': 'default',
    'Scheduled': 'secondary',
    'Draft': 'outline',
}

const statusText: Record<EditorialPost['status'], string> = {
    'Published': 'Publicado',
    'Scheduled': 'Programado',
    'Draft': 'Borrador',
}


export default function PostPreviewDialog({ open, onOpenChange, post }: PostPreviewDialogProps) {
    const [copied, setCopied] = useState<"title" | "text" | null>(null);
    const { toast } = useToast();

    if (!post) return null;

    const handleCopy = (textToCopy: string, type: "title" | "text") => {
        navigator.clipboard.writeText(textToCopy);
        setCopied(type);
        toast({
            title: "Copiado al portapapeles",
        })
        setTimeout(() => setCopied(null), 2000);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-4">
                    <DialogTitle className="text-2xl flex items-center gap-2">
                        <span>{post.title}</span>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                     <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(post.title, "title")}>
                                        {copied === 'title' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Copiar título</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </DialogTitle>
                    <DialogDescription asChild>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-2"><SocialIcon network={post.socialNetwork} /> {post.socialNetwork}</span>
                          <span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {format(new Date(post.publicationDate), "PPP p", { locale: es }).toLowerCase()}</span>
                          <Badge variant={statusBadgeVariant[post.status]}>{statusText[post.status]}</Badge>
                      </div>
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1">
                    <div className="px-6 pb-6 space-y-6">
                        {post.mediaUrls && post.mediaUrls.length > 0 && (
                            <Carousel className="w-full">
                                <CarouselContent>
                                    {post.mediaUrls.map((url, index) => (
                                        <CarouselItem key={index}>
                                            <div className="relative aspect-video w-full rounded-lg overflow-hidden">
                                                {!isValidUrl(url) ? (
                                                     <div className="w-full h-full bg-secondary flex flex-col items-center justify-center text-destructive">
                                                        <ImageOff className="h-8 w-8" />
                                                        <p className="text-xs mt-2 text-center">URL inválida</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                    {url.includes('.mp4') || url.includes('video') ? (
                                                        <video src={url} controls className="h-full w-full object-cover bg-black" preload="metadata" />
                                                    ) : (
                                                        <Image src={url} alt={`Post media ${index + 1}`} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                                                    )}
                                                    </>
                                                )}
                                            </div>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                {post.mediaUrls.length > 1 && (
                                    <>
                                        <CarouselPrevious className="left-2" />
                                        <CarouselNext className="right-2" />
                                    </>
                                )}
                            </Carousel>
                        )}

                        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap relative group">
                            <p>{post.text}</p>
                             <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 absolute -top-1 -right-2 opacity-0 group-hover:opacity-100" onClick={() => handleCopy(post.text, "text")}>
                                            {copied === 'text' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Copiar texto</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        
                        {post.explicacion && (
                          <div className="p-4 rounded-lg bg-secondary/50">
                              <h4 className="flex items-center gap-2 font-semibold mb-2 text-sm">
                                  <FileText className="h-4 w-4" />
                                  Explicación Interna
                              </h4>
                              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                                  <p>{post.explicacion}</p>
                              </div>
                          </div>
                        )}
                        
                        <div className="space-y-4">
                            {post.link && (
                                <div className="flex items-center gap-3">
                                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                                    <a href={post.link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate">
                                        {post.link}
                                    </a>
                                </div>
                            )}

                            {post.campaign && (
                                <div className="flex items-center gap-3">
                                    <Edit className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">Campaña: <span className="font-semibold">{post.campaign}</span></span>
                                </div>
                            )}

                            {post.tags && post.tags.length > 0 && (
                                <div className="flex items-start gap-3">
                                    <Tag className="h-4 w-4 text-muted-foreground mt-1" />
                                    <div className="flex flex-wrap gap-2">
                                        {post.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </ScrollArea>
                
            </DialogContent>
        </Dialog>
    )
}
