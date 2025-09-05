'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { usePomodoro } from '@/context/pomodoro-context';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Timer, BarChart3, Settings, FolderOpen } from 'lucide-react';
import { PomodoroTimer } from '@/components/pomodoro-timer';
import { ProjectManager } from '@/components/project-manager';
import { PomodoroHistory } from '@/components/pomodoro-history';
import { PomodoroSettings } from '@/components/pomodoro-settings';
import { DailySummary } from '@/components/daily-summary';
import { PomodoroProject, PomodoroSettings as SettingsType } from '@/lib/types';
import { getUserProjects, getUserSettings } from '@/lib/pomodoro-service';
import PageHeader from '@/components/page-header';

export default function PomodoroPage() {
  const { user } = useAuth();
  const { selectedProject, setSelectedProject, settings, setSettings } = usePomodoro();
  const [projects, setProjects] = useState<PomodoroProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProjects();
      loadSettings();
    }
  }, [user]);

  const loadProjects = async () => {
    try {
      if (user) {
        const userProjects = await getUserProjects(user.uid);
        setProjects(userProjects);
        
        // Auto-select first project if none selected
        if (!selectedProject && userProjects.length > 0) {
          setSelectedProject(userProjects[0]);
        }
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadSettings = async () => {
    try {
      if (user) {
        const userSettings = await getUserSettings(user.uid);
        setSettings(userSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectsChange = () => {
    loadProjects();
  };

  const handleSettingsChange = (newSettings: SettingsType) => {
    setSettings(newSettings);
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Acceso Requerido</h2>
          <p className="text-muted-foreground">
            Debes estar autenticado para usar el sistema Pomodoro.
          </p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Cargando sistema Pomodoro...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="🍅 Pomodoro"
        description="Sistema de gestión de tiempo y productividad"
      />

      <Tabs defaultValue="timer" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="timer" className="flex items-center gap-2">
            <Timer className="w-4 h-4" />
            <span className="hidden sm:inline">Timer</span>
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Proyectos</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Historial</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Configuración</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timer" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <PomodoroTimer
                projects={projects}
              />
            </div>
            <div className="xl:col-span-1 order-first xl:order-last">
              <DailySummary projects={projects} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <ProjectManager
            projects={projects}
            onProjectsChange={handleProjectsChange}
            userId={user.uid}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <PomodoroHistory
            projects={projects}
            userId={user.uid}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <PomodoroSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
