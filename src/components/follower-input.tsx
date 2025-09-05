'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addFollowerRecord } from '@/lib/follower-service';
import { SocialNetwork } from '@/lib/types';
import { SocialNetworkIcon } from '@/components/social-network-icon';

const followerSchema = z.object({
  socialNetwork: z.enum(['LinkedIn', 'Instagram', 'YouTube', 'Facebook', 'Pinterest', 'TikTok']),
  followerCount: z.string().min(1, 'Ingresa un número de seguidores'),
});

type FollowerFormData = z.infer<typeof followerSchema>;

interface FollowerInputProps {
  onRecordAdded: () => void;
  userId: string;
}

export function FollowerInput({ onRecordAdded, userId }: FollowerInputProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FollowerFormData>({
    resolver: zodResolver(followerSchema),
    defaultValues: {
      socialNetwork: 'Instagram',
      followerCount: '',
    },
  });

  const socialNetworks: SocialNetwork[] = ['LinkedIn', 'Instagram', 'YouTube', 'Facebook', 'Pinterest', 'TikTok'];

  const onSubmit = async (data: FollowerFormData) => {
    try {
      setIsSubmitting(true);
      
      const followerCount = parseInt(data.followerCount.replace(/,/g, ''), 10);
      
      if (isNaN(followerCount) || followerCount < 0) {
        toast({
          title: 'Error',
          description: 'Ingresa un número válido de seguidores.',
          variant: 'destructive',
        });
        return;
      }
      
      await addFollowerRecord({
        userId,
        socialNetwork: data.socialNetwork,
        followerCount,
      });

      toast({
        title: 'Registro agregado',
        description: `Se registraron ${followerCount.toLocaleString()} seguidores para ${data.socialNetwork}`,
      });

      form.reset();
      onRecordAdded();
    } catch (error) {
      console.error('Error adding follower record:', error);
      toast({
        title: 'Error',
        description: 'No se pudo agregar el registro. Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatNumber = (value: string) => {
    const number = value.replace(/,/g, '');
    if (!/^\d*$/.test(number)) return value;
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
          📊
        </div>
        <h3 className="text-lg font-semibold">Registrar Seguidores</h3>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="socialNetwork"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Red Social</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {socialNetworks.map((network) => (
                      <SelectItem key={network} value={network}>
                        <div className="flex items-center space-x-2">
                          <SocialNetworkIcon network={network} size="sm" />
                          <span>{network}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="followerCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Seguidores</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="ej: 1,250"
                    onChange={(e) => {
                      const formatted = formatNumber(e.target.value);
                      field.onChange(formatted);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : 'Registrar Seguidores'}
          </Button>
        </form>
      </Form>

      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Los datos se registran con la fecha y hora actual</p>
        <p>• Puedes agregar múltiples registros por día</p>
        <p>• Los números se formatean automáticamente</p>
      </div>
    </div>
  );
}
