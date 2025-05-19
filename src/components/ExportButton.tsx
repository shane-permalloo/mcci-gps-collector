import React, { useState } from 'react';
import { getLocations, getGroups, exportToExcel } from '../services/locationService';
import { FileDown } from 'lucide-react';

const ExportButton: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      const locations = getLocations();
      const groups = getGroups();
      
      if (locations.length === 0) {
        alert('No locations to export. Save some locations first!');
        return;
      }
      
      await exportToExcel(locations, groups);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="flex items-center px-2 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full sm:rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
    >
      <FileDown size={18} className="mr-0 sm:mr-2 shrink-0" />
      <span className="hidden sm:inline">Export</span>
    </button>
  );
};

export default ExportButton;