
"use client";

import type { Task } from "@/lib/types";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import { cn } from "@/lib/utils";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";

type TaskItemProps = {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, completed: boolean) => void;
};

const priorityVariantMap: Record<Task['priority'], "destructive" | "default" | "secondary"> = {
    high: "destructive",
    medium: "default",
    low: "secondary"
}

const priorityTextMap: Record<Task['priority'], string> = {
    high: "Alta",
    medium: "Media",
    low: "Baja"
}

export default function TaskItem({ task, onEdit, onDelete, onStatusChange }: TaskItemProps) {
  const isCompleted = task.status === 'completed';

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStatusChange(task, !isCompleted);
  };
  
  const handleActionsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  }

  return (
    <Card className="bg-card hover:shadow-md transition-shadow group">
        <div className="p-4 flex items-start gap-4">
            <div className="pt-1">
                <Checkbox
                    id={`task-${task.id}`}
                    checked={isCompleted}
                    onCheckedChange={(checked) => onStatusChange(task, !!checked)}
                    onClick={handleCheckboxClick}
                />
            </div>
            <div className="flex-1">
                <p className={cn("font-medium leading-tight", isCompleted && "line-through text-muted-foreground")}>
                    {task.title}
                </p>
                {task.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                        {task.description}
                    </p>
                )}
                {task.priority && (
                    <Badge variant={priorityVariantMap[task.priority]} className="mt-2">
                        {priorityTextMap[task.priority]}
                    </Badge>
                )}
            </div>
            <div onClick={handleActionsClick} className="flex flex-col sm:flex-row items-center gap-1">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => onEdit(task)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(task)} className="text-destructive">
                             <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    </Card>
  );
}
