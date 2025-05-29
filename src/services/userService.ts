import { supabase } from '../lib/supabase';

// Define our simplified User type
export interface User {
  id: string;
  name?: string;
  created_at?: string;
  active?: boolean;
}

/**
 * Fetch all users from the Supabase Auth
 */
export const getUsers = async (): Promise<User[]> => {
  try {
    // Get locations with user IDs
    const { data: locations, error: locationsError } = await supabase
      .from('locations')
      .select('user_id')
      .not('user_id', 'is', null);
      
    if (locationsError) {
      console.error('Error fetching location users:', locationsError);
      return [];
    }
    
    // Get unique user IDs
    const userIds = [...new Set(locations.map(loc => loc.user_id))];
    
    // Get current user for comparison
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    // Create user objects from the IDs
    const users: User[] = [];
    
    // Add current user first with basic information
    if (currentUser && userIds.includes(currentUser.id)) {
      users.push({
        id: currentUser.id,
        name: currentUser.user_metadata?.name,
        active: true
      });
    }
    
    // Add other users with limited information
    userIds.forEach(id => {
      if (currentUser && id === currentUser.id) return; // Skip current user as already added
      
      users.push({
        id,
        active: true
      });
    });
    
    return users;
  } catch (error) {
    console.error('Error in getUsers:', error);
    return [];
  }
};

/**
 * Get the current authenticated user
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;
    
    return {
      id: user.id,
      name: user.user_metadata?.name,
      created_at: user.created_at,
      active: true
    };
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
};



