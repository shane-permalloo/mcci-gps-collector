import React, { useState, useEffect, useRef } from 'react';
import { getLocations, getGroups, getLocationUpdateStats } from '../services/locationService';
import { getUsers, User } from '../services/userService';
import { Location, Group } from '../types';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { 
  BarChart as BarChartIcon, 
  PieChart as PieChartIcon, 
  Calendar,
  CheckCircle,
  AlertTriangle,
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  Map as MapIcon,
  Search
} from 'lucide-react';
import useDarkMode from '../hooks/useDarkMode';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, LayersControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet.fullscreen/Control.FullScreen.css';
import { FullscreenControl } from 'react-leaflet-fullscreen';
const { BaseLayer } = LayersControl;

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const AnalyticsDashboard: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredMapLocations, setFilteredMapLocations] = useState<Location[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [updateStats, setUpdateStats] = useState<{ 
    updated: number, 
    notUpdated: number, 
    total: number 
  }>({ updated: 0, notUpdated: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const { isDark } = useDarkMode();
  const [forceUpdate, setForceUpdate] = useState(0);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [titleSearchTerm, setTitleSearchTerm] = useState<string>('');
  
  // References to chart instances
  const barChartRef = useRef<ChartJS>(null);
  const pieChartRef = useRef<ChartJS>(null);
  const lineChartRef = useRef<ChartJS>(null);

  // Force chart update when theme changes
  useEffect(() => {
    // Increment to trigger re-render
    setForceUpdate(prev => prev + 1);
    
    // Update chart colors
    if (barChartRef.current) {
      barChartRef.current.update();
    }
    if (pieChartRef.current) {
      pieChartRef.current.update();
    }
    if (lineChartRef.current) {
      lineChartRef.current.update();
    }
  }, [isDark]);

  useEffect(() => {
    loadData();
  }, []);
  
  useEffect(() => {
    // Apply filters whenever locations, selectedGroupId, or titleSearchTerm changes
    applyMapFilters();
  }, [locations, selectedGroupId, titleSearchTerm]);
  
  const applyMapFilters = () => {
    let filtered = [...locations];
    
    // Filter by group
    if (selectedGroupId) {
      filtered = filtered.filter(location => location.groupId === selectedGroupId);
    }
    
    // Filter by title search
    if (titleSearchTerm.trim()) {
      const searchTermLower = titleSearchTerm.toLowerCase().trim();
      filtered = filtered.filter(location => 
        location.title.toLowerCase().includes(searchTermLower)
      );
    }
    
    setFilteredMapLocations(filtered);
  };
  
  const handleGroupFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGroupId(e.target.value);
  };
  
  const handleTitleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitleSearchTerm(e.target.value);
  };
  
  const clearFilters = () => {
    setSelectedGroupId('');
    setTitleSearchTerm('');
  };
  
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [locationsData, groupsData, usersData, locationUpdateStats] = await Promise.all([
        getLocations(),
        getGroups(),
        getUsers(),
        getLocationUpdateStats()
      ]);
      
      setLocations(locationsData);
      setFilteredMapLocations(locationsData); // Initialize filtered locations with all locations
      setGroups(groupsData);
      setUsers(usersData);
      setUpdateStats(locationUpdateStats);
      
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get text color based on dark mode
  const getTextColor = () => isDark ? '#e5e7eb' : '#374151';
  
  // Get grid color based on dark mode
  const getGridColor = () => isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  // Group locations by month
  const getLocationsByMonth = () => {
    const monthData: Record<string, number> = {};
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 5);
    
    // Initialize all months with zero
    for (let i = 0; i < 6; i++) {
      const date = new Date(sixMonthsAgo);
      date.setMonth(sixMonthsAgo.getMonth() + i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthData[monthKey] = 0;
    }
    
    // Count locations by month
    locations.forEach(location => {
      const date = new Date(location.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthData[monthKey] !== undefined) {
        monthData[monthKey]++;
      }
    });
    
    return monthData;
  };

  // Get locations by group
  const getLocationsByGroup = () => {
    const groupData: Record<string, number> = {};
    
    // Initialize all groups with zero
    groups.forEach(group => {
      groupData[group.name] = 0;
    });
    
    // Add default group if not present
    if (!groupData['Default']) {
      groupData['Default'] = 0;
    }
    
    // Count locations by group
    locations.forEach(location => {
      const group = groups.find(g => g.id === location.groupId);
      const groupName = group ? group.name : 'Default';
      groupData[groupName] = (groupData[groupName] || 0) + 1;
    });
    
    return groupData;
  };

  // Format month labels
  const formatMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  };

  const monthlyData = getLocationsByMonth();
  const groupData = getLocationsByGroup();

  // Monthly trend chart data with improved styling
  const timeChartData = {
    labels: Object.keys(monthlyData).map(formatMonthLabel),
    datasets: [
      {
        label: 'Locations Saved',
        data: Object.values(monthlyData),
        backgroundColor: isDark 
          ? 'rgba(59, 130, 246, 0.7)' 
          : 'rgba(59, 130, 246, 0.5)',
        borderColor: isDark 
          ? 'rgb(96, 165, 250)' 
          : 'rgb(37, 99, 235)',
        borderWidth: 2,
        borderRadius: 6,
        hoverBackgroundColor: isDark 
          ? 'rgba(96, 165, 250, 0.8)' 
          : 'rgba(37, 99, 235, 0.6)',
      },
    ],
  };

  const groupChartData = {
    labels: Object.keys(groupData),
    datasets: [
      {
        label: 'No. of locations',
        data: Object.values(groupData),
        backgroundColor: groups.map(group => group.color || '#ccc').concat(['#ccc']),
        borderWidth: 1,
      },
    ],
  };

  // Daily trend for the last 14 days
  const getDailyTrend = () => {
    const dailyData: Record<string, number> = {};
    const now = new Date();
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(now.getDate() - 13);
    
    // Initialize all days with zero
    for (let i = 0; i < 14; i++) {
      const date = new Date(twoWeeksAgo);
      date.setDate(twoWeeksAgo.getDate() + i);
      const dayKey = date.toISOString().split('T')[0];
      dailyData[dayKey] = 0;
    }
    
    // Count locations by day
    locations.forEach(location => {
      const date = new Date(location.createdAt);
      const dayKey = date.toISOString().split('T')[0];
      if (dailyData[dayKey] !== undefined) {
        dailyData[dayKey]++;
      }
    });
    
    return dailyData;
  };

  const dailyData = getDailyTrend();
  
  const dailyChartData = {
    labels: Object.keys(dailyData).map(day => new Date(day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Daily Locations',
        data: Object.values(dailyData),
        fill: false,
        backgroundColor: isDark 
          ? 'rgba(59, 130, 246, 0.7)' 
          : 'rgba(59, 130, 246, 0.5)',
        borderColor: isDark 
          ? 'rgb(96, 165, 250)' 
          : 'rgb(37, 99, 235)',
        tension: 0.1
      },
    ],
  };

  // Chart options with dynamic colors based on dark mode
  const getBarChartOptions = () => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: getTextColor(),
          font: {
            weight: 'bold',
          }
        }
      },
      tooltip: {
        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        titleColor: isDark ? '#e5e7eb' : '#1e293b',
        bodyColor: isDark ? '#e5e7eb' : '#1e293b',
        borderColor: isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.7)',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        cornerRadius: 8,
        displayColors: true,
        usePointStyle: true,
      },
      title: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: getTextColor(),
          font: {
            size: 11,
          },
          precision: 0
        },
        grid: {
          color: getGridColor(),
          drawBorder: false,
        },
        border: {
          display: false
        }
      },
      x: {
        ticks: {
          color: getTextColor(),
          font: {
            size: 11,
          }
        },
        grid: {
          display: false,
          drawBorder: false
        },
        border: {
          display: false
        }
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    }
  });

  const getPieChartOptions = () => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: getTextColor(),
          font: {
            weight: 'bold',
          },
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        titleColor: isDark ? '#e5e7eb' : '#1e293b',
        bodyColor: isDark ? '#e5e7eb' : '#1e293b',
        borderColor: isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.7)',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        cornerRadius: 8,
        displayColors: true,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw as number;
            const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    }
  });

  const getLineChartOptions = () => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: getTextColor()
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: getTextColor(),
          stepSize: 1
        },
        grid: {
          color: getGridColor()
        }
      },
      x: {
        ticks: {
          color: getTextColor()
        },
        grid: {
          color: getGridColor()
        }
      }
    }
  });

  // Calculate locations added in the last week
  const getLocationsLastWeek = () => {
    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 6);
    
    return locations.filter(location => {
      const createdDate = new Date(location.createdAt);
      return createdDate >= oneWeekAgo && createdDate <= now;
    }).length;
  };

  const locationsLastWeek = getLocationsLastWeek();
  
  // Calculate percentage change from previous week
  const getWeeklyChangePercentage = () => {
    const now = new Date();
    const oneWeekAgo = new Date();
    const twoWeeksAgo = new Date();
    
    oneWeekAgo.setDate(now.getDate() - 6);
    twoWeeksAgo.setDate(now.getDate() - 13);
    
    const lastWeekLocations = locations.filter(location => {
      const createdDate = new Date(location.createdAt);
      return createdDate >= oneWeekAgo && createdDate <= now;
    }).length;
    
    const previousWeekLocations = locations.filter(location => {
      const createdDate = new Date(location.createdAt);
      return createdDate >= twoWeeksAgo && createdDate < oneWeekAgo;
    }).length;
    
    if (previousWeekLocations === 0) {
      return lastWeekLocations > 0 ? 100 : 0;
    }
    
    return Math.round(((lastWeekLocations - previousWeekLocations) / previousWeekLocations) * 100);
  };
  
  const weeklyChangePercentage = getWeeklyChangePercentage();

  // Calculate percentage of updated locations
  const getUpdatePercentage = () => {
    if (updateStats.total === 0) return 0;
    return Math.round((updateStats.updated / updateStats.total) * 100);
  };

  const updatePercentage = getUpdatePercentage();

  // Calculate missing locations (locations in Supabase - updated locations in Directus)
  const getMissingLocations = () => {
    return Math.max(0, locations.length - updateStats.updated);
  };
  
  const missingLocations = getMissingLocations();

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
        
        {/* Skeleton for Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-600 rounded-full mr-3"></div>
                <div className="flex-1">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                  <div className="h-6 w-12 bg-gray-200 dark:bg-gray-600 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Skeleton for Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-600">
              <div className="h-5 w-32 bg-gray-200 dark:bg-gray-600 rounded mb-4"></div>
              <div className="h-64 bg-gray-200 dark:bg-gray-600 rounded"></div>
            </div>
          ))}
        </div>
        
        {/* Skeleton for Daily Trend Chart */}
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-600">
          <div className="h-5 w-40 bg-gray-200 dark:bg-gray-600 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-600 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-6">Analytics Dashboard</h2>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* New Location Update Status Card */}
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-100 dark:border-purple-800">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-purple-500 dark:text-purple-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-purple-600 dark:text-purple-300">Location Updated onto the Back-Office</h3>
              <div className="flex items-center">
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-200">
                  {updateStats.updated}/{updateStats.total}
                </p>
                <div className="flex items-center ml-2 text-sm text-purple-600 dark:text-purple-400">
                  {updatePercentage}%
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Missing Locations Card - Added in 2nd position */}
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-100 dark:border-purple-800">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-purple-500 dark:text-purple-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-purple-600 dark:text-purple-300">Missing Locations on Back-Office</h3>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-200">{missingLocations}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-4 border border-teal-100 dark:border-teal-800">
          <div className="flex items-center">
            <PieChartIcon className="h-8 w-8 text-teal-500 dark:text-teal-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-teal-600 dark:text-teal-300">No. of Groups/Malls</h3>
              <p className="text-2xl font-bold text-teal-700 dark:text-teal-200">{groups.length}</p>
            </div>
          </div>
        </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
          <div className="flex items-center">
            <MapPin className="h-8 w-8 text-blue-500 dark:text-blue-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-blue-600 dark:text-blue-300">No. of Saved Locations</h3>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-200">{locations.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-blue-500 dark:text-blue-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-blue-600 dark:text-blue-300">No. saved last 7 Days</h3>
              <div className="flex items-center">
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-200">{locationsLastWeek}</p>
                {weeklyChangePercentage !== 0 && (
                  <div className={`flex items-center ml-2 text-sm ${
                    weeklyChangePercentage > 0 
                      ? 'text-teal-600 dark:text-teal-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {weeklyChangePercentage > 0 ? (
                      <TrendingUp size={16} className="mr-1" />
                    ) : weeklyChangePercentage < 0 ? (
                      <TrendingDown size={16} className="mr-1" />
                    ) : (
                      <Minus size={16} className="mr-1" />
                    )}
                    {Math.abs(weeklyChangePercentage)}%
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        
      </div>
      
      {/* Charts - key={forceUpdate} forces re-render when theme changes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        
        {/* Location Update Status Chart */}
        <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center">
            <CheckCircle size={20} className="mr-2 text-purple-500" />
            Location Update Status
          </h3>
          <div className="h-64 flex items-center justify-center">
            <Pie 
              key={`update-status-chart-${forceUpdate}`}
              data={{
                labels: ['Updated', 'Not Updated'],
                datasets: [
                  {
                    data: [updateStats.updated, updateStats.notUpdated],
                    backgroundColor: [
                      isDark ? 'rgba(139, 92, 246, 0.7)' : 'rgba(139, 92, 246, 0.5)',
                      isDark ? 'rgba(209, 213, 219, 0.7)' : 'rgba(209, 213, 219, 0.5)'
                    ],
                    borderColor: [
                      isDark ? 'rgb(139, 92, 246)' : 'rgb(124, 58, 237)',
                      isDark ? 'rgb(156, 163, 175)' : 'rgb(107, 114, 128)'
                    ],
                    borderWidth: 1,
                  },
                ],
              }}
              options={getPieChartOptions()}
            />
          </div>
        </div>

         <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center">
            <PieChartIcon size={20} className="mr-2 text-teal-500" />
            Locations by Group
          </h3>
          <div className="h-64 flex items-center justify-center">
            <Pie 
              key={`pie-chart-${forceUpdate}`}
              ref={pieChartRef}
              data={groupChartData} 
              options={getPieChartOptions()}
            />
          </div>
        </div>
        
        
      </div>
      
      {/* User Chart and Daily Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center">
            <BarChartIcon size={20} className="mr-2 text-blue-500" />
            Monthly Trend
          </h3>
          <div className="h-64">
            <Bar 
              key={`bar-chart-${forceUpdate}`}
              ref={barChartRef}
              data={timeChartData} 
              options={getBarChartOptions()}
            />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center">
            <Calendar size={20} className="mr-2 text-blue-500" />
            Daily Activity (Last 14 Days)
          </h3>
          <div className="h-64">
            <Line 
              key={`line-chart-${forceUpdate}`}
              ref={lineChartRef}
              data={dailyChartData} 
              options={getLineChartOptions()}
            />
          </div>
        </div>
       

      </div>

      {/* Location Cluster Map */}
      <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-600 mb-6">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center">
          <MapIcon size={20} className="mr-2 text-blue-500" />
          Location Distribution Map
        </h3>
        
        {/* Map Filtering Controls */}
        <div className="mb-4 flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px]">
            <select 
              value={selectedGroupId}
              onChange={handleGroupFilterChange}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            >
              <option value="">All Groups</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 min-w-[200px] relative">
            <input 
              type="text" 
              value={titleSearchTerm}
              onChange={handleTitleSearchChange}
              placeholder="Search by title..."
              className="w-full p-2 pl-8 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            />
            <Search size={16} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          
          <button 
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
          >
            Clear Filters
          </button>
          
          <div className="ml-auto text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredMapLocations.length} of {locations.length} locations
          </div>
        </div>
        
        <div className="h-[500px]">
          {filteredMapLocations.length > 0 ? (
            <MapContainer
              center={[filteredMapLocations[0].latitude, filteredMapLocations[0].longitude]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              className="rounded-lg"
              zoomControl={false} // Disable default zoom control
            >
              <LayersControl position="topright">
                <BaseLayer checked name="OpenStreetMap">
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                </BaseLayer>
                <BaseLayer name="Satellite">
                  <TileLayer
                    attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  />
                </BaseLayer>
              </LayersControl>
              <ZoomControl position="topright" /> {/* Keep only this zoom control */}
              <FullscreenControl position="topright" />
              <MarkerClusterGroup
                chunkedLoading
                zoomToBoundsOnClick={true}
                spiderfyOnMaxZoom={true}
                showCoverageOnHover={true}
                iconCreateFunction={(cluster) => {
                  const count = cluster.getChildCount();
                  let size = 40;
                  let className = 'bg-blue-500';
                  
                  if (count > 50) {
                    size = 60;
                    className = 'bg-red-500';
                  } else if (count > 20) {
                    size = 50;
                    className = 'bg-orange-500';
                  }
                  
                  return divIcon({
                    html: `<div class="flex items-center justify-center ${className} text-white font-bold rounded-full shadow-lg" style="width: ${size}px; height: ${size}px;">${count}</div>`,
                    className: 'custom-marker-cluster',
                    iconSize: [size, size]
                  });
                }}
              >
                {filteredMapLocations.map((location) => {
                  const group = groups.find(g => g.id === location.groupId) || { name: 'Default', color: '#ccc' };
                  return (
                    <Marker
                      key={location.id}
                      position={[location.latitude, location.longitude]}
                      icon={divIcon({
                        className: 'custom-div-icon',
                        html: `
                          <div style="
                            background-color: ${group.color};
                            width: 24px;
                            height: 24px;
                            border-radius: 50%;
                            border: 2px solid white;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                          "></div>
                        `,
                        iconSize: [24, 24],
                        iconAnchor: [12, 12],
                      })}
                    >
                      <Popup>
                        <div>
                          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">{location.title}</h3>
                          <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                            <div>{location.latitude.toFixed(7)}, {location.longitude.toFixed(7)}</div>
                            <div className="mt-1">
                              Group: <span style={{ color: group.color }}>{group.name}</span>
                            </div>
                          </div>
                          {location.description && (
                            <p className="text-sm text-gray-700 mt-2">{location.description}</p>
                          )}
                          {location.tags && location.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {location.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MarkerClusterGroup>
            </MapContainer>
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">No locations to display</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
