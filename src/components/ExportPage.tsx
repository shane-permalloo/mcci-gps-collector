import React, { useState, useEffect } from 'react';
import { getLocations, getGroups, exportToExcel } from '../services/locationService';
import { exportToCSVFile, exportDirectusLocationsToCSV } from '../utils/exportUtils';
import Datepicker from 'react-tailwindcss-datepicker';
import { 
  FileDown, 
  Calendar, 
  FileSpreadsheet, 
  FileText, 
  Download,
  Database,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { showAlert } from '../utils/alertUtils.tsx';

// Define the DateValueType for the datepicker
interface DateValueType {
  startDate: Date | null;
  endDate: Date | null;
}

// Add CSS for toggle switch
const toggleStyles = `
  .toggle-checkbox:checked {
    right: 0;
    transform: translateX(0) scale(1.1);
  }
  .toggle-checkbox {
    right: 100%;
    transform: translateX(100%);
    transition: all 0.3s ease;
    background: #e5e7eb;
    border-color: #e5e7eb;
  }
  .toggle-checkbox:checked + .toggle-label {
    background-color: #3b82f6;
  }
  .toggle-label {
    transition: background-color 0.3s ease;
  }
  
  .group-toggle-checkbox:checked {
    right: 0;
    transform: translateX(0) scale(1.1);
  }
  .group-toggle-checkbox {
    right: 100%;
    transform: translateX(100%);
    transition: all 0.3s ease;
    background: #e5e7eb;
    border-color: #e5e7eb;
  }
  .group-toggle-checkbox:checked + .group-toggle-label {
    background-color: #3b82f6;
  }
  .group-toggle-label {
    transition: background-color 0.3s ease;
  }
`;

const ExportPage: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'excel' | 'csv'>('csv');
  const [locationCount, setLocationCount] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);
  const [lastExport, setLastExport] = useState<string>('');
  const [dateError, setDateError] = useState<string>('');
  const [groups, setGroups] = useState<{
    color: string; id: string; name: string
}[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [groupFilterEnabled, setGroupFilterEnabled] = useState(false);
  
  // Use a combined date value for the datepicker
  const [dateValue, setDateValue] = useState<DateValueType>({
    startDate: null,
    endDate: null
  });

  // Format date as dd/mm/yyyy for display
  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  useEffect(() => {
    loadLocationCount();
    loadGroups();
  }, []);

  useEffect(() => {
    updateFilteredCount();
    
    // Validate date range
    const { startDate, endDate } = dateValue;
    if (startDate && endDate) {
      if (startDate > endDate) {
        setDateError('Start date cannot be after end date');
      } else {
        setDateError('');
      }
    } else {
      setDateError('');
    }
  }, [dateValue, locationCount, selectedGroupIds, groupFilterEnabled]);

  const loadGroups = async () => {
    try {
      const fetchedGroups = await getGroups();
      setGroups(fetchedGroups);
    } catch (error) {
      console.error('Failed to load groups:', error);
    }
  };

  const loadLocationCount = async () => {
    try {
      const locations = await getLocations();
      setLocationCount(locations.length);
    } catch (error) {
      console.error('Failed to load location count:', error);
    }
  };

  const updateFilteredCount = async () => {
    try {
      const locations = await getLocations();
      let filtered = [...locations];
      
      // Apply date filter if both dates are set
      const { startDate, endDate } = dateValue;
      if (startDate && endDate) {
        const startTimestamp = startDate.getTime();
        const endTimestamp = new Date(endDate.setHours(23, 59, 59, 999)).getTime();
        filtered = filtered.filter(loc => 
          loc.createdAt >= startTimestamp && loc.createdAt <= endTimestamp
        );
      }
      
      // Apply group filter if enabled and groups are selected
      if (groupFilterEnabled && selectedGroupIds.length > 0) {
        filtered = filtered.filter(loc => 
          selectedGroupIds.includes(loc.groupId || 'default')
        );
      }
      
      setFilteredCount(filtered.length);
    } catch (error) {
      console.error('Failed to filter locations:', error);
      setFilteredCount(0);
    }
  };

  const handleExport = async (useFilter: boolean = false) => {
    try {
      setIsExporting(true);
      
      const locations = await getLocations();
      const groups = await getGroups() || [];
      
      if (locations.length === 0) {
        showAlert('Export Error', 'No locations to export. Save some locations first!');
        return;
      }

      let filteredLocations = [...locations];
      
      // Apply date filter if using filters and both dates are set
      const { startDate, endDate } = dateValue;
      if (useFilter && startDate && endDate) {
        const startTimestamp = startDate.getTime();
        const endTimestamp = new Date(endDate.setHours(23, 59, 59, 999)).getTime();
        filteredLocations = filteredLocations.filter(loc => 
          loc.createdAt >= startTimestamp && loc.createdAt <= endTimestamp
        );
      }
      
      // Apply group filter if enabled and groups are selected
      if (useFilter && groupFilterEnabled && selectedGroupIds.length > 0) {
        filteredLocations = filteredLocations.filter(loc => 
          selectedGroupIds.includes(loc.groupId || 'default')
        );
      }

      if (filteredLocations.length === 0) {
        showAlert('Export Error', 'No locations found with the selected filters.');
        return;
      }
      
      if (exportFormat === 'excel') {
        // Pass date range and selected groups for filename generation
        await exportToExcel(
          filteredLocations, 
          groups,
          useFilter ? dateValue : undefined,
          useFilter && groupFilterEnabled ? selectedGroupIds : undefined
        );
      } else {
        exportToCSVFile(filteredLocations, groups);
      }
      
      setLastExport(new Date().toLocaleString());
    } catch (error) {
      console.error('Export failed:', error);
      showAlert('Export Error', 'Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDateChange = (newValue: DateValueType | null) => {
    if (newValue) {
      setDateValue(newValue);
    } else {
      setDateValue({ startDate: null, endDate: null });
    }
  };
  
  const toggleGroupSelection = (groupId: string) => {
    setSelectedGroupIds(prev => {
      if (prev.includes(groupId)) {
        return prev.filter(id => id !== groupId);
      } else {
        return [...prev, groupId];
      }
    });
  };
  
  const toggleAllGroups = () => {
    if (selectedGroupIds.length === groups.length) {
      setSelectedGroupIds([]);
    } else {
      setSelectedGroupIds(groups.map(group => group.id));
    }
  };
  
  return (
    <div className="max-w-8xl mx-auto">
      {/* Add style tag for toggle switch */}
      <style>{toggleStyles}</style>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="flex md:items-center justify-between md:flex-row flex-col items-start">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center mb-4">
            <FileDown className="mr-3" size={24} />
            Export Locations
          </h2>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-4">
            <Database size={16} className="mr-1" />
            <span>{locationCount} locations</span>
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex items-center">
          Export your saved locations to Excel or CSV format.
          <br />CSV exports are formatted for MCCI Back-Office import compatibility.
          <br />You may also optionally filter the export by date range or groups.
        </p>
        <p className="text-sm px-2 py-3 border border-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-700 dark:text-blue-300 mb-4">
          <strong>Note:</strong> CSV exports use "XXX" as placeholder IDs - replace with actual shop IDs before importing.
        </p>

        {/* Export Format Selection */}
        <div className="mb-6">
          <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
            Export Format
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setExportFormat('excel')}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                exportFormat === 'excel' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'
              }`}
            >
              <div className="flex items-center justify-center mb-2">
                <FileSpreadsheet size={32} className={`${
                  exportFormat === 'excel' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'
                }`} />
              </div>
              <h3 className={`font-medium ${
                exportFormat === 'excel' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
              }`}>
                Excel (.xlsx)
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Formatted spreadsheet with locations data, useful for processing and analysis
              </p>
            </button>

            <button
              onClick={() => setExportFormat('csv')}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                exportFormat === 'csv' 
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-500'
              }`}
            >
              <div className="flex items-center justify-center mb-2">
                <FileText size={32} className={`${
                  exportFormat === 'csv' ? 'text-green-600 dark:text-green-400' : 'text-gray-500'
                }`} />
              </div>
              <h3 className={`font-medium ${
                exportFormat === 'csv' ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'
              }`}>
                CSV (.csv)
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Back-office-compatible format for import
              </p>
            </button>
          </div>
        </div>

        {/* Group Filter */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-lg font-medium text-gray-700 dark:text-gray-300">
              Filter by Groups
            </label>
            <div className="flex items-center">
              {/* Main toggle switch */}
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input
                  type="checkbox"
                  name="toggle"
                  id="enableGroupFilter"
                  checked={groupFilterEnabled}
                  onChange={() => setGroupFilterEnabled(!groupFilterEnabled)}
                  className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                />
                <label
                  htmlFor="enableGroupFilter"
                  className="toggle-label block overflow-hidden h-6 rounded-full cursor-pointer bg-gray-300 dark:bg-gray-600"
                ></label>
              </div>
              <label htmlFor="enableGroupFilter" className="text-sm text-gray-600 dark:text-gray-400">
                Group filtering
              </label>
            </div>
          </div>
          
          {groupFilterEnabled && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-md font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  Select groups to export
                </span>
              <div>  
                <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedGroupIds.length} group(s) selected
              </span>
                <button
                  onClick={toggleAllGroups}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline p-0 m-0 pl-4"
                >
                  {selectedGroupIds.length === groups.length ? 'Deselect All' : 'Select All'} 
                </button>
              
              </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {groups.map(group => (
                  <div 
                    key={group.id}
                    onClick={() => toggleGroupSelection(group.id)}
                    className={`
                      p-2 rounded-md cursor-pointer flex items-center justify-between
                      ${selectedGroupIds.includes(group.id) 
                        ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700' 
                        : 'bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'}
                    `}
                  >
                    <span 
                      className="text-sm font-medium truncate mr-2 text-gray-700 dark:text-gray-300"
                      style={{ 
                        color: selectedGroupIds.includes(group.id) ? group.color : '',
                      }}
                    >
                      {group.name}
                    </span>
                    <div className="relative inline-block w-7 align-middle select-none transition duration-200 ease-in flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={selectedGroupIds.includes(group.id)}
                        onChange={() => {}} // Handled by the div onClick
                        className="group-toggle-checkbox absolute block w-4 h-4 rounded-full bg-white border-4 appearance-none cursor-pointer"
                      />
                      <label
                        className={`group-toggle-label block overflow-hidden h-4 rounded-full cursor-pointer ${
                          selectedGroupIds.includes(group.id) ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      ></label>
                    </div>
                  </div>
                ))}
              </div>
              
            </div>
          )}
        </div>

        {/* Date Filter */}
        <div className="mb-6">
          <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
            Date Range
          </label>
          <Datepicker
            value={dateValue}
            onChange={handleDateChange}
            showShortcuts={true}
            primaryColor="blue" 
            displayFormat="DD/MM/YYYY"
            separator="to"
            maxDate={new Date()}
            inputClassName="w-full p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 text-gray-600 dark:text-white"
          />
        </div>

        {dateError && (
          <div className="mt-2 px-3 py-2 text-sm bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
            <p className="text-red-800 dark:text-red-200">
              {dateError}
            </p>
          </div>
        )}

        {((dateValue.startDate || dateValue.endDate || (groupFilterEnabled && selectedGroupIds.length > 0)) && !dateError) && (
          <div className="mt-6 px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
            <p className="text-blue-800 dark:text-blue-200">
              Will export {filteredCount} locations
              {dateValue.startDate && dateValue.endDate 
                ? ` from ${formatDate(dateValue.startDate)} to ${formatDate(dateValue.endDate)}`
                : ''
              }
              {groupFilterEnabled && selectedGroupIds.length > 0
                ? ` from ${selectedGroupIds.length} selected group(s)`
                : ''
              }
            </p>
          </div>
        )}

        {/* Export Actions */}
        <div className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => handleExport(false)}
              disabled={isExporting || locationCount === 0}
              className="flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 transform"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <Download size={18} className="mr-2" />
                  Export All ({locationCount})
                </>
              )}
            </button>

            <button
              onClick={() => handleExport(true)}
              disabled={
                isExporting || 
                ((!dateValue.startDate || !dateValue.endDate) && (!groupFilterEnabled || selectedGroupIds.length === 0)) || 
                filteredCount === 0 || 
                !!dateError
              }
              className="flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 transform"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <Calendar size={18} className="mr-2" />
                  Export Filtered ({filteredCount})
                </>
              )}
            </button>
          </div>

          {lastExport && (
            <div className="flex items-center justify-center p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle size={16} className="mr-2 text-green-600 dark:text-green-400" />
              <span className="text-sm text-green-800 dark:text-green-200">
                Last export: {lastExport}
              </span>
            </div>
          )}

          {locationCount === 0 && (
            <div className="flex items-center justify-center p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <AlertCircle size={16} className="mr-2 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm text-yellow-800 dark:text-yellow-200">
                No locations available to export. Add some locations first!
              </span>
            </div>
          )}
        </div>

        {/* Add a discreet button for exporting only locations with directus_id */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center flex-col md:flex-row">
            
          <p className="text-xs text-gray-500 dark:text-gray-400 my-2">
            This option exports only locations that can be synchronized with the back-office system.
          </p>
          <button
              onClick={async () => {
                try {
                  setIsExporting(true);
                  const locations = await getLocations();
                  const groups = await getGroups() || [];
                  exportDirectusLocationsToCSV(locations, groups);
                  setLastExport(new Date().toLocaleString());
                } catch (error) {
                  console.error("Error exporting locations:", error);
                } finally {
                  setIsExporting(false);
                }
              }}
              disabled={isExporting}
              className="text-sm flex items-center justify-center px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 rounded transition-all duration-200"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-700 dark:border-gray-300 mr-1"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <Database size={16} className="mr-1" />
                  Export Only Locations with Shop IDs
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportPage;
