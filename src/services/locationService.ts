import { Location, Group } from "../types";
import * as Excel from "exceljs";
import { supabase } from "../lib/supabase";
import { DIRECTUS_CONFIG } from '../utils/csvImportUtils';

const DEFAULT_GROUPS: Group[] = [
  { id: "default", name: "Default", color: "25252500" },
];

// Get all locations
export const getLocations = async (): Promise<Location[]> => {
  try {
    // Get the current user first
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id;

    const { data: locations, error } = await supabase
      .from("locations")
      .select("*");

    if (error) {
      console.error("Error fetching locations:", error);
      throw error;
    }

    return locations.map(location => ({
      id: location.id,
      title: location.title,
      latitude: location.latitude,
      longitude: location.longitude,
      description: location.description || "",
      tags: location.tags || [],
      groupId: location.group_id || "default",
      userId: location.user_id,
      createdAt: new Date(location.created_at).getTime(),
      isOwner: currentUserId === location.user_id
    }));
  } catch (error) {
    console.error("Failed to fetch locations:", error);
    throw error;
  }
};

// Save a new location
export const saveLocation = async (location: Location): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("User must be authenticated to save locations");
  }

  try {
    // Save the location
    const { error: locationError } = await supabase.from("locations").insert({
      id: location.id,
      title: location.title,
      latitude: location.latitude,
      longitude: location.longitude,
      description: location.description,
      tags: location.tags,
      group_id: location.groupId === "default" ? null : location.groupId,
      created_at: new Date(location.createdAt).toISOString(),
      user_id: user.id,
    });

    if (locationError) {
      throw locationError;
    }

    // Generate a random 3-digit ID for imported_locations
    const randomId = Math.floor(Math.random() * (999 - 100 + 1)) + 100;

    // Add to imported_locations if it doesn't exist
    const { error: importError } = await supabase
      .from("imported_locations")
      .insert({ 
        id: randomId,
        title: location.title 
      })
      .select()
      .maybeSingle();

    // Ignore duplicate title errors
    if (importError && !importError.message.includes('duplicate')) {
      throw importError;
    }
  } catch (error) {
    console.error("Failed to save location:", error);
    throw error;
  }
};

// Update an existing location
export const updateLocation = async (location: Location): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("User must be authenticated to update locations");
  }

  try {
    const { error } = await supabase
      .from("locations")
      .update({
        title: location.title,
        latitude: location.latitude,
        longitude: location.longitude,
        description: location.description,
        tags: location.tags,
        group_id: location.groupId === "default" ? null : location.groupId,
      })
      .eq("id", location.id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error updating in the database:", error);
      throw error;
    }
  } catch (error) {
    console.error("Failed to update in the database:", error);
    throw error;
  }
};

// Delete a location
export const deleteLocation = async (id: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("User must be authenticated to delete locations");
  }

  try {
    const { error } = await supabase
      .from("locations")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting from the database:", error);
      throw error;
    }
  } catch (error) {
    console.error("Failed to delete from the database:", error);
    throw error;
  }
};

// Delete all locations
export const deleteAllLocations = async (): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("User must be authenticated to delete all his saved locations");
  }

  try {
    const { error } = await supabase
      .from("locations")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting all from the database:", error);
      throw error;
    }
  } catch (error) {
    console.error("Failed to delete all from the database:", error);
    throw error;
  }
};

// Get all groups
export const getGroups = async (): Promise<Group[]> => {
  try {
    // Get the current user first
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id;

    const { data: groups, error } = await supabase
      .from("groups")
      .select("*");

    if (error) {
      console.error("Error fetching groups:", error);
      throw error;
    }

    return [
      // Default group is always considered owned by the current user
      { ...DEFAULT_GROUPS[0], isOwner: true },
      ...(groups || []).map(group => ({
        id: group.id,
        name: group.name,
        color: group.color,
        isOwner: currentUserId === group.user_id
      }))
    ];
  } catch (error) {
    console.error("Failed to fetch groups:", error);
    throw error;
  }
};

// Save a new group
export const saveGroup = async (group: Group): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("User must be authenticated to save groups");
  }

  try {
    const { error } = await supabase.from("groups").insert({
      id: group.id,
      name: group.name,
      color: group.color,
      user_id: user.id,
    });

    if (error) {
      console.error("Error saving group to the database:", error);
      throw error;
    }
  } catch (error) {
    console.error("Failed to save group to the database:", error);
    throw error;
  }
};

// Delete a group
export const deleteGroup = async (id: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("User must be authenticated to delete groups");
  }

  try {
    const { error } = await supabase
      .from("groups")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting group from the database:", error);
      throw error;
    }
  } catch (error) {
    console.error("Failed to delete group from the database:", error);
    throw error;
  }
};

interface ImportedLocation {
  id: number;
  title: string;
}

// Get imported locations
export const getImportedLocations = async (): Promise<ImportedLocation[]> => {
  try {
    const { data: importedLocations, error } = await supabase
      .from("imported_locations")
      .select("id, title")
      .order('title');

    if (error) {
      console.error("Error fetching imported locations:", error);
      throw error;
    }

    return importedLocations;
  } catch (error) {
    console.error("Failed to fetch imported locations:", error);
    throw error;
  }
};

// Export to Excel with improved filename
export const exportToExcel = async (
  locations: Location[],
  groups: Group[],
  dateRange?: { startDate: Date | null; endDate: Date | null },
  selectedGroupIds?: string[]
): Promise<void> => {
  const workbook = new Excel.Workbook();
  
  // Generate filename based on filters
  let filename = 'locations';
  
  // Add date range to filename if provided
  if (dateRange && dateRange.startDate && dateRange.endDate) {
    const startDateStr = dateRange.startDate.toISOString().slice(0, 10);
    const endDateStr = dateRange.endDate.toISOString().slice(0, 10);
    filename += `_${startDateStr}_to_${endDateStr}`;
  } else if (selectedGroupIds && selectedGroupIds.length > 0 && selectedGroupIds.length < groups.length) {
    // Add group names to filename if specific groups are selected
    if (selectedGroupIds.length <= 3) {
      // If 3 or fewer groups, include all names
      const groupNames = selectedGroupIds.map(id => {
        const group = groups.find(g => g.id === id);
        return group ? group.name.replace(/\s+/g, '-') : 'unknown';
      });
      filename += `_${groupNames.join(',')}`;
    } else {
      // If more than 3 groups, include count
      filename += `_${selectedGroupIds.length}-groups`;
    }
  } else {
    // If all groups or no specific filter, append "All" with today's date
    filename += `_All_${new Date().toISOString().slice(0, 10)}`;
  }
  
  // Add random number to prevent overwriting
  filename += `_${Math.floor(Math.random() * 90000) + 10000}.xlsx`;

  // Determine which groups to include in the export
  const groupsToInclude = selectedGroupIds && selectedGroupIds.length > 0
    ? groups.filter(group => selectedGroupIds.includes(group.id))
    : groups;

  // Create a sheet for each included group
  for (const group of groupsToInclude) {
    const sheet = workbook.addWorksheet(group.name);

    // Set up headers
    sheet.columns = [
      { header: "Id", key: "id", width: 40 },
      { header: "Title", key: "title", width: 50 },
      { header: "Coordinates", key: "coordinates", width: 40 },
      { header: "Mall", key: "mall", width: 50 },
      { header: "Description", key: "description", width: 40 },
      { header: "Tags", key: "tags", width: 40 },
      { header: "Created At", key: "createdAt", width: 20 }
    ];

    // Style the header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };

    // Add locations for this group
    const groupLocations = locations.filter((loc) => loc.groupId === group.id);
    groupLocations.forEach((location: Location) => {
      const groupName = groups.find(g => g.id === location.groupId)?.name || 'Default';
      sheet.addRow({
        id: location.id,
        title: location.title,
        coordinates: `[${location.latitude.toFixed(7)}, ${location.longitude.toFixed(7)}]`,
        mall: groupName,
        description: location.description,
        tags: location.tags.join(", "),
        createdAt: new Date(location.createdAt).toLocaleString()
      });
    });

    // Auto-filter
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 7 },
    };
  }

  // Generate and download the file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Add this function to get location update statistics
export const getLocationUpdateStats = async (): Promise<{ updated: number, notUpdated: number, total: number }> => {
  try {
    // Fetch all shops with the location_updated field
    const response = await fetch(`${DIRECTUS_CONFIG.baseUrl}/items/Shops?fields=id,location_updated`, {
      headers: {
        'Authorization': `Bearer ${DIRECTUS_CONFIG.token}`
      }
    });

    if (!response.ok) {
      console.error('Error fetching shops from Directus:', response.status);
      return { updated: 0, notUpdated: 0, total: 0 };
    }

    const data = await response.json();
    const shops = data.data || [];
    
    // Count shops based on location_updated value
    const updated = shops.filter(shop => shop.location_updated === true).length;
    const notUpdated = shops.filter(shop => shop.location_updated === false || shop.location_updated === null).length;
    const total = shops.length;
    
    return { updated, notUpdated, total };
  } catch (error) {
    console.error('Error fetching location update stats from Directus:', error);
    return { updated: 0, notUpdated: 0, total: 0 };
  }
};

