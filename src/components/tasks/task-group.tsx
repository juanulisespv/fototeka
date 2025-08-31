
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task, TaskGroup as TaskGroupType } from "@/lib/types";
import TaskItem from "./task-item";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { MoreHorizontal, Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { cn } from "@/lib/utils";

type TaskGroupProps = {
  group: TaskGroupType;
  tasks: Task[];
  onEditGroup: (group: TaskGroupType) => void;
  onDeleteGroup: (group: TaskGroupType) => void;
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onTaskStatusChange: (task: Task, completed: boolean) => void;
};

export default function TaskGroupColumn({ 
    group, 
    tasks, 
    onEditGroup, 
    onDeleteGroup, 
    onAddTask, 
    onEditTask,
    onDeleteTask,
    onTaskStatusChange
}: TaskGroupProps) {
    const { 
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: group.id,
        data: {
            type: 'group',
            group,
        }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
      };

  return (
    <div 
        ref={setNodeRef} 
        style={style}
        className="h-full"
    >
        <Card 
            className={cn(
                "h-full flex flex-col bg-secondary/50 dark:bg-background/50",
                isDragging && "opacity-50 shadow-xl"
            )}
        >
            <CardHeader 
                className="flex flex-row items-center justify-between p-4 border-b"
                {...attributes} 
                {...listeners}
                style={{touchAction: 'none'}}
            >
                <CardTitle className="text-xl font-bold tracking-tight flex items-center gap-2 cursor-grab">
                    {group.name}
                    <span className="text-sm font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{tasks.length}</span>
                </CardTitle>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onAddTask}>
                        <Plus className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => onEditGroup(group)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar Grupo
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDeleteGroup(group)} className="text-destructive">
                                 <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar Grupo
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <ScrollArea className="flex-1">
                <CardContent className="p-4 space-y-4">
                    {tasks.map((task) => (
                        <TaskItem 
                            key={task.id} 
                            task={task}
                            onEdit={onEditTask}
                            onDelete={onDeleteTask}
                            onStatusChange={onTaskStatusChange}
                        />
                    ))}
                    {tasks.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">No hay tareas en este grupo.</p>}
                </CardContent>
            </ScrollArea>
        </Card>
    </div>
  );
}
