export interface Location {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  description: string;
  tags: string[];
  groupId: string;
  createdAt: number;
  userId?: string;
  isOwner?: boolean;
}

export interface Group {
  id: string;
  name: string;
  color: string;
  isOwner?: boolean;
}