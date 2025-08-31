

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
    
