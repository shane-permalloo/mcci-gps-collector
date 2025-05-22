import React, { useState, useEffect, useRef } from 'react';
import { getImportedLocations } from '../services/locationService';
import { Search } from 'lucide-react';

interface ImportedLocation {
  id: number;
  title: string;
}

interface TitleSelectorProps {
  onTitleSelect: (title: string) => void;
  value: string;
}

const TitleSelector: React.FC<TitleSelectorProps> = ({ onTitleSelect, value }) => {
  const [importedLocations, setImportedLocations] = useState<ImportedLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadImportedLocations();

    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadImportedLocations = async () => {
    try {
      const locations = await getImportedLocations();
      setImportedLocations(locations);
    } catch (error) {
      console.error('Error loading imported locations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setSearchTerm(newValue);
    onTitleSelect(newValue);
  };

  const handleTitleSelect = (title: string) => {
    onTitleSelect(title);
    setSearchTerm(title);
    setIsOpen(false);
  };

  const filteredLocations = importedLocations.filter(location =>
    location.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const showDropdown = isOpen && (filteredLocations.length > 0 || !importedLocations.some(loc => loc.title === searchTerm));

  if (isLoading) {
    return (
      <div className="animate-pulse flex space-x-4">
        <div className="h-10 bg-slate-200 dark:bg-slate-600 rounded w-full"></div>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          className="w-full px-4 py-2 pl-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
          placeholder="Search or enter new title"
        />
        <Search 
          size={18} 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        />
      </div>

      {showDropdown && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredLocations.length > 0 ? (
            <ul className="py-1">
              {filteredLocations.map((location) => (
                <li
                  key={location.id}
                  className={`px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 ${
                    location.title === searchTerm ? 'bg-gray-100 dark:bg-gray-600' : ''
                  }`}
                  onClick={() => handleTitleSelect(location.title)}
                >
                  {location.title}
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-2 text-gray-500 dark:text-gray-400">
              Press Enter to add "{searchTerm}" as a new title
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TitleSelector;