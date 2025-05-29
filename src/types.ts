// Add User type if it doesn't exist
export interface User {
  id: string;
  email?: string;
  name?: string;
  created_at?: string;
  updated_at?: string;
  active?: boolean;
}