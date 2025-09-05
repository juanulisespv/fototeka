'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Square, RotateCcw } from 'lucide-react';
import { PomodoroProject } from '@/lib/types';
import { usePomodoro } from '@/context/pomodoro-context';
import { useToast } from '@/hooks/use-toast';

interface PomodoroTimerProps {
  projects: PomodoroProject[];
}

export function PomodoroTimer({ projects }: PomodoroTimerProps) {
  const { toast } = useToast();
  const {
    timerState,
    selectedProject,
    setSelectedProject,
    startTimer,
    pauseTimer,
    stopTimer,
    resetTimer,
  } = usePomodoro();

  const handleStart = () => {
    if (!selectedProject && timerState.sessionType === 'work') {
      toast({
        title: "Selecciona un proyecto",
        description: "Debes seleccionar un proyecto antes de comenzar una sesión de trabajo.",
        variant: "destructive",
      });
      return;
    }

    const success = startTimer();
    if (!success) {
      toast({
        title: "Error",
        description: "No se pudo iniciar el timer. Selecciona un proyecto.",
        variant: "destructive",
      });
    }
  };

  const handleProjectSelect = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setSelectedProject(project);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = (): number => {
    if (timerState.totalTime === 0) return 0;
    return ((timerState.totalTime - timerState.timeRemaining) / timerState.totalTime) * 100;
  };

  const getSessionTypeLabel = (): string => {
    switch (timerState.sessionType) {
      case 'work':
        return 'Trabajo';
      case 'break':
        return 'Descanso';
      case 'longBreak':
        return 'Descanso largo';
      default:
        return 'Trabajo';
    }
  };

  const getSessionIcon = () => {
    switch (timerState.sessionType) {
      case 'work':
        return '🍅';
      case 'break':
        return '☕';
      case 'longBreak':
        return '🛋️';
      default:
        return '🍅';
    }
  };

  const getStatusColor = () => {
    switch (timerState.status) {
      case 'running':
        return 'bg-green-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (timerState.status) {
      case 'running':
        return 'En marcha';
      case 'paused':
        return 'Pausado';
      case 'completed':
        return 'Completado';
      default:
        return 'Listo';
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Timer Display */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <span className="text-3xl">{getSessionIcon()}</span>
            {getSessionTypeLabel()}
          </CardTitle>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline" className={`${getStatusColor()} text-white`}>
              {getStatusText()}
            </Badge>
            {timerState.sessionsCompleted > 0 && (
              <Badge variant="secondary">
                {timerState.sessionsCompleted} sesión{timerState.sessionsCompleted !== 1 ? 'es' : ''} completada{timerState.sessionsCompleted !== 1 ? 's' : ''}
              </Badge>
            )}
            {(timerState.status === 'running' || timerState.status === 'paused') && selectedProject && (
              <Badge variant="outline" className="text-xs">
                📁 {selectedProject.name}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Timer */}
          <div className="text-center space-y-4">
            <div className="text-6xl font-mono font-bold tabular-nums">
              {formatTime(timerState.timeRemaining)}
            </div>
            <Progress value={getProgress()} className="h-3" />
          </div>

          {/* Project Selection */}
          {timerState.sessionType === 'work' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Proyecto:</label>
              <Select
                value={selectedProject?.id || ''}
                onValueChange={handleProjectSelect}
                disabled={timerState.status === 'running'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un proyecto" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                        {project.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Controls */}
          <div className="flex justify-center gap-2">
            {timerState.status === 'idle' || timerState.status === 'completed' ? (
              <Button onClick={handleStart} className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                Iniciar
              </Button>
            ) : timerState.status === 'running' ? (
              <Button onClick={pauseTimer} variant="outline" className="flex items-center gap-2">
                <Pause className="w-4 h-4" />
                Pausar
              </Button>
            ) : (
              <Button onClick={handleStart} className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                Reanudar
              </Button>
            )}
            
            {(timerState.status === 'running' || timerState.status === 'paused') && (
              <Button onClick={stopTimer} variant="destructive" className="flex items-center gap-2">
                <Square className="w-4 h-4" />
                Detener
              </Button>
            )}
            
            <Button onClick={resetTimer} variant="outline" className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Reiniciar
            </Button>
          </div>

          {/* Session Info */}
          {timerState.status === 'completed' && (
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                ¡Sesión completada! 🎉
              </p>
              <p className="text-sm">
                {timerState.isBreakTime ? 'Tiempo de trabajar' : 'Tiempo de descansar'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{timerState.sessionsCompleted}</div>
              <div className="text-sm text-muted-foreground">Sesiones hoy</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {Math.floor((timerState.totalTime - timerState.timeRemaining) / 60)}
              </div>
              <div className="text-sm text-muted-foreground">Minutos transcurridos</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
