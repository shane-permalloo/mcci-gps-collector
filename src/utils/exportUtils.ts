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
    alert('No locations with shop ID found. Please assign Directus IDs to locations first.');
    return;
  }
  
  // Use the existing locationsToCSV function to convert to CSV format
  const csvContent = locationsToCSV(directusLocations, groups);
  
  // Create a filename with directus-only indicator
  const filename = `FilledShopID-Locations-${new Date().toISOString().slice(0, 10)}-${Math.floor(Math.random() * 90000) + 10000}.csv`;
  
  // Use the existing downloadCSV function
  downloadCSV(csvContent, filename);
};

/**
 * Generates a SQL migration script for exporting locations and groups data
 */
export const generateSQLMigration = (locations: Location[], groups: Group[]): string => {
  // Start with SQL transaction and comments
  let sql = `-- SQL Migration generated on ${new Date().toISOString()}
-- This script will recreate your locations and groups with the same IDs
-- Run this in the Supabase SQL Editor

BEGIN;

-- Clear existing data (optional, comment out if you want to keep existing data)
-- DELETE FROM public.locations;
-- DELETE FROM public.groups WHERE id != 'default';

-- Insert groups data
INSERT INTO public.groups (id, name, color, description, created_at, user_id)
VALUES
`;

  // Add groups data
  const groupValues = groups
    .filter(group => group.id !== 'default') // Skip default group as it should already exist
    .map(group => {
      const description = group.description ? `'${group.description.replace(/'/g, "''")}'` : 'NULL';
      return `  ('${group.id}', '${group.name.replace(/'/g, "''")}', '${group.color || ""}', ${description}, NOW(), auth.uid())`;
    });
  
  sql += groupValues.join(',\n');
  sql += `
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  color = EXCLUDED.color,
  description = EXCLUDED.description;

-- Insert locations data
INSERT INTO public.locations (id, title, latitude, longitude, description, tags, group_id, created_at, user_id, directus_id)
VALUES
`;

  // Add locations data
  const locationValues = locations.map(location => {
    const description = location.description ? `'${location.description.replace(/'/g, "''")}'` : 'NULL';
    const directusId = location.directusId ? `'${location.directusId}'` : 'NULL';
    const tags = JSON.stringify(location.tags || []).replace(/"/g, "'");
    const groupId = location.groupId ? `'${location.groupId}'` : 'NULL';
    
    return `  ('${location.id}', '${location.title.replace(/'/g, "''")}', ${location.latitude}, ${location.longitude}, ${description}, ${tags}::text[], ${groupId}, to_timestamp(${location.createdAt / 1000}), auth.uid(), ${directusId})`;
  });
  
  sql += locationValues.join(',\n');
  sql += `
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  description = EXCLUDED.description,
  tags = EXCLUDED.tags,
  group_id = EXCLUDED.group_id,
  directus_id = EXCLUDED.directus_id;

COMMIT;
`;

  return sql;
};

/**
 * Exports locations and groups as a SQL migration file
 */
export const exportToSQLMigration = async (locations: Location[], groups: Group[]): void => {
  const sqlContent = generateSQLMigration(locations, groups);
  const filename = `MCCI-GPS-Migration-${new Date().toISOString().slice(0, 10)}.sql`;
  
  // Use the existing downloadCSV function but with SQL content
  downloadCSV(sqlContent, filename);
};

