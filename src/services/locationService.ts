import { Location, Group } from '../types';
import { v4 as uuidv4 } from 'uuid';
import * as Excel from 'exceljs';
import { supabase } from '../lib/supabase';

const STORAGE_KEY = 'gps-tracker-data';

// Default groups
const DEFAULT_GROUPS: Group[] = [
  { id: 'default', name: 'Default', color: '#252525' }
];

// Initialize local storage with default data if empty
const initializeStorage = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    const initialData = {
      groups: DEFAULT_GROUPS,
      locations: [],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
  }
  return JSON.parse(data);
};

// Get all locations
export const getLocations = (): Location[] => {
  const data = initializeStorage();
  return data.locations;
};

// Save a new location
export const saveLocation = async (location: Location): Promise<void> => {
  // Save to localStorage
  const data = initializeStorage();
  data.locations.push(location);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

  // Get the current user's ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User must be authenticated to save locations');
  }

  // Save to Supabase
  try {
    const { error } = await supabase.from('locations').insert({
      id: location.id,
      title: location.title,
      latitude: location.latitude,
      longitude: location.longitude,
      description: location.description,
      tags: location.tags,
      group_id: location.groupId === 'default' ? null : location.groupId,
      created_at: new Date(location.createdAt).toISOString(),
      user_id: user.id, // Add the user_id field
    });

    if (error) {
      console.error('Error saving to Supabase:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to save to Supabase:', error);
    // Note: We don't throw here to maintain backwards compatibility
    // The data is still saved in localStorage
  }
};

// Update an existing location
export const updateLocation = async (location: Location): Promise<void> => {
  // Update in localStorage
  const data = initializeStorage();
  data.locations = data.locations.map(loc => 
    loc.id === location.id ? location : loc
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

  // Get the current user's ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User must be authenticated to update locations');
  }

  // Update in Supabase
  try {
    const { error } = await supabase
      .from('locations')
      .update({
        title: location.title,
        latitude: location.latitude,
        longitude: location.longitude,
        description: location.description,
        tags: location.tags,
        group_id: location.groupId === 'default' ? null : location.groupId,
      })
      .eq('id', location.id)
      .eq('user_id', user.id); // Ensure we only update the user's own locations

    if (error) {
      console.error('Error updating in Supabase:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to update in Supabase:', error);
  }
};

// Delete a location
export const deleteLocation = async (id: string): Promise<void> => {
  // Delete from localStorage
  const data = initializeStorage();
  data.locations = data.locations.filter(location => location.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

  // Get the current user's ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User must be authenticated to delete locations');
  }

  // Delete from Supabase
  try {
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id); // Ensure we only delete the user's own locations

    if (error) {
      console.error('Error deleting from Supabase:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to delete from Supabase:', error);
  }
};

// Delete all locations
export const deleteAllLocations = async (): Promise<void> => {
  // Delete from localStorage
  const data = initializeStorage();
  data.locations = [];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

  // Get the current user's ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User must be authenticated to delete all locations');
  }

  // Delete from Supabase
  try {
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('user_id', user.id); // Only delete the user's own locations

    if (error) {
      console.error('Error deleting all from Supabase:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to delete all from Supabase:', error);
  }
};

// Get all groups
export const getGroups = (): Group[] => {
  const data = initializeStorage();
  return data.groups;
};

// Save a new group
export const saveGroup = async (group: Group): Promise<void> => {
  // Save to localStorage
  const data = initializeStorage();
  data.groups.push(group);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

  // Get the current user's ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User must be authenticated to save groups');
  }

  // Save to Supabase
  try {
    const { error } = await supabase.from('groups').insert({
      id: group.id,
      name: group.name,
      color: group.color,
      user_id: user.id, // Add the user_id field
    });

    if (error) {
      console.error('Error saving group to Supabase:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to save group to Supabase:', error);
  }
};

// Delete a group
export const deleteGroup = async (id: string): Promise<void> => {
  // Delete from localStorage
  const data = initializeStorage();
  data.locations = data.locations.map(location => 
    location.groupId === id ? { ...location, groupId: 'default' } : location
  );
  data.groups = data.groups.filter(group => group.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

  // Get the current user's ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User must be authenticated to delete groups');
  }

  // Delete from Supabase
  try {
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id); // Ensure we only delete the user's own groups

    if (error) {
      console.error('Error deleting group from Supabase:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to delete group from Supabase:', error);
  }
};

// Export to Excel with separate sheets for each group
export const exportToExcel = async (locations: Location[], groups: Group[]): Promise<void> => {
  const workbook = new Excel.Workbook();
  
  // Create a sheet for each group
  for (const group of groups) {
    const sheet = workbook.addWorksheet(group.name);
    
    // Set up headers
    sheet.columns = [
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Latitude', key: 'latitude', width: 15 },
      { header: 'Longitude', key: 'longitude', width: 15 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Tags', key: 'tags', width: 30 },
      { header: 'Created At', key: 'createdAt', width: 20 },
    ];
    
    // Style the header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: group.color.replace('#', '') + 'CC' },
    };
    
    // Add locations for this group
    const groupLocations = locations.filter(loc => loc.groupId === group.id);
    groupLocations.forEach(location => {
      sheet.addRow({
        title: location.title,
        latitude: location.latitude,
        longitude: location.longitude,
        description: location.description,
        tags: location.tags.join(', '),
        createdAt: new Date(location.createdAt).toLocaleString(),
      });
    });
    
    // Auto-filter
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 6 },
    };
  }
  
  // Generate and download the file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `locations_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};