
"use client"

import React, { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import type { Tag } from "@/lib/types"

const FormSchema = z.object({
  label: z.string().min(1, { message: "Tag name cannot be empty." }),
  color: z.string().min(1, { message: "Color cannot be empty." }),
})

const colorOptions = [
    'bg-blue-500', 'bg-yellow-500', 'bg-green-500', 'bg-purple-500', 'bg-teal-500',
    'bg-red-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500', 'bg-gray-500',
];


type EditTagDialogProps = {
  tag: Tag | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (updatedTag: Tag) => void
}

export default function EditTagDialog({ tag, open, onOpenChange, onSave }: EditTagDialogProps) {
  const { toast } = useToast()
  
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  })

  useEffect(() => {
    if (tag) {
      form.reset({
        label: tag.label,
        color: tag.color,
      })
    }
  }, [tag, form])

  function onSubmit(data: z.infer<typeof FormSchema>) {
    if (!tag) return

    const updatedTag = {
      ...tag,
      label: data.label,
      color: data.color,
    }
    
    onSave(updatedTag)
    toast({
      title: "Tag Updated",
      description: `The tag "${updatedTag.label}" has been saved.`,
    })
    onOpenChange(false)
  }

  if (!tag) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Tag</DialogTitle>
          <DialogDescription>
            Update the name and color for your tag.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tag Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Summer Vacation" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Color</FormLabel>
                        <FormControl>
                            <div className="grid grid-cols-5 gap-2">
                                {colorOptions.map(colorClass => (
                                    <Button
                                        key={colorClass}
                                        type="button"
                                        variant="outline"
                                        className={`h-10 w-full ${field.value === colorClass ? 'ring-2 ring-primary' : ''}`}
                                        onClick={() => field.onChange(colorClass)}
                                    >
                                        <span className={`h-6 w-6 rounded-full ${colorClass}`} />
                                    </Button>
                                ))}
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
