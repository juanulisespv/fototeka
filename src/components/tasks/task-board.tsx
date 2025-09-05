
"use client";

import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, where, getDocs, writeBatch } from 'firebase/firestore';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { db } from '@/lib/firebase';
import type { Task, TaskGroup } from '@/lib/types';
import TaskGroupColumn from '@/components/tasks/task-group';
import { Button } from '@/components/ui/button';
import { Plus, Search, ZoomIn, ZoomOut } from 'lucide-react';
import GroupFormDialog from './group-form-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import TaskFormDialog from './task-form-dialog';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import PageHeader from '../page-header';
import { Slider } from '../ui/slider';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

const INITIAL_LOAD_COUNT = 10;
const LOAD_MORE_COUNT = 10;

export default function TaskBoard() {
    const [groups, setGroups] = useState<TaskGroup[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("all");
    const [gridCols, setGridCols] = useState(3);
    const [visibleGroupsCount, setVisibleGroupsCount] = useState(INITIAL_LOAD_COUNT);

    const [isGroupFormOpen, setIsGroupFormOpen] = useState(false);
    const [groupToEdit, setGroupToEdit] = useState<TaskGroup | null>(null);
    const [groupToDelete, setGroupToDelete] = useState<TaskGroup | null>(null);

    const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
    const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
    
    useEffect(() => {
        const groupsQuery = query(collection(db, 'groups'), orderBy('order'));
        const groupsUnsub = onSnapshot(groupsQuery, (snapshot) => {
            const groupsData: TaskGroup[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TaskGroup));
            setGroups(groupsData);
        });

        const tasksQuery = query(collection(db, 'tasks'), orderBy('order'));
        const tasksUnsub = onSnapshot(tasksQuery, (snapshot) => {
            const tasksData: Task[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
            setTasks(tasksData);
        });

        return () => {
            groupsUnsub();
            tasksUnsub();
        }
    }, []);

    const tasksByGroup = useMemo(() => {
        const groupMap: Record<string, Task[]> = {};
        groups.forEach(group => {
            groupMap[group.id] = [];
        });
        tasks.forEach(task => {
            if (task.groupId && groupMap[task.groupId]) {
                groupMap[task.groupId].push(task);
            }
        });
        return groupMap;
    }, [tasks, groups]);

    const filteredTasksByGroup = useMemo(() => {
        const filteredMap: Record<string, Task[]> = {};
        for (const groupId in tasksByGroup) {
            filteredMap[groupId] = tasksByGroup[groupId].filter(task => {
                const statusMatch = statusFilter === 'all' || (statusFilter === 'completed' ? task.status === 'completed' : task.status !== 'completed');
                const searchMatch = !searchQuery || task.title.toLowerCase().includes(searchQuery.toLowerCase());
                return statusMatch && searchMatch;
            });
        }
        return filteredMap;
    }, [tasksByGroup, statusFilter, searchQuery]);
    
    const displayedGroups = useMemo(() => {
      return groups.slice(0, visibleGroupsCount);
    }, [groups, visibleGroupsCount]);


    const groupIds = useMemo(() => displayedGroups.map(g => g.id), [displayedGroups]);
    
    const handleAddNewGroup = () => {
        setGroupToEdit(null);
        setIsGroupFormOpen(true);
    };

    const handleEditGroup = (group: TaskGroup) => {
        setGroupToEdit(group);
        setIsGroupFormOpen(true);
    }
    
    const handleDeleteGroupRequest = (group: TaskGroup) => {
        setGroupToDelete(group);
    }

    const handleSaveGroup = async (groupName: string) => {
        if (groupToEdit) {
            const groupRef = doc(db, 'groups', groupToEdit.id);
            await updateDoc(groupRef, { name: groupName });
        } else {
            await addDoc(collection(db, 'groups'), {
                name: groupName,
                order: groups.length,
                createdAt: serverTimestamp()
            });
        }
        setIsGroupFormOpen(false);
        setGroupToEdit(null);
    }

    const handleDeleteGroup = async () => {
        if (!groupToDelete) return;

        const batch = writeBatch(db);

        const groupRef = doc(db, 'groups', groupToDelete.id);
        batch.delete(groupRef);

        const tasksQuery = query(collection(db, 'tasks'), where('groupId', '==', groupToDelete.id));
        const tasksSnapshot = await getDocs(tasksQuery);
        tasksSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        setGroupToDelete(null);
    }

    const handleAddNewTask = (groupId: string) => {
        setTaskToEdit(null);
        setActiveGroupId(groupId);
        setIsTaskFormOpen(true);
    };

    const handleEditTask = (task: Task) => {
        setTaskToEdit(task);
        setActiveGroupId(task.groupId);
        setIsTaskFormOpen(true);
    }

    const handleDeleteTaskRequest = (task: Task) => {
        setTaskToDelete(task);
    }

    const handleSaveTask = async (taskData: Omit<Task, 'id' | 'groupId' | 'createdAt' | 'status' | 'order'>) => {
        if (taskToEdit) {
            const taskRef = doc(db, 'tasks', taskToEdit.id);
            await updateDoc(taskRef, taskData);
        } else if (activeGroupId) {
            const tasksInGroup = tasksByGroup[activeGroupId] || [];
            await addDoc(collection(db, 'tasks'), {
                ...taskData,
                groupId: activeGroupId,
                status: 'pending',
                order: tasksInGroup.length,
                createdAt: serverTimestamp()
            });
        }
        setIsTaskFormOpen(false);
        setTaskToEdit(null);
        setActiveGroupId(null);
    }
    
    const handleTaskStatusChange = async (task: Task, completed: boolean) => {
        const batch = writeBatch(db);
        const taskRef = doc(db, "tasks", task.id);
      
        batch.update(taskRef, {
          status: completed ? 'completed' : 'pending'
        });
      
        const tasksInGroup = (tasksByGroup[task.groupId] || []).filter(t => t.id !== task.id).sort((a, b) => a.order - b.order);
        
        if (completed) {
            const maxOrder = tasksInGroup.length > 0 ? Math.max(...tasksInGroup.map(t => t.order)) : -1;
            batch.update(taskRef, { order: maxOrder + 1 });
        } else {
            tasksInGroup.forEach((t) => {
                batch.update(doc(db, "tasks", t.id), { order: t.order + 1 });
            });
            batch.update(taskRef, { order: 0 });
        }
      
        await batch.commit();
      };

    const handleDeleteTask = async () => {
        if (!taskToDelete) return;
        const taskRef = doc(db, "tasks", taskToDelete.id);
        await deleteDoc(taskRef);
        setTaskToDelete(null);
    }

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
              distance: 8,
            },
          }),
        useSensor(KeyboardSensor)
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
    
        if (!over) return;
    
        const activeId = active.id.toString();
        const overId = over.id.toString();
    
        if (activeId === overId) return;
    
        const batch = writeBatch(db);
        const isDraggingGroup = active.data.current?.type === 'group';
    
        if (isDraggingGroup) {
            const activeIndex = groups.findIndex((g) => g.id === activeId);
            const overIndex = groups.findIndex((g) => g.id === overId);
            if (activeIndex === -1 || overIndex === -1) return;
    
            const reorderedGroups = arrayMove(groups, activeIndex, overIndex);
            setGroups(reorderedGroups); // Optimistic update
            reorderedGroups.forEach((group, index) => {
                batch.update(doc(db, 'groups', group.id), { order: index });
            });
        }
    
        await batch.commit();
    }
    
    const gridClasses: Record<number, string> = {
        1: 'grid-cols-1',
        2: 'grid-cols-1 lg:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="h-full flex flex-col">
                <PageHeader title="Tablero de Tareas">
                    <div className='flex items-center gap-2'>
                         <Button onClick={handleAddNewGroup} className='w-full sm:w-auto'>
                            <Plus className="mr-2"/>
                            Añadir Grupo
                        </Button>
                    </div>
                </PageHeader>
                <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
                    <div className="relative w-full sm:w-auto flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Buscar por título de tarea..."
                            className="pl-10 w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <Select value={statusFilter} onValueChange={(value: "all" | "pending" | "completed") => setStatusFilter(value)}>
                            <SelectTrigger className="w-full sm:w-48">
                                <SelectValue placeholder="Filtrar por estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas las tareas</SelectItem>
                                <SelectItem value="pending">Pendientes</SelectItem>
                                <SelectItem value="completed">Completadas</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="task-slider-container">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" onClick={() => setGridCols(c => Math.max(c - 1, 1))}><ZoomIn className="h-5 w-5"/></Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Aumentar tamaño</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" onClick={() => setGridCols(c => Math.min(c + 1, 4))}><ZoomOut className="h-5 w-5"/></Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Reducir tamaño</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <Slider
                                value={[gridCols]}
                                onValueChange={(value) => setGridCols(value[0])}
                                min={1}
                                max={4}
                                step={1}
                                inverted={true}
                                className="w-full"
                                aria-label="Task group columns"
                            />
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-auto -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
                    <div className="pb-4">
                        <SortableContext items={groupIds} strategy={horizontalListSortingStrategy}>
                            <div className={cn("task-board-grid", gridClasses[gridCols])}>
                                {displayedGroups.map(group => (
                                    <TaskGroupColumn 
                                        key={group.id}
                                        group={group}
                                        tasks={(filteredTasksByGroup[group.id] || []).sort((a,b) => a.order - b.order)}
                                        onEditGroup={handleEditGroup}
                                        onDeleteGroup={handleDeleteGroupRequest}
                                        onAddTask={() => handleAddNewTask(group.id)}
                                        onEditTask={handleEditTask}
                                        onDeleteTask={handleDeleteTaskRequest}
                                        onTaskStatusChange={handleTaskStatusChange}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                        {groups.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                                <p>No se encontraron grupos de tareas.</p>
                                <p className="text-sm mt-2">Puedes añadir grupos para empezar a organizar tus tareas.</p>
                            </div>
                        )}
                    </div>
                     {groups.length > visibleGroupsCount && (
                        <div className="mt-6 flex justify-center">
                        <Button onClick={() => setVisibleGroupsCount(count => count + LOAD_MORE_COUNT)}>
                            Cargar más
                        </Button>
                        </div>
                    )}
                </div>

                <GroupFormDialog 
                    open={isGroupFormOpen}
                    onOpenChange={setIsGroupFormOpen}
                    onSave={handleSaveGroup}
                    group={groupToEdit}
                />

                <TaskFormDialog
                    open={isTaskFormOpen}
                    onOpenChange={setIsTaskFormOpen}
                    onSave={handleSaveTask}
                    task={taskToEdit}
                />

                <AlertDialog open={!!groupToDelete} onOpenChange={() => setGroupToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción no se puede deshacer. Esto eliminará permanentemente el grupo "{groupToDelete?.name}" y todas las tareas que contiene.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteGroup}>Continuar</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                
                <AlertDialog open={!!taskToDelete} onOpenChange={() => setTaskToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción no se puede deshacer. Esto eliminará permanentemente la tarea "{taskToDelete?.title}".
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteTask}>Continuar</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DndContext>
    );

    
}
