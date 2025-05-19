import { Location, Group } from '../types';
import { v4 as uuidv4 } from 'uuid';
import * as Excel from 'exceljs';

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
export const saveLocation = (location: Omit<Location, 'id' | 'createdAt'>): void => {
  const data = initializeStorage();
  const newLocation: Location = {
    ...location,
    id: uuidv4(),
    createdAt: Date.now(),
  };
  
  data.locations.push(newLocation);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// Update an existing location
export const updateLocation = (location: Location): void => {
  const data = initializeStorage();
  data.locations = data.locations.map(loc => 
    loc.id === location.id ? location : loc
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// Delete a location
export const deleteLocation = (id: string): void => {
  const data = initializeStorage();
  data.locations = data.locations.filter(location => location.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// Delete all locations
export const deleteAllLocations = (): void => {
  const data = initializeStorage();
  data.locations = [];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// Get all groups
export const getGroups = (): Group[] => {
  const data = initializeStorage();
  return data.groups;
};

// Save a new group
export const saveGroup = (group: Omit<Group, 'id'>): void => {
  const data = initializeStorage();
  const newGroup: Group = {
    ...group,
    id: uuidv4(),
  };
  
  data.groups.push(newGroup);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// Delete a group
export const deleteGroup = (id: string): void => {
  const data = initializeStorage();
  
  // Move locations to default group
  data.locations = data.locations.map(location => 
    location.groupId === id ? { ...location, groupId: 'default' } : location
  );
  
  // Remove group
  data.groups = data.groups.filter(group => group.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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