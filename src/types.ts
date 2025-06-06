export interface Location {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  description?: string;
  tags?: string[];
  groupId: string;
  createdAt: number;
  directusId?: string;
  user_id?: string;
  isOwner?: boolean;
}

