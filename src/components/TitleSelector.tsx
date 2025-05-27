import React, { useState, useEffect, useRef } from 'react';
import { getImportedLocations } from '../services/locationService';
import { Search, Plus } from 'lucide-react';

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
  const [showAddNew, setShowAddNew] = useState(false);
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

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    // Show "Add New" option if searchTerm doesn't match any existing titles
    const hasMatch = importedLocations.some(
      loc => loc.title.toLowerCase() === searchTerm.toLowerCase()
    );
    setShowAddNew(!hasMatch && searchTerm.trim().length > 0);
  }, [searchTerm, importedLocations]);

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
    setIsOpen(true);
  };

  const handleTitleSelect = (title: string) => {
    onTitleSelect(title);
    setSearchTerm(title);
    setIsOpen(false);
  };

  const handleAddNew = () => {
    handleTitleSelect(searchTerm.trim());
    setIsOpen(false);
  };

  const filteredLocations = importedLocations.filter(location =>
    location.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const showDropdown = isOpen && searchTerm.trim().length > 0;

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
          className="w-full px-4 py-2 pl-10 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
          placeholder="Search or enter new title"
        />
        <Search 
          size={18} 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        />
        {showAddNew && (
          <button
            onClick={handleAddNew}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
            title="Add as new title"
          >
            <Plus size={18} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredLocations.length > 0 ? (
            <ul className="py-1">
              {filteredLocations.map((location) => (
                <li
                  key={location.id}
                  className={`px-4 py-2 cursor-pointer text-gray-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 ${
                    location.title.toLowerCase() === searchTerm.toLowerCase()
                      ? 'bg-gray-100 dark:bg-gray-600'
                      : ''
                  }`}
                  onClick={() => handleTitleSelect(location.title)}
                >
                  {location.title}
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-2 text-gray-500 dark:text-gray-400 flex items-center justify-between">
              <span>No matching titles found</span>
              <button
                onClick={handleAddNew}
                className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
              >
                <Plus size={16} className="mr-1" />
                Add New
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TitleSelector;