
"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TaskGroup } from "@/lib/types";

type GroupFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (groupName: string) => void;
  group: TaskGroup | null;
};

export default function GroupFormDialog({ open, onOpenChange, onSave, group }: GroupFormDialogProps) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (group) {
      setName(group.name);
    } else {
      setName("");
    }
  }, [group, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{group ? "Editar Grupo" : "Añadir Nuevo Grupo"}</DialogTitle>
          <DialogDescription>
            {group ? "Renombra tu grupo de tareas." : "¿Cómo debería llamarse este nuevo grupo?"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                        Nombre
                    </Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="col-span-3"
                        autoFocus
                    />
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <Button type="submit" disabled={!name.trim()}>Guardar</Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
