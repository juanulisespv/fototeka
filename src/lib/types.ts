

export interface Tag {
  id: string;
  label: string;
  color: string;
  order: number;
}

export interface MediaFile {
  id: string;
  name: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl: string;
  size: number; // in bytes
  createdAt: string; // ISO string
  tags: string[]; // array of tag IDs
  description?: string;
  location?: string;
  associatedProduct?: string;
  dataAiHint?: string;
  width?: number;
  height?: number;
}

export interface EditorialPost {
    id: string;
    title: string;
    text: string;
    explicacion?: string;
    link: string;
    mediaUrls: string[];
    socialNetwork: 'Instagram' | 'Facebook' | 'LinkedIn' | 'X' | 'TikTok';
    campaign: string;
    publicationDate: string; // ISO string
    creationDate: string; // ISO string
    tags: string[];
    status: 'Draft' | 'Scheduled' | 'Published';
}

export interface TaskGroup {
  id: string;
  name: string;
  order: number;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
}

export interface Task {
  id: string;
  groupId: string;
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed';
  order: number;
  createdAt: {
      seconds: number;
      nanoseconds: number;
  }
}

export interface Campaign {
  id: string;
  title: string;
  stars: number;
  desc: string;
  example: string;
  objective: string;
  format: string;
  order: number;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
}

// Social Media Analytics Types
export type SocialNetwork = 'LinkedIn' | 'Instagram' | 'YouTube' | 'Facebook' | 'Pinterest' | 'TikTok';

export interface FollowerRecord {
  id: string;
  userId: string;
  socialNetwork: SocialNetwork;
  followerCount: number;
  recordedAt: string; // ISO string
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
}

export interface SocialNetworkStats {
  network: SocialNetwork;
  currentFollowers: number;
  previousFollowers: number;
  growth: number;
  growthPercentage: number;
  lastUpdated: string;
}

export interface DateFilter {
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  startDate?: string;
  endDate?: string;
}

// Pomodoro Types
export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';
export type SessionType = 'work' | 'break' | 'longBreak';
export type NotificationSound = 'bell' | 'chime' | 'beep' | 'digital' | 'gentle' | 'custom';

export interface SoundOption {
  id: NotificationSound;
  name: string;
  description: string;
  file?: string; // For custom sounds
}

export interface PomodoroProject {
  id: string;
  name: string;
  description?: string;
  color?: string;
  totalTime: number; // total minutes worked
  sessionsCompleted: number;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface PomodoroSession {
  id: string;
  userId: string;
  projectId: string;
  projectName: string;
  sessionType: SessionType;
  plannedDuration: number; // minutes
  actualDuration: number; // minutes
  completedAt: string; // ISO string
  interrupted: boolean;
  notes?: string;
}

export interface PomodoroSettings {
  workDuration: number; // minutes, default 25
  shortBreakDuration: number; // minutes, default 5
  longBreakDuration: number; // minutes, default 15
  sessionsUntilLongBreak: number; // default 4
  autoStartBreaks: boolean;
  autoStartWork: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  soundVolume: number; // 0-100
  notificationSound: NotificationSound; // selected sound type
}

export interface TimerState {
  status: TimerStatus;
  sessionType: SessionType;
  timeRemaining: number; // seconds
  totalTime: number; // seconds
  currentProject?: PomodoroProject;
  sessionsCompleted: number;
  isBreakTime: boolean;
}

export interface PomodoroStats {
  totalSessions: number;
  totalTimeWorked: number; // minutes
  averageSessionTime: number; // minutes
  projectsWorkedOn: number;
  streakDays: number;
  lastSessionDate: string;
  dailyGoal: number; // sessions per day
  dailyProgress: number; // sessions completed today
}
    
