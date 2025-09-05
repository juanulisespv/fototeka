'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Settings, 
  Timer, 
  Bell, 
  Volume2, 
  Play, 
  RotateCcw,
  Upload
} from 'lucide-react';
import { PomodoroSettings as SettingsType } from '@/lib/types';
import { updateUserSettings } from '@/lib/pomodoro-service';
import { SOUND_OPTIONS, soundManager } from '@/lib/sound-manager';
import { usePomodoro } from '@/context/pomodoro-context';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';

interface PomodoroSettingsProps {}

export function PomodoroSettings({}: PomodoroSettingsProps) {
  const { user } = useAuth();
  const { settings, setSettings } = usePomodoro();
  const { toast } = useToast();
  
  const [localSettings, setLocalSettings] = useState<SettingsType>(settings);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
    setHasChanges(false);
  }, [settings]);

  const handleSettingChange = (key: keyof SettingsType, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      await updateUserSettings(user.uid, localSettings);
      setSettings(localSettings);
      setHasChanges(false);
      
      toast({
        title: 'Configuración guardada',
        description: 'Tus preferencias han sido actualizadas exitosamente.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo guardar la configuración. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    const defaultSettings: SettingsType = {
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      sessionsUntilLongBreak: 4,
      autoStartBreaks: false,
      autoStartWork: false,
      soundEnabled: true,
      notificationsEnabled: true,
      soundVolume: 80,
      notificationSound: 'bell',
    };
    
    setLocalSettings(defaultSettings);
    setHasChanges(true);
  };

  const testNotification = async () => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          toast({
            title: 'Permisos denegados',
            description: 'Para recibir notificaciones, permite el acceso en la configuración del navegador.',
            variant: 'destructive',
          });
          return;
        }
      }
      
      if (Notification.permission === 'granted') {
        new Notification('🍅 Pomodoro Test', {
          body: 'Las notificaciones están funcionando correctamente.',
          icon: '/favicon.ico',
        });
        
        toast({
          title: 'Notificación enviada',
          description: 'Si no viste la notificación, verifica los permisos del navegador.',
        });
      } else {
        toast({
          title: 'Notificaciones bloqueadas',
          description: 'Las notificaciones están bloqueadas en tu navegador.',
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'No compatible',
        description: 'Tu navegador no soporta notificaciones.',
        variant: 'destructive',
      });
    }
  };

  const testSound = async () => {
    if (localSettings.soundEnabled) {
      try {
        await soundManager.testSound(
          localSettings.notificationSound,
          localSettings.soundVolume
        );
        
        toast({
          title: 'Sonido de prueba',
          description: 'Así sonarán las notificaciones.',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'No se pudo reproducir el sonido de prueba.',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuración del Pomodoro
          </h3>
          <p className="text-sm text-muted-foreground">
            Personaliza la duración de las sesiones y las preferencias de notificación.
          </p>
        </div>
        
        {hasChanges && (
          <div className="flex gap-2">
            <Button onClick={handleReset} variant="outline" size="sm">
              <RotateCcw className="w-4 h-4 mr-2" />
              Restablecer
            </Button>
            <Button onClick={handleSave} size="sm" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Timer Durations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="w-4 h-4" />
              Duración de las Sesiones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="work-duration">Duración del trabajo (minutos)</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="work-duration"
                  type="number"
                  min="1"
                  max="90"
                  value={localSettings.workDuration}
                  onChange={(e) => handleSettingChange('workDuration', parseInt(e.target.value) || 25)}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">
                  Tiempo de trabajo concentrado
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="short-break">Descanso corto (minutos)</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="short-break"
                  type="number"
                  min="1"
                  max="30"
                  value={localSettings.shortBreakDuration}
                  onChange={(e) => handleSettingChange('shortBreakDuration', parseInt(e.target.value) || 5)}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">
                  Pausa entre sesiones de trabajo
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="long-break">Descanso largo (minutos)</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="long-break"
                  type="number"
                  min="10"
                  max="60"
                  value={localSettings.longBreakDuration}
                  onChange={(e) => handleSettingChange('longBreakDuration', parseInt(e.target.value) || 15)}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">
                  Descanso después de completar el ciclo
                </span>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="sessions-until-long">Sesiones hasta descanso largo</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="sessions-until-long"
                  type="number"
                  min="2"
                  max="8"
                  value={localSettings.sessionsUntilLongBreak}
                  onChange={(e) => handleSettingChange('sessionsUntilLongBreak', parseInt(e.target.value) || 4)}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">
                  Número de pomodoros antes del descanso largo
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications & Automation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notificaciones y Automatización
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Iniciar descansos automáticamente</Label>
                  <p className="text-sm text-muted-foreground">
                    Los descansos empezarán sin intervención
                  </p>
                </div>
                <Switch
                  checked={localSettings.autoStartBreaks}
                  onCheckedChange={(checked) => handleSettingChange('autoStartBreaks', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Iniciar trabajo automáticamente</Label>
                  <p className="text-sm text-muted-foreground">
                    El trabajo empezará después del descanso
                  </p>
                </div>
                <Switch
                  checked={localSettings.autoStartWork}
                  onCheckedChange={(checked) => handleSettingChange('autoStartWork', checked)}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificaciones del navegador</Label>
                  <p className="text-sm text-muted-foreground">
                    Recibir alertas cuando termine una sesión
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={localSettings.notificationsEnabled}
                    onCheckedChange={(checked) => handleSettingChange('notificationsEnabled', checked)}
                  />
                  <Button
                    onClick={testNotification}
                    size="sm"
                    variant="outline"
                    disabled={!localSettings.notificationsEnabled}
                  >
                    Probar
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sonidos de notificación</Label>
                    <p className="text-sm text-muted-foreground">
                      Reproducir sonido al finalizar sesiones
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={localSettings.soundEnabled}
                      onCheckedChange={(checked) => handleSettingChange('soundEnabled', checked)}
                    />
                    <Button
                      onClick={testSound}
                      size="sm"
                      variant="outline"
                      disabled={!localSettings.soundEnabled}
                    >
                      <Volume2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {localSettings.soundEnabled && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Tipo de sonido</Label>
                      <Select
                        value={localSettings.notificationSound}
                        onValueChange={(value) => handleSettingChange('notificationSound', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SOUND_OPTIONS.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              <div className="flex flex-col">
                                <span>{option.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {option.description}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Volumen: {localSettings.soundVolume}%</Label>
                      <Slider
                        value={[localSettings.soundVolume]}
                        onValueChange={(value) => handleSettingChange('soundVolume', value[0])}
                        max={100}
                        min={0}
                        step={10}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Vista Previa de la Configuración</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
              <Timer className="w-8 h-8 mx-auto mb-2 text-red-500" />
              <h4 className="font-semibold">Trabajo</h4>
              <p className="text-2xl font-bold">{localSettings.workDuration}min</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <Play className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <h4 className="font-semibold">Descanso Corto</h4>
              <p className="text-2xl font-bold">{localSettings.shortBreakDuration}min</p>
            </div>
            
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <RotateCcw className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <h4 className="font-semibold">Descanso Largo</h4>
              <p className="text-2xl font-bold">{localSettings.longBreakDuration}min</p>
              <p className="text-xs text-muted-foreground mt-1">
                Cada {localSettings.sessionsUntilLongBreak} sesiones
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
