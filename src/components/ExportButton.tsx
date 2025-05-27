import React, { useState, useRef, useEffect } from 'react';
import { getLocations, getGroups, exportToExcel } from '../services/locationService';
import { exportToCSVFile } from '../utils/exportUtils';
import { FileDown } from 'lucide-react';

const ExportButton: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exportFormat, setExportFormat] = useState<'excel' | 'csv'>('excel');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (start?: string, end?: string) => {
    try {
      setIsExporting(true);
      
      const locations = await getLocations();
      const groups = await getGroups() || [];
      
      if (locations.length === 0) {
        alert('No locations to export. Save some locations first!');
        return;
      }

      let filteredLocations = locations;
      if (start && end) {
        const startTimestamp = new Date(start).getTime();
        const endTimestamp = new Date(end).setHours(23, 59, 59, 999);
        filteredLocations = locations.filter(loc => 
          loc.createdAt >= startTimestamp && loc.createdAt <= endTimestamp
        );
      }
      
      if (exportFormat === 'excel') {
        await exportToExcel(filteredLocations, groups);
      } else {
        exportToCSVFile(filteredLocations, groups);
      }
      
      setShowDatePicker(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDatePicker(!showDatePicker)}
        disabled={isExporting}
        className="flex items-center px-2 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full sm:rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
      >
        <FileDown size={18} className="mr-0 sm:mr-2 shrink-0" />
        <span className="hidden sm:inline">Export</span>
      </button>

      {showDatePicker && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 z-50">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 text-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 text-gray-600 dark:text-white"
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Export Format
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setExportFormat('excel')}
                  className={`flex-1 px-3 py-1.5 rounded-md transition-colors ${
                    exportFormat === 'excel' 
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                  }`}
                >
                  Excel
                </button>
                <button
                  onClick={() => setExportFormat('csv')}
                  className={`flex-1 px-3 py-1.5 rounded-md transition-colors ${
                    exportFormat === 'csv' 
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                  }`}
                >
                  CSV
                </button>
              </div>
            </div>
            <div className="flex justify-between gap-2">
              <button
                onClick={() => handleExport()}
                disabled={isExporting}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50"
              >
                Export All
              </button>
              <button
                onClick={() => handleExport(startDate, endDate)}
                disabled={isExporting || !startDate || !endDate}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50"
              >
                Export Range
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportButton;
