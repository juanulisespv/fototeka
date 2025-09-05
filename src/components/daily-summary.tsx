'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, Target, TrendingUp } from 'lucide-react';
import { PomodoroProject, PomodoroSession } from '@/lib/types';
import { getUserSessions } from '@/lib/pomodoro-service';
import { useAuth } from '@/context/auth-context';
import { usePomodoro } from '@/context/pomodoro-context';

interface DailySummaryProps {
  projects: PomodoroProject[];
}

interface ProjectStats {
  project: PomodoroProject;
  totalMinutes: number;
  sessions: number;
  completedSessions: number;
  lastSession?: Date;
}

export function DailySummary({ projects }: DailySummaryProps) {
  const { user } = useAuth();
  const { timerState } = usePomodoro();
  const [todaySessions, setTodaySessions] = useState<PomodoroSession[]>([]);
  const [projectStats, setProjectStats] = useState<ProjectStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadTodaySessions();
    }
  }, [user, projects]);

  // Refresh summary when timer completes a session
  useEffect(() => {
    if (timerState.status === 'completed' && user) {
      // Small delay to ensure session was recorded
      setTimeout(() => {
        loadTodaySessions();
      }, 1000);
    }
  }, [timerState.status, user]);

  const loadTodaySessions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const allSessions = await getUserSessions(user.uid);
      
      // Filter sessions from today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todaysSessions = allSessions.filter(session => {
        const sessionDate = new Date(session.completedAt);
        return sessionDate >= today && sessionDate < tomorrow;
      });

      setTodaySessions(todaysSessions);
      calculateProjectStats(todaysSessions);
    } catch (error) {
      console.error('Error loading today sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProjectStats = (sessions: PomodoroSession[]) => {
    const statsMap = new Map<string, ProjectStats>();

    // Initialize stats for all projects
    projects.forEach(project => {
      statsMap.set(project.id, {
        project,
        totalMinutes: 0,
        sessions: 0,
        completedSessions: 0,
      });
    });

    // Calculate stats from sessions
    sessions.forEach(session => {
      const stats = statsMap.get(session.projectId);
      if (stats) {
        stats.totalMinutes += session.actualDuration;
        stats.sessions += 1;
        if (!session.interrupted) {
          stats.completedSessions += 1;
        }
        
        const sessionDate = new Date(session.completedAt);
        if (!stats.lastSession || sessionDate > stats.lastSession) {
          stats.lastSession = sessionDate;
        }
      }
    });

    // Convert to array and filter projects with activity
    const activeStats = Array.from(statsMap.values())
      .filter(stats => stats.sessions > 0)
      .sort((a, b) => b.totalMinutes - a.totalMinutes);

    setProjectStats(activeStats);
  };

  const getTotalMinutesToday = () => {
    return todaySessions.reduce((total, session) => total + session.actualDuration, 0);
  };

  const getTotalSessionsToday = () => {
    return todaySessions.length;
  };

  const getCompletedSessionsToday = () => {
    return todaySessions.filter(session => !session.interrupted).length;
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getProductivityPercentage = () => {
    const completed = getCompletedSessionsToday();
    const total = getTotalSessionsToday();
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Resumen del Día
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Daily Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="w-5 h-5" />
            Resumen del Día
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-xl lg:text-2xl font-bold text-primary">
                {formatTime(getTotalMinutesToday())}
              </div>
              <div className="text-xs lg:text-sm text-muted-foreground">
                Tiempo total
              </div>
            </div>
            <div className="text-center">
              <div className="text-xl lg:text-2xl font-bold text-primary">
                {getCompletedSessionsToday()}/{getTotalSessionsToday()}
              </div>
              <div className="text-xs lg:text-sm text-muted-foreground">
                Sesiones completas
              </div>
            </div>
          </div>

          {/* Productivity Bar */}
          {getTotalSessionsToday() > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  Productividad
                </span>
                <span className="font-medium">{getProductivityPercentage()}%</span>
              </div>
              <Progress value={getProductivityPercentage()} className="h-2" />
            </div>
          )}

          {/* Current Session Info */}
          {(timerState.status === 'running' || timerState.status === 'paused') && (
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${
                    timerState.status === 'running' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
                  }`} />
                  Sesión actual
                </span>
                <Badge variant="outline" className="text-xs">
                  {timerState.sessionType === 'work' ? '🍅 Trabajo' : 
                   timerState.sessionType === 'break' ? '☕ Descanso' : '🛋️ Descanso largo'}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Transcurrido: {formatTime(Math.floor((timerState.totalTime - timerState.timeRemaining) / 60))}
                </span>
                <span>
                  Restante: {formatTime(Math.floor(timerState.timeRemaining / 60))}
                </span>
              </div>
              <Progress 
                value={((timerState.totalTime - timerState.timeRemaining) / timerState.totalTime) * 100} 
                className="h-1"
              />
            </div>
          )}

          {/* Daily Goal Progress */}
          {getTotalMinutesToday() > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  Meta diaria (4h)
                </span>
                <span className="font-medium">
                  {Math.round((getTotalMinutesToday() / 240) * 100)}%
                </span>
              </div>
              <Progress value={Math.min((getTotalMinutesToday() / 240) * 100, 100)} className="h-2" />
            </div>
          )}

          {/* No activity message */}
          {getTotalSessionsToday() === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="font-medium">Aún no has trabajado hoy</p>
              <p className="text-sm">¡Comienza tu primera sesión!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Breakdown */}
      {projectStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="w-5 h-5" />
              Proyectos de Hoy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {projectStats.map((stats) => (
              <div key={stats.project.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: stats.project.color }}
                    />
                    <span className="font-medium text-sm truncate">
                      {stats.project.name}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-xs flex-shrink-0 ml-2">
                    {formatTime(stats.totalMinutes)}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {stats.completedSessions}/{stats.sessions} sesiones
                  </span>
                  {stats.lastSession && (
                    <span className="truncate ml-2">
                      {stats.lastSession.toLocaleTimeString('es', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  )}
                </div>

                {/* Project progress bar */}
                <Progress 
                  value={(stats.totalMinutes / Math.max(getTotalMinutesToday(), 1)) * 100} 
                  className="h-1"
                />
              </div>
            ))}

            {/* Quick Stats Summary */}
            <div className="mt-4 pt-3 border-t border-muted">
              <div className="text-xs text-muted-foreground text-center">
                Trabajando en {projectStats.length} proyecto{projectStats.length !== 1 ? 's' : ''} hoy
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
