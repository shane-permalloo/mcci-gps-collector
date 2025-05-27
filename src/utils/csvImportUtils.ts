export interface CSVRow {
  id: string;
  shop_name: string;
  shop_location?: string; // Optional field
  shop_malls: string;
  'shop_location.type': string;
  'shop_location.coordinates': string;
}

export interface DirectusShopRecord {
  id: string;
  shop_name: string;
  shop_location?: string; // Optional field
  shop_malls: string;
  'shop_location.type': string;
  'shop_location.coordinates': string;
  latitude?: number;
  longitude?: number;
  mall_name?: string;
  validation_status: 'valid' | 'invalid' | 'warning';
  validation_errors: string[];
}

export interface BatchUpdateResult {
  id: string;
  status: 'success' | 'error' | 'pending' | 'processing';
  message: string;
  record: DirectusShopRecord;
}

export interface DirectusConfig {
  baseUrl: string;
  token: string; // Hard-coded secret key token
}

// Hard-coded Directus configuration - using proxy to avoid CORS issues
export const DIRECTUS_CONFIG: DirectusConfig = {
  baseUrl: '/api/directus', // Proxy URL to avoid CORS issues
  token: 'UThix7ozIrwxPwNtPMKZ9EuGy5IqHQLM' // Replace with your actual secret token
};

/**
 * Parses CSV content and converts it to an array of objects
 */
export const parseCSV = (csvContent: string): CSVRow[] => {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file must contain at least a header row and one data row');
  }

  const headers = lines[0].split(',').map(header => header.replace(/"/g, '').trim());
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length !== headers.length) {
      console.warn(`Row ${i + 1} has ${values.length} columns but expected ${headers.length}. Skipping.`);
      continue;
    }

    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    rows.push(row as CSVRow);
  }

  return rows;
};

/**
 * Parses a single CSV line, handling quoted values and commas within quotes
 */
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Handle escaped quotes
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add the last field
  result.push(current.trim());

  return result;
};

/**
 * Converts CSV rows to Directus shop records with validation
 * Focus only on coordinates - shop_malls are not updated
 */
export const convertCSVToDirectusRecords = (csvRows: CSVRow[]): DirectusShopRecord[] => {
  return csvRows.map((row, index) => {
    const errors: string[] = [];
    let latitude = 0;
    let longitude = 0;

    // Parse coordinates - this is the main field we're updating
    if (row['shop_location.coordinates']) {
      try {
        const coords = JSON.parse(row['shop_location.coordinates']);
        if (Array.isArray(coords) && coords.length === 2) {
          longitude = parseFloat(coords[0]);
          latitude = parseFloat(coords[1]);

          if (isNaN(longitude) || isNaN(latitude)) {
            errors.push('Invalid coordinate values');
          } else if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
            errors.push('Coordinates out of valid range');
          }
        } else {
          errors.push('Coordinates must be an array of [longitude, latitude]');
        }
      } catch (error) {
        errors.push('Invalid coordinates format');
      }
    } else {
      errors.push('Missing coordinates');
    }

    // Validate required fields
    if (!row.shop_name || row.shop_name.trim() === '') {
      errors.push('Shop name is required');
    }

    if (!row.id || row.id.trim() === '') {
      errors.push('ID is required');
    }

    // Determine validation status
    let validationStatus: 'valid' | 'invalid' | 'warning' = 'valid';
    if (errors.length > 0) {
      validationStatus = errors.some(err =>
        err.includes('required') || err.includes('Missing') || err.includes('Invalid coordinate')
      ) ? 'invalid' : 'warning';
    }

    return {
      id: row.id || `imported-${Date.now()}-${index}`,
      shop_name: row.shop_name || '',
      shop_location: row.shop_location || undefined, // Optional field
      shop_malls: row.shop_malls || '[]', // Keep for display but won't be updated
      'shop_location.type': row['shop_location.type'] || 'Point',
      'shop_location.coordinates': row['shop_location.coordinates'] || '',
      latitude,
      longitude,
      mall_name: '', // Not used for updates
      validation_status: validationStatus,
      validation_errors: errors
    };
  });
};

/**
 * Updates a single shop record in Directus
 */
export const updateDirectusShopRecord = async (record: DirectusShopRecord): Promise<BatchUpdateResult> => {
  try {
    // Prepare the update data according to Directus schema
    const updateData: any = {
      // Set location_updated to true for all updated records
      location_updated: true
    };

    // Update shop name if provided
    if (record.shop_name && record.shop_name.trim() !== '') {
      updateData.shop_name = record.shop_name.trim();
    }

    // Update shop location (geometry.Point) if coordinates are provided
    if (record.latitude !== 0 && record.longitude !== 0) {
      updateData.shop_location = {
        type: 'Point',
        coordinates: [record.longitude, record.latitude]
      };
    }

    // Update shop address/description if provided (optional field)
    if (record.shop_location && record.shop_location.trim() !== '') {
      updateData.shop_address = record.shop_location.trim();
    }

    // Note: shop_malls are not updated as per requirements

    // Use correct collection name 'Shops' (capital S)
    const response = await fetch(`${DIRECTUS_CONFIG.baseUrl}/items/Shops/${record.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DIRECTUS_CONFIG.token}`
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    // Check if the response contains data
    const responseData = await response.json();

    // If the response is successful but data is empty/null, the shop ID doesn't exist
    if (!responseData || !responseData.data) {
      return {
        id: record.id,
        status: 'error',
        message: `Shop ID "${record.id}" not found in Directus. Please verify the shop ID exists.`,
        record
      };
    }

    return {
      id: record.id,
      status: 'success',
      message: 'Record updated successfully',
      record
    };
  } catch (error) {
    return {
      id: record.id,
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      record
    };
  }
};

/**
 * Batch update multiple shop records in Directus with progress tracking
 */
export const batchUpdateDirectusRecords = async (
  records: DirectusShopRecord[],
  onProgress?: (progress: number, current: BatchUpdateResult) => void
): Promise<BatchUpdateResult[]> => {
  const results: BatchUpdateResult[] = [];
  const validRecords = records.filter(record => record.validation_status !== 'invalid');

  for (let i = 0; i < validRecords.length; i++) {
    const record = validRecords[i];

    // Add delay between requests to avoid overwhelming the API
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const result = await updateDirectusShopRecord(record);
    results.push(result);

    // Report progress
    if (onProgress) {
      const progress = ((i + 1) / validRecords.length) * 100;
      onProgress(progress, result);
    }
  }

  return results;
};

/**
 * Test Directus connection and permissions
 */
export const testDirectusConnection = async (): Promise<boolean> => {
  try {
    // Test 1: Server connection
    const serverResponse = await fetch(`${DIRECTUS_CONFIG.baseUrl}/server/info`, {
      headers: {
        'Authorization': `Bearer ${DIRECTUS_CONFIG.token}`
      }
    });

    if (!serverResponse.ok) {
      console.error('Server connection failed:', serverResponse.status);
      return false;
    }

    // Test 2: Authentication
    const authResponse = await fetch(`${DIRECTUS_CONFIG.baseUrl}/users/me`, {
      headers: {
        'Authorization': `Bearer ${DIRECTUS_CONFIG.token}`
      }
    });

    if (!authResponse.ok) {
      console.error('Authentication failed:', authResponse.status);
      return false;
    }

    // Test 3: Shops collection access (using correct collection name)
    const shopsResponse = await fetch(`${DIRECTUS_CONFIG.baseUrl}/items/Shops?limit=1`, {
      headers: {
        'Authorization': `Bearer ${DIRECTUS_CONFIG.token}`
      }
    });

    if (!shopsResponse.ok) {
      console.error('Shops collection access failed:', shopsResponse.status);
      if (shopsResponse.status === 403) {
        console.error('Permission denied: User does not have access to Shops collection');
      }
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to connect to Directus:', error);
    return false;
  }
};

/**
 * Get detailed connection status for debugging
 */
export const getDetailedConnectionStatus = async (): Promise<{
  connected: boolean;
  serverInfo: any;
  userInfo: any;
  shopsAccess: boolean;
  error?: string;
}> => {
  try {
    // Test server connection
    const serverResponse = await fetch(`${DIRECTUS_CONFIG.baseUrl}/server/info`, {
      headers: {
        'Authorization': `Bearer ${DIRECTUS_CONFIG.token}`
      }
    });

    if (!serverResponse.ok) {
      return {
        connected: false,
        serverInfo: null,
        userInfo: null,
        shopsAccess: false,
        error: `Server connection failed: ${serverResponse.status}`
      };
    }

    const serverInfo = await serverResponse.json();

    // Test authentication
    const authResponse = await fetch(`${DIRECTUS_CONFIG.baseUrl}/users/me`, {
      headers: {
        'Authorization': `Bearer ${DIRECTUS_CONFIG.token}`
      }
    });

    if (!authResponse.ok) {
      return {
        connected: false,
        serverInfo,
        userInfo: null,
        shopsAccess: false,
        error: `Authentication failed: ${authResponse.status}`
      };
    }

    const userInfo = await authResponse.json();

    // Test Shops collection access
    const shopsResponse = await fetch(`${DIRECTUS_CONFIG.baseUrl}/items/Shops?limit=1`, {
      headers: {
        'Authorization': `Bearer ${DIRECTUS_CONFIG.token}`
      }
    });

    const shopsAccess = shopsResponse.ok;

    return {
      connected: true,
      serverInfo,
      userInfo,
      shopsAccess,
      error: shopsAccess ? undefined : `Shops access denied: ${shopsResponse.status}`
    };

  } catch (error) {
    return {
      connected: false,
      serverInfo: null,
      userInfo: null,
      shopsAccess: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

