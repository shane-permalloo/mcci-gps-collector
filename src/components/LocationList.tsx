import React, { useState, useEffect } from 'react';
import { Location, Group } from '../types';
import { getLocations, getGroups, deleteLocation } from '../services/locationService';
import LocationCard from './LocationCard';
import LocationMap from './LocationMap';
import { List, Grid, SortAsc, SortDesc, Search, Filter, Map } from 'lucide-react';

const LocationList: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [filterGroupId, setFilterGroupId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    loadData();
  }, []);
  
  useEffect(() => {
    filterAndSortLocations();
  }, [locations, filterGroupId, sortOrder, searchTerm]);
  
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [locationsData, groupsData] = await Promise.all([
        getLocations(),
        getGroups()
      ]);
      setLocations(locationsData);
      setGroups(groupsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteLocation = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteLocation(id);
      await loadData();
    } catch (error) {
      console.error('Error deleting location:', error);
    } finally {
      setIsDeleting(false);
    }
  };
  
  const filterAndSortLocations = () => {
    let filtered = [...locations];
    
    if (filterGroupId) {
      filtered = filtered.filter(location => location.groupId === filterGroupId);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(location => 
        location.title.toLowerCase().includes(term) || 
        location.description?.toLowerCase().includes(term) ||
        location.tags?.some(tag => tag.toLowerCase().includes(term))
      );
    }
    
    filtered.sort((a, b) => {
      if (sortOrder === 'newest') {
        return b.createdAt - a.createdAt;
      } else {
        return a.createdAt - b.createdAt;
      }
    });
    
    setFilteredLocations(filtered);
  };
  
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest');
  };
  
  const getGroupById = (id: string): Group => {
    return groups.find(group => group.id === id) || { id: 'unknown', name: 'Unknown', color: '#ccc' };
  };

  const LoadingPlaceholder = () => (
    <div className="flex items-center justify-center py-8">
      <div className="animate-pulse flex space-x-4">
        <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-24"></div>
        <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-24"></div>
      </div>
    </div>
  );
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">Saved Locations</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'grid' 
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Grid view"
          >
            <Grid size={20} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'list' 
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="List view"
          >
            <List size={20} />
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'map' 
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Map view"
          >
            <Map size={20} />
          </button>
          <button
            onClick={toggleSortOrder}
            className="p-2 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}
          >
            {sortOrder === 'newest' ? <SortDesc size={20} /> : <SortAsc size={20} />}
          </button>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        <div className="relative w-full sm:w-auto">
          <select
            value={filterGroupId || ''}
            onChange={(e) => setFilterGroupId(e.target.value || null)}
            className="appearance-none pl-10 pr-8 py-2 w-full sm:w-auto border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Groups</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter size={18} className="text-gray-400" />
          </div>
        </div>
      </div>
      
      {isLoading || isDeleting ? (
        <LoadingPlaceholder />
      ) : filteredLocations.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400">No locations saved yet.</p>
        </div>
      ) : viewMode === 'map' ? (
        <LocationMap 
          locations={filteredLocations} 
          groups={groups}
        />
      ) : (
        <div className={`
          ${viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' 
            : 'space-y-4'
          }
        `}>
          {filteredLocations.map((location) => (
            <LocationCard
              key={location.id}
              location={location}
              group={getGroupById(location.groupId)}
              onDelete={handleDeleteLocation}
              onUpdate={loadData}
            />
          ))}
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        {filteredLocations.length} location{filteredLocations.length !== 1 ? 's' : ''} {filterGroupId || searchTerm ? 'found' : 'saved'}
      </div>
    </div>
  );
};

export default LocationList;