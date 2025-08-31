
"use client"

import type { EditorialPost } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Instagram, Facebook, Linkedin, Twitter, MessageCircle, Link2, MoreVertical, Trash2, Pencil, PlayCircle, Eye, FileText, ImageOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "@/components/ui/accordion"
import { isValidUrl } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

type DayDetailsSidebarProps = {
    selectedDate: Date | null;
    posts: EditorialPost[];
    onEditPost: (post: EditorialPost) => void;
    onDeletePost: (post: EditorialPost) => void;
    onPreviewPost: (post: EditorialPost) => void;
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


export default function DayDetailsSidebar({ selectedDate, posts, onEditPost, onDeletePost, onPreviewPost }: DayDetailsSidebarProps) {
    if (!selectedDate) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                <Calendar className="h-16 w-16 mb-4" />
                <h3 className="text-lg font-semibold">Selecciona un día</h3>
                <p className="text-sm">Haz clic en cualquier día del calendario para ver las publicaciones programadas.</p>
            </div>
        )
    }
    
    const sortedPosts = posts.sort((a,b) => new Date(a.publicationDate).getTime() - new Date(b.publicationDate).getTime());

    return (
        <div className="p-4 sm:p-6">
            <h2 className="text-xl font-bold tracking-tight mb-1">{format(selectedDate, "d 'de' MMMM", { locale: es }).toLowerCase()}</h2>
            <p className="text-muted-foreground mb-6">{format(selectedDate, "EEEE", { locale: es }).toLowerCase()}</p>

            {sortedPosts.length > 0 ? (
                <div className="space-y-4">
                    {sortedPosts.map((post) => (
                        <Card key={post.id} className="bg-card relative group overflow-hidden">
                             <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onPreviewPost(post)}>
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Previsualizar</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEditPost(post)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Editar</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDeletePost(post)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Eliminar</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>

                            {post.mediaUrls && post.mediaUrls.length > 0 && (
                                <Carousel className="w-full">
                                <CarouselContent>
                                    {post.mediaUrls.map((url, index) => (
                                        <CarouselItem key={index}>
                                            <div className="relative aspect-video w-full">
                                                {!isValidUrl(url) ? (
                                                    <div className="w-full h-full bg-secondary flex flex-col items-center justify-center text-destructive">
                                                        <ImageOff className="h-8 w-8" />
                                                        <p className="text-xs mt-2 text-center">URL inválida</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                    {url.includes('.mp4') || url.includes('video') || url.startsWith('data:video') ? (
                                                        <>
                                                            <video src={url} className="h-full w-full object-cover" preload="metadata" />
                                                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                                            <PlayCircle className="h-10 w-10 text-white/80" />
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <Image src={url} alt={`Post media ${index + 1}`} fill sizes="320px" className="object-cover" />
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
                            
                            <CardHeader>
                                <CardTitle className="flex items-start gap-4 text-lg pr-8">
                                    <SocialIcon network={post.socialNetwork} />
                                    <div>
                                        {post.title}
                                        <p className="text-sm font-normal text-muted-foreground">{format(new Date(post.publicationDate), "p", { locale: es })}</p>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm whitespace-pre-wrap">{post.text}</p>
                                {post.explicacion && (
                                    <Accordion type="single" collapsible className="w-full mt-4">
                                        <AccordionItem value="item-1" className="border-b-0">
                                            <AccordionTrigger className="text-xs p-2 rounded-md bg-secondary/50 hover:bg-secondary">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4" />
                                                    Ver Explicación
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="text-xs p-3 pt-2 whitespace-pre-wrap">
                                                {post.explicacion}
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center text-muted-foreground py-16">
                    <p>No hay publicaciones programadas para este día.</p>
                </div>
            )}
        </div>
    )
}
