export interface Location {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  createdAt: number;
  groupId?: string;
  directusId?: string; // Add this field to store the Directus shop ID
}

export interface Group {
  id: string;
  name: string;
  color: string;
  isOwner?: boolean;
}
