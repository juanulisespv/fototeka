'use client';

import React, { createContext, useContext, useReducer, useEffect, useRef, ReactNode } from 'react';
import { TimerState, PomodoroProject, PomodoroSettings, SessionType } from '@/lib/types';
import { recordSession } from '@/lib/pomodoro-service';
import { soundManager } from '@/lib/sound-manager';
import { useDynamicFavicon } from '@/hooks/use-dynamic-favicon';
import { useAuth } from '@/context/auth-context';

interface PomodoroContextType {
  timerState: TimerState;
  selectedProject: PomodoroProject | null;
  settings: PomodoroSettings;
  startTimer: () => boolean;
  pauseTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  setSelectedProject: (project: PomodoroProject | null) => void;
  setSettings: (settings: PomodoroSettings) => void;
  updateTimerDurations: (settings: PomodoroSettings) => void;
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

type TimerAction = 
  | { type: 'START_TIMER' }
  | { type: 'PAUSE_TIMER' }
  | { type: 'STOP_TIMER' }
  | { type: 'RESET_TIMER'; workDuration: number }
  | { type: 'TICK'; forceTime?: number }
  | { type: 'COMPLETE_SESSION'; nextSessionType: SessionType; nextDuration: number; sessionsCompleted: number }
  | { type: 'UPDATE_DURATIONS'; settings: PomodoroSettings }
  | { type: 'SET_NEXT_SESSION'; sessionType: SessionType; duration: number };

function timerReducer(state: TimerState, action: TimerAction): TimerState {
  switch (action.type) {
    case 'START_TIMER':
      return { ...state, status: 'running' };
    
    case 'PAUSE_TIMER':
      return { ...state, status: 'paused' };
    
    case 'STOP_TIMER':
    case 'RESET_TIMER':
      return {
        status: 'idle',
        sessionType: 'work',
        timeRemaining: action.type === 'RESET_TIMER' ? action.workDuration * 60 : state.timeRemaining,
        totalTime: action.type === 'RESET_TIMER' ? action.workDuration * 60 : state.totalTime,
        sessionsCompleted: action.type === 'RESET_TIMER' ? 0 : state.sessionsCompleted,
        isBreakTime: false,
      };
    
    case 'TICK':
      if (typeof action.forceTime === 'number') {
        return {
          ...state,
          timeRemaining: Math.max(0, action.forceTime),
        };
      }
      return {
        ...state,
        timeRemaining: Math.max(0, state.timeRemaining - 1),
      };
    
    case 'COMPLETE_SESSION':
      return {
        ...state,
        status: 'completed',
        sessionType: action.nextSessionType,
        timeRemaining: action.nextDuration * 60,
        totalTime: action.nextDuration * 60,
        sessionsCompleted: action.sessionsCompleted,
        isBreakTime: action.nextSessionType !== 'work',
      };
    
    case 'UPDATE_DURATIONS':
      if (state.status === 'idle' && state.sessionType === 'work') {
        return {
          ...state,
          timeRemaining: action.settings.workDuration * 60,
          totalTime: action.settings.workDuration * 60,
        };
      }
      return state;
    
    case 'SET_NEXT_SESSION':
      return {
        ...state,
        status: 'idle',
        sessionType: action.sessionType,
        timeRemaining: action.duration * 60,
        totalTime: action.duration * 60,
        isBreakTime: action.sessionType !== 'work',
      };
    
    default:
      return state;
  }
}

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth(); // Usar el contexto de autenticación
  const [selectedProject, setSelectedProject] = React.useState<PomodoroProject | null>(null);
  const [settings, setSettings] = React.useState<PomodoroSettings>({
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
  });

  // Load initial timer state from localStorage
  const getInitialTimerState = (): TimerState => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pomodoroTimerState');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Reset to idle if it was running (can't continue after page reload)
          if (parsed.status === 'running') {
            return {
              ...parsed,
              status: 'paused' as const,
            };
          }
          return parsed;
        } catch {
          // If parsing fails, use default
        }
      }
    }
    
    return {
      status: 'idle',
      sessionType: 'work',
      timeRemaining: settings.workDuration * 60,
      totalTime: settings.workDuration * 60,
      sessionsCompleted: 0,
      isBreakTime: false,
    };
  };

  const [timerState, dispatch] = useReducer(timerReducer, getInitialTimerState());

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null); // timestamp en ms
  const notificationRef = useRef<Notification | null>(null);

  // Save timer state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pomodoroTimerState', JSON.stringify(timerState));
    }
  }, [timerState]);

  // Load selected project from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pomodoroSelectedProject');
      if (saved) {
        try {
          const project = JSON.parse(saved);
          setSelectedProject(project);
        } catch {
          // If parsing fails, ignore
        }
      }
    }
  }, []);

  // Save selected project to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (selectedProject) {
        localStorage.setItem('pomodoroSelectedProject', JSON.stringify(selectedProject));
      } else {
        localStorage.removeItem('pomodoroSelectedProject');
      }
    }
  }, [selectedProject]);

  // Set user ID from context if available
  useEffect(() => {
  // ...existing code...
  }, [user]);

  // Dynamic favicon based on timer state
  const isTimerActive = timerState.status === 'running' || timerState.status === 'paused';
  useDynamicFavicon(isTimerActive, timerState.timeRemaining);

  // Timer interval effect
  useEffect(() => {
    if (timerState.status === 'running') {
      // Guardar el tiempo de inicio si no está definido
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now() - (timerState.totalTime - timerState.timeRemaining) * 1000;
      }
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const now = Date.now();
          const elapsed = Math.floor((now - startTimeRef.current) / 1000);
          const newTimeRemaining = Math.max(0, timerState.totalTime - elapsed);
          if (newTimeRemaining !== timerState.timeRemaining) {
            dispatch({ type: 'TICK', forceTime: newTimeRemaining });
          }
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      startTimeRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState.status, timerState.totalTime]);

  // Handle session completion
  useEffect(() => {
    if (timerState.timeRemaining === 0 && timerState.status === 'running') {
      handleSessionComplete();
    }
  }, [timerState.timeRemaining, timerState.status]);

  // Auto-start next session
  useEffect(() => {
    if (timerState.status === 'completed') {
      const shouldAutoStart = 
        (timerState.sessionType !== 'work' && settings.autoStartBreaks) ||
        (timerState.sessionType === 'work' && settings.autoStartWork);
      
      if (shouldAutoStart) {
        setTimeout(() => {
          dispatch({ type: 'SET_NEXT_SESSION', sessionType: timerState.sessionType, duration: timerState.totalTime / 60 });
          startTimer();
        }, 3000);
      } else {
        setTimeout(() => {
          dispatch({ type: 'SET_NEXT_SESSION', sessionType: timerState.sessionType, duration: timerState.totalTime / 60 });
        }, 1000);
      }
    }
  }, [timerState.status, timerState.sessionType, settings.autoStartBreaks, settings.autoStartWork]);

  const getNextSessionType = (): SessionType => {
    if (timerState.sessionType === 'work') {
      const completedSessions = timerState.sessionsCompleted + 1;
      return completedSessions % settings.sessionsUntilLongBreak === 0 ? 'longBreak' : 'break';
    }
    return 'work';
  };

  const getSessionDuration = (sessionType: SessionType): number => {
    switch (sessionType) {
      case 'work':
        return settings.workDuration;
      case 'break':
        return settings.shortBreakDuration;
      case 'longBreak':
        return settings.longBreakDuration;
      default:
        return settings.workDuration;
    }
  };

  const handleSessionComplete = async () => {
    const actualDuration = Math.ceil((timerState.totalTime - timerState.timeRemaining) / 60);
    
    // Record session if it's a work session and user is available
    if (selectedProject && timerState.sessionType === 'work' && user?.uid) {
      try {
        console.log('Recording session:', {
          userId: user.uid,
          projectId: selectedProject.id,
          sessionType: timerState.sessionType,
          actualDuration
        });
        
        await recordSession(
          user.uid,
          selectedProject.id,
          selectedProject.name,
          timerState.sessionType,
          timerState.totalTime / 60,
          actualDuration,
          false
        );
        
  // ...existing code...
      } catch (error) {
        console.error('Error recording session:', error);
      }
    } else {
      console.log('Session not recorded:', {
        hasProject: !!selectedProject,
        sessionType: timerState.sessionType,
        hasUser: !!user?.uid
      });
    }

    // Play notification sound
    if (settings.soundEnabled) {
      try {
        await soundManager.playSound(
          settings.notificationSound,
          settings.soundVolume / 100
        );
      } catch (error) {
        console.error('Error playing notification sound:', error);
      }
    }

    // Show browser notification
    if (settings.notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      const sessionName = timerState.sessionType === 'work' ? 'Trabajo' : 
                         timerState.sessionType === 'break' ? 'Descanso corto' : 'Descanso largo';
      
      notificationRef.current = new Notification('¡Sesión completada! 🍅', {
        body: `${sessionName} terminado. Tiempo para ${timerState.sessionType === 'work' ? 'descansar' : 'trabajar'}.`,
        icon: '/favicon.ico',
        requireInteraction: true,
      });
    }

    // Prepare next session
    const nextSessionType = getNextSessionType();
    const nextDuration = getSessionDuration(nextSessionType);
    const newSessionsCompleted = timerState.sessionType === 'work' ? timerState.sessionsCompleted + 1 : timerState.sessionsCompleted;
    
    dispatch({ 
      type: 'COMPLETE_SESSION', 
      nextSessionType, 
      nextDuration, 
      sessionsCompleted: newSessionsCompleted 
    });
  };

  const startTimer = () => {
    if (!selectedProject && timerState.sessionType === 'work') {
      return false;
    }

  startTimeRef.current = Date.now() - (timerState.totalTime - timerState.timeRemaining) * 1000;
    dispatch({ type: 'START_TIMER' });
    return true;
  };

  const pauseTimer = () => {
    dispatch({ type: 'PAUSE_TIMER' });
  };

  const stopTimer = async () => {
    // Record interrupted session if applicable
    if (timerState.status === 'running' && selectedProject && timerState.sessionType === 'work' && user?.uid) {
      const actualDuration = Math.ceil((timerState.totalTime - timerState.timeRemaining) / 60);
      if (actualDuration > 0) {
        try {
          await recordSession(
            user.uid,
            selectedProject.id,
            selectedProject.name,
            timerState.sessionType,
            timerState.totalTime / 60,
            actualDuration,
            true // interrupted
          );
        } catch (error) {
          console.error('Error recording interrupted session:', error);
        }
      }
    }

    dispatch({ type: 'STOP_TIMER' });
  };

  const resetTimer = () => {
    dispatch({ type: 'RESET_TIMER', workDuration: settings.workDuration });
  };

  const updateTimerDurations = (newSettings: PomodoroSettings) => {
    setSettings(newSettings);
    dispatch({ type: 'UPDATE_DURATIONS', settings: newSettings });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (notificationRef.current) {
        notificationRef.current.close();
      }
    };
  }, []);

  const contextValue: PomodoroContextType = {
    timerState,
    selectedProject,
    settings,
    startTimer,
    pauseTimer,
    stopTimer,
    resetTimer,
    setSelectedProject,
    setSettings: updateTimerDurations,
    updateTimerDurations,
  };

  return (
    <PomodoroContext.Provider value={contextValue}>
      {children}
    </PomodoroContext.Provider>
  );
}

export function usePomodoro() {
  const context = useContext(PomodoroContext);
  if (context === undefined) {
    throw new Error('usePomodoro must be used within a PomodoroProvider');
  }
  return context;
}
