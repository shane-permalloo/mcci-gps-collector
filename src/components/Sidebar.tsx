import React from 'react';
import { Menu, Share2, Trash2, X, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleteAll: () => void;
  onSignOut: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onDeleteAll, onSignOut }) => {
  const handleShare = async () => {
    try {
      const position = await getCurrentPosition();
      const shareText = `Check out my location!\nLatitude: ${position.coords.latitude}\nLongitude: ${position.coords.longitude}\nGoogle Maps: https://www.google.com/maps?q=${position.coords.latitude},${position.coords.longitude}`;
      
      if (navigator.share) {
        await navigator.share({
          text: shareText,
        });
      } else {
        // Fallback for browsers that don't support the Web Share API
        const textArea = document.createElement('textarea');
        textArea.value = shareText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Location copied to clipboard!');
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      });
    });
  };

  const handleDeleteAll = () => {
    if (window.confirm('Are you sure you want to delete all locations? This action cannot be undone.')) {
      onDeleteAll();
    }
  };

  return (
    <div className={`fixed inset-y-0 right-0 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out ${
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
      </div>
    </div>
  );
};

export default Sidebar