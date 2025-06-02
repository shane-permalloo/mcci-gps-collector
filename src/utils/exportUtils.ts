import { Location, Group } from '../types';

/**
 * Converts locations data to CSV format for Directus import compatibility
 * Matches the format: id,shop_name,shop_malls,shop_location.type,shop_location.coordinates
 */
export const locationsToCSV = (locations: Location[], groups: Group[]): string => {
  // Create headers matching the Directus import format
  const headers = ['id', 'shop_name', 'shop_malls', 'shop_location.type', 'shop_location.coordinates'];

  // Map locations to rows
  const rows = locations.map(location => {
    // Get the group for this location
    const group = location.groupId ? groups.find(g => g.id === location.groupId) : null;
    const groupName = group?.name || '';

    // Format mall data as JSON string with the required structure
    // If group name is "Default", use empty array regardless of groupId
    const mallsJson = location.groupId && groupName !== "Default" ?
      `[{"Malls_id":{"mall_name":"${groupName}"}}]` :
      '[]';

    // Format coordinates as [longitude,latitude]
    const coordinates = location.longitude && location.latitude ?
      `[${location.longitude.toFixed(7)},${location.latitude.toFixed(7)}]` :
      '';

    // Use the directusId if available, otherwise use 'XXX' as placeholder
    const id = location.directusId || 'XXX';

    return [
      id, // Use directusId if available
      location.title,
      mallsJson,
      coordinates ? 'Point' : '', // Only add 'Point' if coordinates exist
      coordinates
    ];
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map((cell, index) => {
      // Handle special formatting to match test-shops.csv format
      if (index === 0) {
        // ID field - no quotes for IDs
        return String(cell);
      } else if (index === 2) {
        // shop_malls field - no quotes for arrays
        return String(cell);
      } else if (index === 3) {
        // shop_location.type field - no quotes for Point
        return String(cell);
      } else if (index === 4) {
        // shop_location.coordinates field - quote the array
        return `"${String(cell)}"`;
      } else {
        // shop_name and other fields - quote them
        return `"${String(cell).replace(/"/g, '""')}"`;
      }
    }).join(','))
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
 * with the specific format required for Directus import compatibility
 * Note: IDs are set to "XXX" and must be replaced with actual Directus shop IDs before import
 */
export const exportToCSVFile = (locations: Location[], groups: Group[]): void => {
  const csvContent = locationsToCSV(locations, groups);
  const filename = `Location-Exported-${new Date().toISOString().slice(0, 10)}-${Math.floor(Math.random() * 90000) + 10000}.csv`;
  downloadCSV(csvContent, filename);
};

/**
 * Exports only locations with non-null directus_id to CSV
 * Uses the same format as the regular CSV export
 */
export const exportDirectusLocationsToCSV = (locations: Location[], groups: Group[]): void => {
  // Filter locations to only include those with non-null directus_id
  const directusLocations = locations.filter(location => location.directusId != null);
  
  if (directusLocations.length === 0) {
    alert('No locations with Directus IDs found. Please assign Directus IDs to locations first.');
    return;
  }
  
  // Use the existing locationsToCSV function to convert to CSV format
  const csvContent = locationsToCSV(directusLocations, groups);
  
  // Create a filename with directus-only indicator
  const filename = `Directus-Locations-${new Date().toISOString().slice(0, 10)}-${Math.floor(Math.random() * 90000) + 10000}.csv`;
  
  // Use the existing downloadCSV function
  downloadCSV(csvContent, filename);
};

