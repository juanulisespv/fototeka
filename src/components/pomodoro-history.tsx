'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Download, 
  Calendar as CalendarIcon, 
  Filter,
  Timer,
  TrendingUp,
  Award,
  Target,
  BarChart3
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { PomodoroProject, PomodoroSession, PomodoroStats } from '@/lib/types';
import { getUserSessions, getSessionsByDateRange, debugGetSessions } from '@/lib/pomodoro-service';
import { PomodoroCharts } from '@/components/pomodoro-charts';
import { useToast } from '@/hooks/use-toast';

interface PomodoroHistoryProps {
  projects: PomodoroProject[];
  userId: string;
}

type FilterPeriod = 'today' | 'week' | 'month' | 'custom';

export function PomodoroHistory({ projects, userId }: PomodoroHistoryProps) {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<PomodoroSession[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>('week');
  const [customDateRange, setCustomDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PomodoroStats>({
    totalSessions: 0,
    totalTimeWorked: 0,
    averageSessionTime: 0,
    projectsWorkedOn: 0,
    streakDays: 0,
    lastSessionDate: '',
    dailyGoal: 8,
    dailyProgress: 0,
  });

  useEffect(() => {
    loadSessions();
  }, [userId]);

  useEffect(() => {
    applyFilters();
  }, [sessions, selectedProject, selectedPeriod, customDateRange]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const userSessions = await getUserSessions(userId);
      setSessions(userSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las sesiones.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...sessions];

    // Filter by project
    if (selectedProject !== 'all') {
      filtered = filtered.filter(session => session.projectId === selectedProject);
    }

    // Filter by date period
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (selectedPeriod) {
      case 'today':
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        break;
      case 'week':
        startDate = startOfDay(subDays(now, 7));
        break;
      case 'month':
        startDate = startOfDay(subDays(now, 30));
        break;
      case 'custom':
        if (customDateRange.from && customDateRange.to) {
          startDate = startOfDay(customDateRange.from);
          endDate = endOfDay(customDateRange.to);
        } else {
          startDate = startOfDay(subDays(now, 7));
        }
        break;
      default:
        startDate = startOfDay(subDays(now, 7));
    }

    filtered = filtered.filter(session => {
      const sessionDate = new Date(session.completedAt);
      return sessionDate >= startDate && sessionDate <= endDate;
    });

    setFilteredSessions(filtered);
    calculateStats(filtered);
  };

  const calculateStats = (sessions: PomodoroSession[]) => {
    const workSessions = sessions.filter(s => s.sessionType === 'work' && !s.interrupted);
    const totalMinutes = workSessions.reduce((sum, session) => sum + session.actualDuration, 0);
    const uniqueProjects = new Set(sessions.map(s => s.projectId)).size;
    
    // Calculate daily progress (today only)
    const today = startOfDay(new Date());
    const todaySessions = sessions.filter(session => {
      const sessionDate = new Date(session.completedAt);
      return sessionDate >= today && session.sessionType === 'work' && !session.interrupted;
    });

    setStats({
      totalSessions: workSessions.length,
      totalTimeWorked: totalMinutes,
      averageSessionTime: workSessions.length > 0 ? Math.round(totalMinutes / workSessions.length) : 0,
      projectsWorkedOn: uniqueProjects,
      streakDays: 0, // TODO: Implement streak calculation
      lastSessionDate: sessions.length > 0 ? sessions[0].completedAt : '',
      dailyGoal: 8,
      dailyProgress: todaySessions.length,
    });
  };

  // Debug function to check sessions
  const debugSessions = async () => {
    console.log('🔧 Debug: Checking sessions for user:', userId);
    const debugResult = await debugGetSessions(userId);
    toast({
      title: 'Debug Sessions',
      description: `Se encontraron ${debugResult.length} sesiones. Ver consola para detalles.`,
    });
  };

  const exportToCSV = () => {
    const headers = [
      'Fecha',
      'Proyecto',
      'Tipo de Sesión',
      'Duración Planeada (min)',
      'Duración Real (min)',
      'Interrumpida',
      'Notas'
    ];

    const csvData = filteredSessions.map(session => [
      format(new Date(session.completedAt), 'dd/MM/yyyy HH:mm', { locale: es }),
      session.projectName,
      session.sessionType === 'work' ? 'Trabajo' : 
      session.sessionType === 'break' ? 'Descanso corto' : 'Descanso largo',
      session.plannedDuration.toString(),
      session.actualDuration.toString(),
      session.interrupted ? 'Sí' : 'No',
      session.notes || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `pomodoro-history-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Exportación completada',
      description: 'El historial se ha descargado como archivo CSV.',
    });
  };

  const exportToJSON = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      period: selectedPeriod,
      projectFilter: selectedProject,
      stats,
      sessions: filteredSessions,
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `pomodoro-data-${format(new Date(), 'yyyy-MM-dd')}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Exportación completada',
      description: 'Los datos se han descargado como archivo JSON.',
    });
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getSessionTypeLabel = (sessionType: string) => {
    switch (sessionType) {
      case 'work':
        return 'Trabajo';
      case 'break':
        return 'Descanso corto';
      case 'longBreak':
        return 'Descanso largo';
      default:
        return sessionType;
    }
  };

  const getSessionTypeBadge = (sessionType: string, interrupted: boolean) => {
    if (interrupted) {
      return <Badge variant="destructive">Interrumpida</Badge>;
    }
    
    switch (sessionType) {
      case 'work':
        return <Badge className="bg-red-500">Trabajo</Badge>;
      case 'break':
        return <Badge className="bg-green-500">Descanso</Badge>;
      case 'longBreak':
        return <Badge className="bg-blue-500">Descanso largo</Badge>;
      default:
        return <Badge variant="outline">{sessionType}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Cargando historial...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Tiempo total</p>
                <p className="text-2xl font-bold">{formatDuration(stats.totalTimeWorked)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Sesiones completadas</p>
                <p className="text-2xl font-bold">{stats.totalSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Promedio por sesión</p>
                <p className="text-2xl font-bold">{formatDuration(stats.averageSessionTime)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Progreso diario</p>
                <p className="text-2xl font-bold">{stats.dailyProgress}/{stats.dailyGoal}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with Tabs */}
      <Tabs defaultValue="table" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="table" className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Tabla de Datos
          </TabsTrigger>
          <TabsTrigger value="charts" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Estadísticas Gráficas
          </TabsTrigger>
        </TabsList>

        {/* Table Tab */}
        <TabsContent value="table">
          {/* Filters and Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Historial de Sesiones
            </span>
            <div className="flex gap-2">
              <Button onClick={debugSessions} size="sm" variant="secondary" className="gap-2">
                🔧 Debug
              </Button>
              <Button onClick={exportToCSV} size="sm" variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                CSV
              </Button>
              <Button onClick={exportToJSON} size="sm" variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                JSON
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            {/* Project Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Proyecto</label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los proyectos</SelectItem>
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

            {/* Period Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Select value={selectedPeriod} onValueChange={(value: FilterPeriod) => setSelectedPeriod(value)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoy</SelectItem>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mes</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Date Range */}
            {selectedPeriod === 'custom' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Rango de fechas</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      {customDateRange.from && customDateRange.to
                        ? `${format(customDateRange.from, 'dd/MM/yy')} - ${format(customDateRange.to, 'dd/MM/yy')}`
                        : 'Seleccionar fechas'
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={{
                        from: customDateRange.from,
                        to: customDateRange.to,
                      }}
                      onSelect={(range) => {
                        setCustomDateRange({
                          from: range?.from,
                          to: range?.to,
                        });
                      }}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          {/* Results Summary */}
          <div className="text-sm text-muted-foreground">
            Mostrando {filteredSessions.length} sesiones
          </div>
        </CardContent>
      </Card>

      {/* Sessions Table */}
      <Card>
        <CardContent className="p-0">
          {filteredSessions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Timer className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay sesiones para los filtros seleccionados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha y Hora</TableHead>
                    <TableHead>Proyecto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Duración</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(session.completedAt), 'dd/MM/yy HH:mm', { locale: es })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ 
                              backgroundColor: projects.find(p => p.id === session.projectId)?.color || '#3b82f6'
                            }}
                          />
                          {session.projectName}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getSessionTypeBadge(session.sessionType, session.interrupted)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDuration(session.actualDuration)}</div>
                          {session.actualDuration !== session.plannedDuration && (
                            <div className="text-muted-foreground text-xs">
                              Planeado: {formatDuration(session.plannedDuration)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {session.interrupted ? (
                          <Badge variant="destructive">Interrumpida</Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600">
                            Completada
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        {session.notes && (
                          <div className="text-sm text-muted-foreground truncate">
                            {session.notes}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        {/* Charts Tab */}
        <TabsContent value="charts">
          <PomodoroCharts sessions={filteredSessions} projects={projects} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
