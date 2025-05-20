import { Location, Group } from "../types";
import { v4 as uuidv4 } from "uuid";
import * as Excel from "exceljs";
import { supabase } from "../lib/supabase";

const DEFAULT_GROUPS: Group[] = [
  { id: "default", name: "Default", color: "#252525" },
];

// Get all locations
export const getLocations = async (): Promise<Location[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("User must be authenticated to get locations");
  }

  try {
    const { data: locations, error } = await supabase
      .from("locations")
      .select("*")
      .eq("user_id", user.id);

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
      createdAt: new Date(location.created_at).getTime()
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
    const { error } = await supabase.from("locations").insert({
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

    if (error) {
      console.error("Error saving to Supabase:", error);
      throw error;
    }
  } catch (error) {
    console.error("Failed to save to Supabase:", error);
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
      console.error("Error updating in Supabase:", error);
      throw error;
    }
  } catch (error) {
    console.error("Failed to update in Supabase:", error);
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
      console.error("Error deleting from Supabase:", error);
      throw error;
    }
  } catch (error) {
    console.error("Failed to delete from Supabase:", error);
    throw error;
  }
};

// Delete all locations
export const deleteAllLocations = async (): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("User must be authenticated to delete all locations");
  }

  try {
    const { error } = await supabase
      .from("locations")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting all from Supabase:", error);
      throw error;
    }
  } catch (error) {
    console.error("Failed to delete all from Supabase:", error);
    throw error;
  }
};

// Get all groups
export const getGroups = async (): Promise<Group[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("User must be authenticated to get groups");
  }

  try {
    const { data: groups, error } = await supabase
      .from("groups")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching groups:", error);
      throw error;
    }

    // Always include the default group and combine with fetched groups
    return [
      DEFAULT_GROUPS[0],
      ...(groups || []).map(group => ({
        id: group.id,
        name: group.name,
        color: group.color
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
      console.error("Error saving group to Supabase:", error);
      throw error;
    }
  } catch (error) {
    console.error("Failed to save group to Supabase:", error);
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
      console.error("Error deleting group from Supabase:", error);
      throw error;
    }
  } catch (error) {
    console.error("Failed to delete group from Supabase:", error);
    throw error;
  }
};

// Export to Excel with separate sheets for each group
export const exportToExcel = async (
  locations: Location[],
  groups: Group[],
): Promise<void> => {
  const workbook = new Excel.Workbook();

  // Create a sheet for each group
  for (const group of groups) {
    const sheet = workbook.addWorksheet(group.name);

    // Set up headers
    sheet.columns = [
      { header: "Title", key: "title", width: 30 },
      { header: "Latitude", key: "latitude", width: 15 },
      { header: "Longitude", key: "longitude", width: 15 },
      { header: "Description", key: "description", width: 40 },
      { header: "Tags", key: "tags", width: 30 },
      { header: "Created At", key: "createdAt", width: 20 },
    ];

    // Style the header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: group.color.replace("#", "") + "CC" },
    };

    // Add locations for this group
    const groupLocations = locations.filter((loc) => loc.groupId === group.id);
    groupLocations.forEach((location) => {
      sheet.addRow({
        title: location.title,
        latitude: location.latitude,
        longitude: location.longitude,
        description: location.description,
        tags: location.tags.join(", "),
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
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `locations_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};