import React, { useState, useEffect, useRef } from 'react';
import { getLocations, getGroups } from '../services/locationService';
import { getUsers } from '../services/userService';
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
import { BarChart, PieChart, Calendar, MapPin, Users, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import useDarkMode from '../hooks/useDarkMode';

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
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isDark } = useDarkMode();
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // References to chart instances
  const barChartRef = useRef<ChartJS>(null);
  const pieChartRef = useRef<ChartJS>(null);
  const lineChartRef = useRef<ChartJS>(null);
  const userChartRef = useRef<ChartJS>(null);

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
    if (userChartRef.current) {
      userChartRef.current.update();
    }
  }, [isDark]);

  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [locationsData, groupsData, usersData] = await Promise.all([
        getLocations(),
        getGroups(),
        getUsers()
      ]);
      
      setLocations(locationsData);
      setGroups(groupsData);
      setUsers(usersData);
      

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

  // Get locations by user
  const getLocationsByUser = () => {
    const userData: Record<string, number> = {};
    
    // Add "Anonymous" category
    userData['Anonymous'] = 0;
    
    // Count locations by user
    locations.forEach(location => {
      if (location.userId) {
        // Use truncated ID instead of email
        const displayName = `User ${location.userId.substring(0, 8)}`;
        
        userData[displayName] = (userData[displayName] || 0) + 1;
      } else {
        userData['Anonymous']++;
      }
    });
    
    // Remove users with zero locations
    return Object.fromEntries(
      Object.entries(userData).filter(([_, count]) => count > 0)
    );
  };

  // User chart data - limit to top 10 users if there are many
  const userDataRaw = getLocationsByUser();
  const sortedUserEntries = Object.entries(userDataRaw)
    .sort(([_, countA], [__, countB]) => countB - countA);
  
  // Take top 10 users
  const topUsers = sortedUserEntries.slice(0, 10);
  const userData = Object.fromEntries(topUsers);
  
  // User chart data
  const userChartData = {
    labels: Object.keys(userData),
    datasets: [
      {
        label: 'Locations by User',
        data: Object.values(userData),
        backgroundColor: 'rgb(75, 192, 192)',
        borderColor: 'rgba(75, 192, 192, 0.8)',
        borderWidth: 2,
        borderRadius: 6
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
        position: 'right' as const,
        labels: {
          color: getTextColor()
        }
      }
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

  // Get horizontal bar chart options for user chart
  const getUserChartOptions = () => ({
    indexAxis: 'y' as const,
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
        ticks: {
          color: getTextColor(),
          font: {
            size: 11,
          },
          callback: function(value: any) {
            const label = this.getLabelForValue(value);
            // Truncate long email addresses
            return label.length > 25 ? label.substring(0, 22) + '...' : label;
          }
        },
        grid: {
          color: getGridColor(),
          drawBorder: false
        },
        border: {
          display: false
        }
      },
      x: {
        beginAtZero: true,
        ticks: {
          color: getTextColor(),
          font: {
            size: 11,
          },
          precision: 0,
          stepSize: 1
        },
        grid: {
          color: getGridColor(),
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
          <div className="flex items-center">
            <MapPin className="h-8 w-8 text-blue-500 dark:text-blue-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-blue-600 dark:text-blue-300">Total Locations</h3>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-200">{locations.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-blue-500 dark:text-blue-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-blue-600 dark:text-blue-300">Last 7 Days</h3>
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
        
        <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-4 border border-teal-100 dark:border-teal-800">
          <div className="flex items-center">
            <PieChart className="h-8 w-8 text-teal-500 dark:text-teal-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-teal-600 dark:text-teal-300">Groups</h3>
              <p className="text-2xl font-bold text-teal-700 dark:text-teal-200">{groups.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-4 border border-teal-100 dark:border-teal-800">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-teal-500 dark:text-teal-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-teal-600 dark:text-teal-300">Total Users</h3>
              <p className="text-2xl font-bold text-teal-700 dark:text-teal-200">
                {Object.keys(userDataRaw).length - (userDataRaw['Anonymous'] > 0 ? 1 : 0)}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Charts - key={forceUpdate} forces re-render when theme changes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center">
            <BarChart size={20} className="mr-2 text-blue-500" />
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
      
      {/* User Chart and Daily Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

    
        <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center">
            <PieChart size={20} className="mr-2 text-teal-500" />
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

        <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center">
            <Users size={20} className="mr-2 text-teal-500" />
            Locations by User
          </h3>
          <div className="h-64">
            <Bar 
              key={`user-chart-${forceUpdate}`}
              ref={userChartRef}
              data={userChartData} 
              options={getUserChartOptions()}
            />
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default AnalyticsDashboard;























