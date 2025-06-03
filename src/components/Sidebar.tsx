import React from 'react';
import { Share2, Trash2, X, LogOut, BarChart, Upload, Keyboard } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleteAll: () => void;
  onSignOut: () => void;
  onOpenAnalytics: () => void;
  onOpenImport: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  onDeleteAll, 
  onSignOut, 
  onOpenAnalytics, 
  onOpenImport 
}) => {
  const handleDeleteAll = () => {
    if (window.confirm('Are you sure you want to delete all locations? This cannot be undone.')) {
      onDeleteAll();
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'MCCI GPS',
        text: 'Check out this GPS location tracking app!',
        url: window.location.href,
      })
      .catch((error) => console.log('Error sharing', error));
    } else {
      alert('Web Share API not supported in your browser');
    }
  };

  return (
    <div className={`fixed inset-y-0 right-0 w-80 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    } z-50`}>
      <div className="p-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          <X size={24} />
        </button>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Settings</h2>
        
        <div className="space-y-4">
          <button
            onClick={handleShare}
            className="w-full flex items-center px-4 py-2 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Share2 size={20} className="mr-3" />
            Share Location
          </button>
          
          <button
            onClick={onOpenImport}
            className="w-full flex items-center px-4 py-2 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Upload size={20} className="mr-3" />
            Import to Back-Office
            <span className="ml-auto text-xs text-gray-400">Alt+4</span>
          </button>
          
          <button
            onClick={onOpenAnalytics}
            className="w-full flex items-center px-4 py-2 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <BarChart size={20} className="mr-3" />
            Analytics
            <span className="ml-auto text-xs text-gray-400">Alt+5</span>
          </button>
          
          <button
            onClick={handleDeleteAll}
            className="w-full flex items-center px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <Trash2 size={20} className="mr-3" />
            Delete All Locations
          </button>
          
          <button
            onClick={onSignOut}
            className="w-full flex items-center px-4 py-2 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <LogOut size={20} className="mr-3" />
            Sign Out
          </button>
        </div>
        
        {/* Keyboard shortcuts section */}
        <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
            <Keyboard size={16} className="mr-2" />
            <span>Keyboard Shortcuts</span>
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 space-y-1 pl-2">
            <div className="flex justify-between">
              <span>New Location</span>
              <span className="font-mono">Alt+1</span>
            </div>
            <div className="flex justify-between">
              <span>Saved Locations</span>
              <span className="font-mono">Alt+2</span>
            </div>
            <div className="flex justify-between">
              <span>Export</span>
              <span className="font-mono">Alt+3</span>
            </div>
            <div className="flex justify-between">
              <span>Import</span>
              <span className="font-mono">Alt+4</span>
            </div>
            <div className="flex justify-between">
              <span>Analytics</span>
              <span className="font-mono">Alt+5</span>
            </div>
          </div>
        </div>
        
        {/* Powered by MNS section */}
        <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Powered by <a 
              href="https://mns.mu/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              MNS
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar
