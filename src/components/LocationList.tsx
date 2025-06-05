import React, { useState, useEffect } from 'react';
import { Location, Group } from '../types';
import { getLocations, getGroups, deleteLocation } from '../services/locationService';
import LocationCard from './LocationCard';
import LocationMap from './LocationMap';
import { List, Grid, SortAsc, SortDesc, Search, Filter, Map, ChevronLeft, ArrowUpDown, ChevronRight } from 'lucide-react';
import { supabase } from "../lib/supabase";

const ITEMS_PER_PAGE = 30;

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
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<SortColumn>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE);

  type SortColumn = 'title' | 'createdAt' | 'group' | 'coordinates';

  useEffect(() => {
    loadData();
  }, []);
  
  useEffect(() => {
    filterAndSortLocations();
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [locations, filterGroupId, searchTerm, sortColumn, sortDirection]);
  
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [locationsData, groupsData] = await Promise.all([
        getLocations(),
        getGroups()
      ]);
      
      // Get the current user ID from your auth system
      const currentUserId = await getCurrentUserId();
      
      // Set isOwner flag for each location
      const locationsWithOwnership = locationsData.map(location => {
        const isOwner = location.user_id === currentUserId;
        return {
          ...location,
          isOwner
        };
      });
      
      setLocations(locationsWithOwnership);
      setGroups(groupsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get current user ID
  const getCurrentUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || '';
  };
  
  const handleDeleteLocation = async (id: string) => {
    setIsDeleting(true);
    try {
      // console.log(`Attempting to delete location ${id}`);
      await deleteLocation(id);
      // console.log(`Successfully deleted location ${id}`);
      await loadData();
    } catch {
      // console.error('Error deleting location:', error);
      alert('Failed to delete location. You can only delete your own locations.');
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
    
    // Apply column-based sorting
    filtered = sortLocations(filtered);
    
    setFilteredLocations(filtered);
  };

  const sortLocations = (locations: Location[]) => {
    return [...locations].sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;
      
      switch (sortColumn) {
        case 'title':
          return direction * a.title.localeCompare(b.title);
        case 'createdAt':
          return direction * (a.createdAt - b.createdAt);
        case 'group':
          {
            const groupA = getGroupById(a.groupId)?.name || 'Default';
            const groupB = getGroupById(b.groupId)?.name || 'Default';
            return direction * groupA.localeCompare(groupB);
          }
        case 'coordinates':
          // Sort by latitude as an example
          return direction * (a.latitude - b.latitude);
        default:
          return 0;
      }
    });
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getGroupById = (id: string): Group => {
    return groups.find(group => group.id === id) || { id: 'unknown', name: 'Unknown', color: '#ccc' };
  };

  const handleUpdateLocation = async () => {
    // Force a complete reload of the data
    setLocations([]);  // Clear current locations
    setIsLoading(true);
    try {
      const freshLocations = await getLocations();
      setLocations(freshLocations);
    } catch (error) {
      console.error('Error refreshing locations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredLocations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLocations = filteredLocations.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const Pagination = () => {
    if (filteredLocations.length === 0) return null;

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
        <div className="flex items-center space-x-2 order-2 sm:order-1">
          <label htmlFor="itemsPerPage" className="text-sm text-gray-600 dark:text-gray-400">
            Show:
          </label>
          <select
            id="itemsPerPage"
            value={itemsPerPage}
            onChange={(e) => {
              const value = Number(e.target.value);
              // Special case for "All" option
              if (value === 0) {
                // Set to a very large number to show all items
                setItemsPerPage(filteredLocations.length || 1000);
              } else {
                setItemsPerPage(value);
              }
              setCurrentPage(1); // Reset to first page when changing items per page
            }}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            <option value={30}>30</option>
            <option value={90}>90</option>
            <option value={150}>150</option>
            <option value={0}>All</option>
          </select>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center space-x-2 order-1 sm:order-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === page
                      ? 'bg-gray-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    );
  };

  const LoadingPlaceholder = () => (
    <div className="flex items-center justify-center py-8">
      <div className="animate-pulse flex space-x-4">
        <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-24"></div>
        <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-24"></div>
      </div>
    </div>
  );

  const CompactListView = () => {
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    
    const toggleRowExpansion = (id: string) => {
      setExpandedRow(expandedRow === id ? null : id);
    };
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-8"></th>
              <th 
                scope="col" 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center">
                  Title
                  <ArrowUpDown size={14} className="ml-1" />
                </div>
              </th>
              <th 
                scope="col" 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hidden sm:table-cell"
                onClick={() => handleSort('coordinates')}
              >
                <div className="flex items-center">
                  Coordinates
                  <ArrowUpDown size={14} className="ml-1" />
                </div>
              </th>
              <th 
                scope="col" 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('group')}
              >
                <div className="flex items-center">
                  Group
                  <ArrowUpDown size={14} className="ml-1" />
                </div>
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                Tags
              </th>
              <th 
                scope="col" 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hidden sm:table-cell"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center">
                  Date
                  <ArrowUpDown size={14} className="ml-1" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedLocations.map((location) => {
              const group = getGroupById(location.groupId);
              const isExpanded = expandedRow === location.id;
              
              return (
                <React.Fragment key={location.id}>
                  <tr className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${isExpanded ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                    <td className="px-3 py-2">
                      <button 
                        onClick={() => toggleRowExpansion(location.id)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      >
                        <ChevronRight size={16} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                        {location.title}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap hidden sm:table-cell">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <span 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: group?.color || '#888888' }}
                        ></span>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {group?.name || 'Default'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(location.tags ?? []).slice(0, 2).map((tag, idx) => (
                          <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                            {tag}
                          </span>
                        ))}
                        {(location.tags ?? []).length > 2 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            +{(location.tags ?? []).length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                      {new Date(location.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-gray-50 dark:bg-gray-700/50">
                      <td colSpan={7} className="px-3 py-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Details</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                              {location.description || 'No description provided'}
                            </p>
                            {(location.tags ?? []).length > 0 && (
                              <div className="mt-2">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">All Tags</h4>
                                <div className="flex flex-wrap gap-1">
                                  {(location.tags ?? []).map((tag, idx) => (
                                    <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Coordinates</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Latitude: {location.latitude.toFixed(7)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Longitude: {location.longitude.toFixed(7)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              Added: {new Date(location.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const toggleSortOrder = () => {
    // Toggle between ascending and descending for the createdAt column
    setSortColumn('createdAt');
    setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    
    // Keep the sortOrder state in sync for UI display purposes
    setSortOrder(sortDirection === 'desc' ? 'oldest' : 'newest');
  };

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
            title="Table view"
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
      ) : viewMode === 'list' ? (
        <>
          <CompactListView />
          <Pagination />
        </>
      ) : (
        <>
          <div className={`
            ${viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' 
              : 'space-y-4'
            }
          `}>
            {paginatedLocations.map((location) => (
              <LocationCard
                key={location.id}
                location={location}
                group={getGroupById(location.groupId)}
                onDelete={handleDeleteLocation}
                onUpdate={handleUpdateLocation}
              />
            ))}
          </div>
          <Pagination />
        </>
      )}
      
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center md:text-left">
        {filteredLocations.length} location{filteredLocations.length !== 1 ? 's' : ''} {filterGroupId || searchTerm ? 'found' : 'saved'}
        {filteredLocations.length > itemsPerPage && !viewMode.includes('map') && (
          <span> (Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredLocations.length)})</span>
        )}
      </div>
    </div>
  );
};

export default LocationList;
