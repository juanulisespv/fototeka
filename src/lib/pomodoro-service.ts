import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  Timestamp,
  deleteDoc,
  doc,
  updateDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  PomodoroProject, 
  PomodoroSession, 
  PomodoroSettings,
  SessionType 
} from '@/lib/types';

const PROJECTS_COLLECTION = 'pomodoroProjects';
const SESSIONS_COLLECTION = 'pomodoroSessions';
const SETTINGS_COLLECTION = 'pomodoroSettings';

// Project Management
export async function createProject(
  userId: string, 
  name: string, 
  description?: string,
  color?: string
): Promise<string> {
  try {
    const now = new Date();
    const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), {
      userId,
      name,
      description: description || '',
      color: color || '#3b82f6',
      totalTime: 0,
      sessionsCompleted: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating project:', error);
    throw new Error('Failed to create project');
  }
}

export async function getUserProjects(userId: string): Promise<PomodoroProject[]> {
  try {
    const q = query(
      collection(db, PROJECTS_COLLECTION),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const projects: PomodoroProject[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      projects.push({
        id: doc.id,
        name: data.name,
        description: data.description,
        color: data.color,
        totalTime: data.totalTime,
        sessionsCompleted: data.sessionsCompleted,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });

    return projects;
  } catch (error) {
    console.error('Error getting projects:', error);
    throw new Error('Failed to get projects');
  }
}

export async function updateProject(
  projectId: string, 
  updates: Partial<Pick<PomodoroProject, 'name' | 'description' | 'color'>>
): Promise<void> {
  try {
    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
    await updateDoc(projectRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating project:', error);
    throw new Error('Failed to update project');
  }
}

export async function deleteProject(projectId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, PROJECTS_COLLECTION, projectId));
  } catch (error) {
    console.error('Error deleting project:', error);
    throw new Error('Failed to delete project');
  }
}

// Session Management
export async function recordSession(
  userId: string,
  projectId: string,
  projectName: string,
  sessionType: SessionType,
  plannedDuration: number,
  actualDuration: number,
  interrupted: boolean = false,
  notes?: string
): Promise<string> {
  try {
    const now = new Date();
    const docRef = await addDoc(collection(db, SESSIONS_COLLECTION), {
      userId,
      projectId,
      projectName,
      sessionType,
      plannedDuration,
      actualDuration,
      completedAt: now.toISOString(),
      interrupted,
      notes: notes || '',
    });

    // Update project statistics
    if (sessionType === 'work' && !interrupted) {
      const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (projectDoc.exists()) {
        const projectData = projectDoc.data();
        await updateDoc(projectRef, {
          totalTime: projectData.totalTime + actualDuration,
          sessionsCompleted: projectData.sessionsCompleted + 1,
          updatedAt: now.toISOString(),
        });
      }
    }
    
    return docRef.id;
  } catch (error) {
    console.error('Error recording session:', error);
    throw new Error('Failed to record session');
  }
}

export async function getUserSessions(
  userId: string,
  limit?: number,
  projectId?: string
): Promise<PomodoroSession[]> {
  try {
    let q = query(
      collection(db, SESSIONS_COLLECTION),
      where('userId', '==', userId),
      orderBy('completedAt', 'desc')
    );

    if (projectId) {
      q = query(
        collection(db, SESSIONS_COLLECTION),
        where('userId', '==', userId),
        where('projectId', '==', projectId),
        orderBy('completedAt', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    const sessions: PomodoroSession[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      sessions.push({
        id: doc.id,
        userId: data.userId,
        projectId: data.projectId,
        projectName: data.projectName,
        sessionType: data.sessionType,
        plannedDuration: data.plannedDuration,
        actualDuration: data.actualDuration,
        completedAt: data.completedAt,
        interrupted: data.interrupted,
        notes: data.notes,
      });
    });

    return limit ? sessions.slice(0, limit) : sessions;
  } catch (error) {
    console.error('Error getting sessions:', error);
    throw new Error('Failed to get sessions');
  }
}

// Settings Management
export async function getUserSettings(userId: string): Promise<PomodoroSettings> {
  try {
    const q = query(
      collection(db, SETTINGS_COLLECTION),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      // Return default settings
      return {
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
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data();
    
    return {
      workDuration: data.workDuration,
      shortBreakDuration: data.shortBreakDuration,
      longBreakDuration: data.longBreakDuration,
      sessionsUntilLongBreak: data.sessionsUntilLongBreak,
      autoStartBreaks: data.autoStartBreaks,
      autoStartWork: data.autoStartWork,
      soundEnabled: data.soundEnabled,
      notificationsEnabled: data.notificationsEnabled,
      soundVolume: data.soundVolume,
      notificationSound: data.notificationSound || 'bell',
    };
  } catch (error) {
    console.error('Error getting settings:', error);
    throw new Error('Failed to get settings');
  }
}

export async function updateUserSettings(
  userId: string, 
  settings: PomodoroSettings
): Promise<void> {
  try {
    const q = query(
      collection(db, SETTINGS_COLLECTION),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      // Create new settings document
      await addDoc(collection(db, SETTINGS_COLLECTION), {
        userId,
        ...settings,
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Update existing settings
      const docRef = querySnapshot.docs[0].ref;
      await updateDoc(docRef, {
        ...settings,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error updating settings:', error);
    throw new Error('Failed to update settings');
  }
}

// Statistics and Export
export async function getSessionsByDateRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<PomodoroSession[]> {
  try {
    const q = query(
      collection(db, SESSIONS_COLLECTION),
      where('userId', '==', userId),
      where('completedAt', '>=', startDate),
      where('completedAt', '<=', endDate),
      orderBy('completedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const sessions: PomodoroSession[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      sessions.push({
        id: doc.id,
        userId: data.userId,
        projectId: data.projectId,
        projectName: data.projectName,
        sessionType: data.sessionType,
        plannedDuration: data.plannedDuration,
        actualDuration: data.actualDuration,
        completedAt: data.completedAt,
        interrupted: data.interrupted,
        notes: data.notes,
      });
    });

    return sessions;
  } catch (error) {
    console.error('Error getting sessions by date range:', error);
    throw new Error('Failed to get sessions by date range');
  }
}
