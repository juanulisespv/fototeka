'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  Calendar,
  Clock,
  Target,
  Award,
  Activity,
  BarChart3
} from 'lucide-react';
import { format, subDays, startOfDay, eachDayOfInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { PomodoroProject, PomodoroSession } from '@/lib/types';

interface PomodoroChartsProps {
  sessions: PomodoroSession[];
  projects: PomodoroProject[];
}

type ChartPeriod = '7d' | '30d' | '90d';

interface DayData {
  date: string;
  dateLabel: string;
  totalMinutes: number;
  sessions: number;
  completedSessions: number;
  projects: { [key: string]: number };
}

interface ProjectData {
  name: string;
  totalMinutes: number;
  sessions: number;
  completedSessions: number;
  color: string;
  productivity: number;
}

interface HourData {
  hour: number;
  hourLabel: string;
  sessions: number;
  totalMinutes: number;
}

export function PomodoroCharts({ sessions, projects }: PomodoroChartsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<ChartPeriod>('30d');

  // Filtrar sesiones por período
  const filteredSessions = useMemo(() => {
    const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
    const startDate = subDays(new Date(), days);
    
    return sessions.filter(session => {
      const sessionDate = parseISO(session.completedAt);
      return sessionDate >= startDate;
    });
  }, [sessions, selectedPeriod]);

  // Datos por día
  const dailyData = useMemo(() => {
    const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
    const startDate = subDays(new Date(), days - 1);
    const dateRange = eachDayOfInterval({ start: startDate, end: new Date() });

    return dateRange.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const daySessions = filteredSessions.filter(session => {
        const sessionDate = format(parseISO(session.completedAt), 'yyyy-MM-dd');
        return sessionDate === dateStr;
      });

      const projectMinutes: { [key: string]: number } = {};
      projects.forEach(project => {
        projectMinutes[project.name] = 0;
      });

      daySessions.forEach(session => {
        if (projectMinutes.hasOwnProperty(session.projectName)) {
          projectMinutes[session.projectName] += session.actualDuration;
        }
      });

      return {
        date: dateStr,
        dateLabel: format(date, selectedPeriod === '7d' ? 'EEE dd' : 'dd/MM', { locale: es }),
        totalMinutes: daySessions.reduce((sum, s) => sum + s.actualDuration, 0),
        sessions: daySessions.length,
        completedSessions: daySessions.filter(s => !s.interrupted).length,
        ...projectMinutes
      };
    });
  }, [filteredSessions, projects, selectedPeriod]);

  // Datos por proyecto
  const projectData = useMemo(() => {
    const projectStats: { [key: string]: ProjectData } = {};

    projects.forEach(project => {
      projectStats[project.id] = {
        name: project.name,
        totalMinutes: 0,
        sessions: 0,
        completedSessions: 0,
        color: project.color || '#8884d8',
        productivity: 0
      };
    });

    filteredSessions.forEach(session => {
      const stats = projectStats[session.projectId];
      if (stats) {
        stats.totalMinutes += session.actualDuration;
        stats.sessions += 1;
        if (!session.interrupted) {
          stats.completedSessions += 1;
        }
      }
    });

    // Calcular productividad
    Object.values(projectStats).forEach(stats => {
      stats.productivity = stats.sessions > 0 ? (stats.completedSessions / stats.sessions) * 100 : 0;
    });

    return Object.values(projectStats).filter(stats => stats.sessions > 0);
  }, [filteredSessions, projects]);

  // Datos por hora del día
  const hourlyData = useMemo(() => {
    const hourStats: { [hour: number]: HourData } = {};
    
    // Inicializar todas las horas
    for (let hour = 0; hour < 24; hour++) {
      hourStats[hour] = {
        hour,
        hourLabel: `${hour.toString().padStart(2, '0')}:00`,
        sessions: 0,
        totalMinutes: 0
      };
    }

    filteredSessions.forEach(session => {
      const sessionDate = parseISO(session.completedAt);
      const hour = sessionDate.getHours();
      
      hourStats[hour].sessions += 1;
      hourStats[hour].totalMinutes += session.actualDuration;
    });

    return Object.values(hourStats).filter(data => data.sessions > 0);
  }, [filteredSessions]);

  const formatTooltip = (value: any, name: string) => {
    if (name.includes('Minutes') || name.includes('totalMinutes')) {
      return [`${Math.round(value)}m`, name.replace('totalMinutes', 'Tiempo').replace('Minutes', '')];
    }
    return [value, name];
  };

  const formatHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">📊 Estadísticas Gráficas</h3>
        <Select value={selectedPeriod} onValueChange={(value: ChartPeriod) => setSelectedPeriod(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Últimos 7 días</SelectItem>
            <SelectItem value="30d">Últimos 30 días</SelectItem>
            <SelectItem value="90d">Últimos 90 días</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* No Data Message */}
      {filteredSessions.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Sin datos para mostrar</h3>
              <p>No hay sesiones registradas en el período seleccionado.</p>
              <p className="text-sm mt-2">Completa algunas sesiones de Pomodoro para ver las estadísticas.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Content */}
      {filteredSessions.length > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Tiempo Total</p>
                    <p className="text-lg font-semibold">
                      {formatHours(filteredSessions.reduce((sum, s) => sum + s.actualDuration, 0))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Sesiones</p>
                    <p className="text-lg font-semibold">{filteredSessions.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Completadas</p>
                    <p className="text-lg font-semibold">
                      {filteredSessions.filter(s => !s.interrupted).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Productividad</p>
                    <p className="text-lg font-semibold">
                      {filteredSessions.length > 0 
                        ? Math.round((filteredSessions.filter(s => !s.interrupted).length / filteredSessions.length) * 100)
                        : 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <Tabs defaultValue="daily" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="daily">Por Día</TabsTrigger>
              <TabsTrigger value="projects">Por Proyecto</TabsTrigger>
              <TabsTrigger value="hourly">Por Hora</TabsTrigger>
              <TabsTrigger value="productivity">Productividad</TabsTrigger>
            </TabsList>

            {/* Gráfico por día */}
            <TabsContent value="daily">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Actividad Diaria
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="dateLabel" />
                      <YAxis />
                      <Tooltip formatter={formatTooltip} />
                      <Area 
                        type="monotone" 
                        dataKey="totalMinutes" 
                        stroke="#8884d8" 
                        fill="#8884d8" 
                        fillOpacity={0.6}
                        name="Minutos trabajados"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Gráfico por proyecto */}
            <TabsContent value="projects">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Tiempo por Proyecto</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={projectData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="totalMinutes"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {projectData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${Math.round(Number(value))}m`, 'Tiempo']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Sesiones por Proyecto</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={projectData} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip />
                        <Bar dataKey="sessions" fill="#82ca9d" name="Sesiones" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Gráfico por hora */}
            <TabsContent value="hourly">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Actividad por Hora del Día
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={hourlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hourLabel" />
                      <YAxis />
                      <Tooltip formatter={formatTooltip} />
                      <Bar dataKey="sessions" fill="#ffc658" name="Sesiones" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Gráfico de productividad */}
            <TabsContent value="productivity">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Tendencia de Productividad
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="dateLabel" />
                      <YAxis />
                      <Tooltip formatter={formatTooltip} />
                      <Line 
                        type="monotone" 
                        dataKey="completedSessions" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        name="Sesiones completadas"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="sessions" 
                        stroke="#82ca9d" 
                        strokeWidth={2}
                        name="Total sesiones"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
