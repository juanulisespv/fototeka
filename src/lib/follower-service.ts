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
  updateDoc 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FollowerRecord, SocialNetwork, DateFilter } from '@/lib/types';

const COLLECTION_NAME = 'followerRecords';

export interface AddFollowerRecordData {
  userId: string;
  socialNetwork: SocialNetwork;
  followerCount: number;
}

export async function addFollowerRecord(data: AddFollowerRecordData): Promise<string> {
  try {
    const now = new Date();
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      userId: data.userId,
      socialNetwork: data.socialNetwork,
      followerCount: data.followerCount,
      recordedAt: now.toISOString(),
      createdAt: Timestamp.fromDate(now),
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding follower record:', error);
    throw new Error('Failed to add follower record');
  }
}

export async function getFollowerRecords(
  userId: string, 
  dateFilter?: DateFilter
): Promise<FollowerRecord[]> {
  try {
    let q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('recordedAt', 'desc')
    );

    // Aplicar filtros de fecha si se proporcionan
    if (dateFilter?.startDate && dateFilter?.endDate) {
      q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        where('recordedAt', '>=', dateFilter.startDate),
        where('recordedAt', '<=', dateFilter.endDate),
        orderBy('recordedAt', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    const records: FollowerRecord[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      records.push({
        id: doc.id,
        userId: data.userId,
        socialNetwork: data.socialNetwork,
        followerCount: data.followerCount,
        recordedAt: data.recordedAt,
        createdAt: data.createdAt,
      });
    });

    return records;
  } catch (error) {
    console.error('Error getting follower records:', error);
    throw new Error('Failed to get follower records');
  }
}

export async function getFollowerRecordsByNetwork(
  userId: string,
  socialNetwork: SocialNetwork,
  dateFilter?: DateFilter
): Promise<FollowerRecord[]> {
  try {
    let q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      where('socialNetwork', '==', socialNetwork),
      orderBy('recordedAt', 'desc')
    );

    // Aplicar filtros de fecha si se proporcionan
    if (dateFilter?.startDate && dateFilter?.endDate) {
      q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        where('socialNetwork', '==', socialNetwork),
        where('recordedAt', '>=', dateFilter.startDate),
        where('recordedAt', '<=', dateFilter.endDate),
        orderBy('recordedAt', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    const records: FollowerRecord[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      records.push({
        id: doc.id,
        userId: data.userId,
        socialNetwork: data.socialNetwork,
        followerCount: data.followerCount,
        recordedAt: data.recordedAt,
        createdAt: data.createdAt,
      });
    });

    return records;
  } catch (error) {
    console.error('Error getting follower records by network:', error);
    throw new Error('Failed to get follower records by network');
  }
}

export async function updateFollowerRecord(
  recordId: string,
  updates: Partial<Pick<FollowerRecord, 'followerCount' | 'socialNetwork'>>
): Promise<void> {
  try {
    const recordRef = doc(db, COLLECTION_NAME, recordId);
    await updateDoc(recordRef, {
      ...updates,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  } catch (error) {
    console.error('Error updating follower record:', error);
    throw new Error('Failed to update follower record');
  }
}

export async function deleteFollowerRecord(recordId: string): Promise<void> {
  try {
    const recordRef = doc(db, COLLECTION_NAME, recordId);
    await deleteDoc(recordRef);
  } catch (error) {
    console.error('Error deleting follower record:', error);
    throw new Error('Failed to delete follower record');
  }
}

// Función de utilidad para obtener estadísticas rápidas
export async function getFollowerStats(userId: string) {
  try {
    const records = await getFollowerRecords(userId);
    const networks = ['LinkedIn', 'Instagram', 'YouTube', 'Facebook', 'Pinterest', 'TikTok'] as const;
    
    const stats = networks.map(network => {
      const networkRecords = records
        .filter(r => r.socialNetwork === network)
        .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
      
      if (networkRecords.length === 0) {
        return {
          network,
          currentFollowers: 0,
          totalRecords: 0,
          lastUpdate: null,
        };
      }

      return {
        network,
        currentFollowers: networkRecords[0].followerCount,
        totalRecords: networkRecords.length,
        lastUpdate: networkRecords[0].recordedAt,
      };
    });

    const totalFollowers = stats.reduce((sum, stat) => sum + stat.currentFollowers, 0);
    const totalRecords = records.length;

    return {
      stats,
      totalFollowers,
      totalRecords,
      lastUpdate: records.length > 0 ? records[0].recordedAt : null,
    };
  } catch (error) {
    console.error('Error getting follower stats:', error);
    throw new Error('Failed to get follower stats');
  }
}
