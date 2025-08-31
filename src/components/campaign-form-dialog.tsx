
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Campaign } from "@/lib/types";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Star } from "lucide-react";

const CampaignFormSchema = z.object({
  title: z.string().min(3, { message: "El título debe tener al menos 3 caracteres." }),
  desc: z.string().min(10, { message: "La descripción debe tener al menos 10 caracteres." }),
  example: z.string().min(5, { message: "El ejemplo debe tener al menos 5 caracteres." }),
  objective: z.string().min(10, { message: "El objetivo debe tener al menos 10 caracteres." }),
  format: z.string().min(5, { message: "El formato debe tener al menos 5 caracteres." }),
  stars: z.number().min(1).max(5),
});

type CampaignFormValues = z.infer<typeof CampaignFormSchema>;

type CampaignFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<Campaign, 'id' | 'createdAt' | 'order'>) => void;
  campaign: Campaign | null;
};

export default function CampaignFormDialog({ open, onOpenChange, onSave, campaign }: CampaignFormDialogProps) {
  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(CampaignFormSchema),
    defaultValues: {
      title: "",
      desc: "",
      example: "",
      objective: "",
      format: "",
      stars: 3,
    },
  });

  useEffect(() => {
    if (campaign) {
      form.reset({
        title: campaign.title,
        desc: campaign.desc,
        example: campaign.example,
        objective: campaign.objective,
        format: campaign.format,
        stars: campaign.stars,
      });
    } else {
      form.reset({
        title: "",
        desc: "",
        example: "",
        objective: "",
        format: "",
        stars: 3,
      });
    }
  }, [campaign, open, form]);

  const handleSubmit = (data: CampaignFormValues) => {
    onSave(data as any);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{campaign ? "Editar Campaña" : "Crear Nueva Campaña"}</DialogTitle>
          <DialogDescription>
            {campaign ? "Actualiza los detalles de tu campaña." : "Rellena los detalles de tu nueva campaña."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="p. ej., Campaña de Producto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="desc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe brevemente la campaña..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="example"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ejemplo</FormLabel>
                  <FormControl>
                    <Input placeholder="Un ejemplo de titular o post" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="objective"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Objetivo</FormLabel>
                  <FormControl>
                    <Input placeholder="¿Qué se busca conseguir?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="format"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Formato</FormLabel>
                  <FormControl>
                    <Input placeholder="p. ej., Fichas visuales, videos..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="stars"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Importancia (estrellas)</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => field.onChange(parseInt(value, 10))}
                      defaultValue={String(field.value)}
                      className="flex items-center space-x-2"
                    >
                      {[1, 2, 3, 4, 5].map(num => (
                         <FormItem key={num} className="flex items-center space-x-1 space-y-0">
                            <FormControl>
                                <RadioGroupItem value={String(num)} id={`stars-${num}`} className="sr-only" />
                            </FormControl>
                            <FormLabel htmlFor={`stars-${num}`} className="cursor-pointer">
                                <Star className={`h-6 w-6 ${field.value >= num ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                            </FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
