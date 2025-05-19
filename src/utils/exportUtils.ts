import { Location, Group } from '../types';

/**
 * Converts locations data to CSV format for Excel
 */
export const locationsToCSV = (locations: Location[], groups: Group[]): string => {
  // Create headers
  const headers = ['Title', 'Latitude', 'Longitude', 'Description', 'Tags', 'Group', 'Created At'];
  
  // Map locations to rows
  const rows = locations.map(location => {
    const group = groups.find(g => g.id === location.groupId)?.name || 'Ungrouped';
    const date = new Date(location.createdAt).toLocaleString();
    return [
      location.title,
      location.latitude.toFixed(6),
      location.longitude.toFixed(6),
      location.description,
      location.tags.join(', '),
      group,
      date
    ];
  });
  
  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  
  return csvContent;
};

/**
 * Downloads data as a CSV file
 */
export const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Main export function that generates and downloads the CSV file
 */
export const exportToExcel = (locations: Location[], groups: Group[]): void => {
  const csvContent = locationsToCSV(locations, groups);
  const filename = `locations_export_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadCSV(csvContent, filename);
};