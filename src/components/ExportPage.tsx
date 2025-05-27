import React, { useState, useEffect } from 'react';
import { getLocations, getGroups, exportToExcel } from '../services/locationService';
import { exportToCSVFile } from '../utils/exportUtils';
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

// Define the DateValueType for the datepicker
interface DateValueType {
  startDate: Date | null;
  endDate: Date | null;
}

const ExportPage: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'excel' | 'csv'>('csv');
  const [locationCount, setLocationCount] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);
  const [lastExport, setLastExport] = useState<string>('');
  const [dateError, setDateError] = useState<string>('');
  
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
  }, [dateValue, locationCount]);

  const loadLocationCount = async () => {
    try {
      const locations = await getLocations();
      setLocationCount(locations.length);
    } catch (error) {
      console.error('Failed to load location count:', error);
    }
  };

  const updateFilteredCount = async () => {
    const { startDate, endDate } = dateValue;
    if (!startDate || !endDate) {
      setFilteredCount(locationCount);
      return;
    }

    try {
      const locations = await getLocations();
      const startTimestamp = startDate.getTime();
      const endTimestamp = new Date(endDate.setHours(23, 59, 59, 999)).getTime();
      const filtered = locations.filter(loc => 
        loc.createdAt >= startTimestamp && loc.createdAt <= endTimestamp
      );
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
        alert('No locations to export. Save some locations first!');
        return;
      }

      let filteredLocations = locations;
      const { startDate, endDate } = dateValue;
      if (useFilter && startDate && endDate) {
        const startTimestamp = startDate.getTime();
        const endTimestamp = new Date(endDate.setHours(23, 59, 59, 999)).getTime();
        filteredLocations = locations.filter(loc => 
          loc.createdAt >= startTimestamp && loc.createdAt <= endTimestamp
        );
      }

      if (filteredLocations.length === 0) {
        alert('No locations found in the selected date range.');
        return;
      }
      
      if (exportFormat === 'excel') {
        await exportToExcel(filteredLocations, groups);
      } else {
        exportToCSVFile(filteredLocations, groups);
      }
      
      setLastExport(new Date().toLocaleString());
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
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
  
  return (
    <div className="max-w-8xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <FileDown className="mr-3" size={24} />
            Export Locations
          </h2>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Database size={16} className="mr-1" />
            <span>{locationCount} total locations</span>
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex items-center">
          Export your saved locations to Excel or CSV format.
          <br />CSV exports are formatted for MCCI Back-Office import compatibility.
          <br />You may also optionally filter the export by date range.
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
            inputClassName="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 text-gray-600 dark:text-white"
          />
        </div>

        {dateError && (
          <div className="mt-2 px-3 py-2 text-sm bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
            <p className="text-red-800 dark:text-red-200">
              {dateError}
            </p>
          </div>
        )}

        {((dateValue.startDate || dateValue.endDate) && !dateError) && (
          <div className="mt-6 px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
            <p className="text-blue-800 dark:text-blue-200">
              {dateValue.startDate && dateValue.endDate 
                ? `Will export ${filteredCount} locations from ${formatDate(dateValue.startDate)} to ${formatDate(dateValue.endDate)}`
                : 'Please select both start and end dates for filtering'
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
              disabled={isExporting || !dateValue.startDate || !dateValue.endDate || filteredCount === 0 || !!dateError}
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
                  Export Range ({filteredCount})
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
      </div>
    </div>
  );
};

export default ExportPage;







