'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Timer, BarChart3 } from 'lucide-react';
import { PomodoroProject } from '@/lib/types';
import { createProject, updateProject, deleteProject } from '@/lib/pomodoro-service';
import { useToast } from '@/hooks/use-toast';

interface ProjectManagerProps {
  projects: PomodoroProject[];
  onProjectsChange: () => void;
  userId: string;
}

const colors = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

export function ProjectManager({ projects, onProjectsChange, userId }: ProjectManagerProps) {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<PomodoroProject | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: colors[0],
  });
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: colors[0],
    });
    setEditingProject(null);
  };

  const handleCreateProject = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre del proyecto es requerido.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await createProject(
        userId,
        formData.name.trim(),
        formData.description.trim(),
        formData.color
      );
      
      toast({
        title: 'Proyecto creado',
        description: `El proyecto "${formData.name}" ha sido creado exitosamente.`,
      });
      
      resetForm();
      setIsCreateDialogOpen(false);
      onProjectsChange();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo crear el proyecto. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditProject = async () => {
    if (!editingProject || !formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre del proyecto es requerido.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await updateProject(editingProject.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        color: formData.color,
      });
      
      toast({
        title: 'Proyecto actualizado',
        description: `El proyecto "${formData.name}" ha sido actualizado.`,
      });
      
      resetForm();
      onProjectsChange();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el proyecto. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (project: PomodoroProject) => {
    setLoading(true);
    try {
      await deleteProject(project.id);
      
      toast({
        title: 'Proyecto eliminado',
        description: `El proyecto "${project.name}" ha sido eliminado.`,
      });
      
      onProjectsChange();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el proyecto. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (project: PomodoroProject) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      color: project.color || colors[0],
    });
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Create Project Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Gestión de Proyectos</h3>
          <p className="text-sm text-muted-foreground">
            Crea y organiza tus proyectos para el seguimiento de tiempo.
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={resetForm}>
              <Plus className="w-4 h-4" />
              Nuevo Proyecto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Proyecto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nombre del proyecto"
                  maxLength={50}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Descripción (opcional)</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción del proyecto"
                  maxLength={200}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Color</label>
                <div className="flex gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        formData.color === color ? 'border-foreground scale-110' : 'border-border'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreateProject} disabled={loading}>
                  {loading ? 'Creando...' : 'Crear Proyecto'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground space-y-2">
              <Timer className="w-12 h-12 mx-auto" />
              <h3 className="text-lg font-medium">No hay proyectos</h3>
              <p className="text-sm">
                Crea tu primer proyecto para comenzar a usar el sistema Pomodoro.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div 
                      className="w-4 h-4 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: project.color }}
                    />
                    <CardTitle className="text-base truncate">{project.name}</CardTitle>
                  </div>
                  
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0"
                          onClick={() => openEditDialog(project)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Editar Proyecto</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Nombre</label>
                            <Input
                              value={formData.name}
                              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Nombre del proyecto"
                              maxLength={50}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Descripción (opcional)</label>
                            <Textarea
                              value={formData.description}
                              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Descripción del proyecto"
                              maxLength={200}
                              rows={3}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Color</label>
                            <div className="flex gap-2">
                              {colors.map((color) => (
                                <button
                                  key={color}
                                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                                    formData.color === color ? 'border-foreground scale-110' : 'border-border'
                                  }`}
                                  style={{ backgroundColor: color }}
                                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                                />
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex justify-end gap-2 pt-4">
                            <Button 
                              variant="outline" 
                              onClick={resetForm}
                              disabled={loading}
                            >
                              Cancelar
                            </Button>
                            <Button onClick={handleEditProject} disabled={loading}>
                              {loading ? 'Guardando...' : 'Guardar Cambios'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar proyecto?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente el proyecto
                            "{project.name}" y todo su historial de sesiones.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteProject(project)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {project.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {project.description}
                  </p>
                )}
                
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-1">
                    <Timer className="w-3 h-3" />
                    <span>{formatTime(project.totalTime)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" />
                    <span>{project.sessionsCompleted} sesiones</span>
                  </div>
                </div>
                
                <Badge variant="secondary" className="text-xs">
                  {new Date(project.updatedAt).toLocaleDateString()}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
