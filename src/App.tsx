import React, { useState, useEffect, useRef } from 'react';
import { Plus, MapPin, FileDown, Upload, BarChart, Menu } from 'lucide-react';
import LocationForm from './components/LocationForm';
import LocationList from './components/LocationList';
import CSVImport from './components/CSVImport';
import ExportPage from './components/ExportPage';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import ThemeToggle from './components/ThemeToggle';
import Sidebar from './components/Sidebar';
import Auth from './components/Auth';
import useDarkMode from './hooks/useDarkMode';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';
import { getLocations, deleteAllLocations } from './services/locationService';

function App() {
  const [activeTab, setActiveTab] = useState<'list' | 'new' | 'import' | 'export' | 'analytics'>('new');
  const [locationCount, setLocationCount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isDark, setIsDark } = useDarkMode();
  const [user, setUser] = useState<User | null>(null);
  // Add this state to track scroll position
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const tabContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Handle keyboard shortcuts for tab navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only process if Alt key is pressed and not in an input field
      if (e.altKey && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        switch (e.key) {
          case '1':
            setActiveTab('new');
            e.preventDefault();
            break;
          case '2':
            setActiveTab('list');
            e.preventDefault();
            break;
          case '3':
            setActiveTab('export');
            e.preventDefault();
            break;
          case '4':
            setActiveTab('import');
            e.preventDefault();
            break;
          case '5':
            setActiveTab('analytics');
            e.preventDefault();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      // Close sidebar when session is initially checked
      setIsSidebarOpen(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      // Close sidebar when auth state changes (sign in or sign out)
      setIsSidebarOpen(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    updateLocationCount();
  }, []);

  const updateLocationCount = async () => {
    try {
      const locations = await getLocations();
      setLocationCount(locations.length);
    } catch (error) {
      console.error('Error updating location count:', error);
    }
  };

  const handleLocationSaved = () => {
    updateLocationCount();
    setActiveTab('new');
  };

  const handleDeleteAll = () => {
    deleteAllLocations();
    updateLocationCount();
    setIsSidebarOpen(false);
  };

  const handleSignOut = async () => {
    // Set a flag in sessionStorage before signing out
    sessionStorage.setItem('wasSignedIn', 'true');
    await supabase.auth.signOut();
    // Sidebar will be closed by the onAuthStateChange handler
  };

  const handleOpenAnalytics = () => {
    setActiveTab('analytics');
    setIsSidebarOpen(false);
  };

  const handleOpenImport = () => {
    setActiveTab('import');
    setIsSidebarOpen(false);
  };

  // Add this useEffect to ensure the active tab is visible when it changes
  useEffect(() => {
    // Only run on desktop
    if (window.innerWidth >= 768) {
      // Find the active button
      const activeButton = document.querySelector(`button[title*="${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}"]`);
      
      if (activeButton) {
        // Scroll the button into view with smooth behavior
        activeButton.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [activeTab]);

  // Add this useEffect to check if scrolling is needed
  useEffect(() => {
    const checkScrollWidth = () => {
      if (tabContainerRef.current) {
        const { scrollWidth, clientWidth } = tabContainerRef.current;
        setShowScrollIndicator(scrollWidth > clientWidth);
      }
    };

    // Check initially
    checkScrollWidth();

    // Check on window resize
    window.addEventListener('resize', checkScrollWidth);
    return () => window.removeEventListener('resize', checkScrollWidth);
  }, []);

  // Add this function to handle scroll events
  const handleScroll = () => {
    if (tabContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabContainerRef.current;
      
      // If we're near the end, hide the indicator
      if (scrollLeft + clientWidth >= scrollWidth - 20) {
        setShowScrollIndicator(false);
      } else {
        setShowScrollIndicator(true);
      }
    }
  };

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-blue-600 dark:bg-blue-800 text-white shadow-md transition-colors">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <MapPin size={24} className="mr-2 shrink-0" />
              <h1 className="text-xl sm:text-2xl font-bold">MCCI GPS</h1>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} />

              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 hover:bg-blue-700 dark:hover:bg-blue-700 rounded-full transition-colors"
                aria-label="Open menu"
              >
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 mb-14 md:mb-0">
        {/* Top navigation - hidden on mobile */}
        <div className="hidden md:flex justify-center mb-6 relative">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full justify-center shadow-md p-1 inline-flex transition-colors" id="tab-buttons">
            <div 
              ref={tabContainerRef}
              onScroll={handleScroll}
              className="flex flex-nowrap overflow-x-auto gap-1 md:gap-2 justify-start px-1 snap-x snap-mandatory scroll-smooth"
            >
              
              <button
                onClick={() => setActiveTab('new')}
                className={`flex-shrink-0 flex items-center px-4 py-2 rounded-full transition-colors snap-center ${
                  activeTab === 'new' ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title="New Location (Alt+1)"
              >
                <Plus size={18} className="mr-2" />
                <span>New</span> <span className='ml-1'>Location</span>
              </button>
              
              <button
                onClick={() => setActiveTab('list')}
                className={`flex-shrink-0 flex items-center px-4 py-2 rounded-full transition-colors snap-center ${
                  activeTab === 'list' ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title="Saved Locations (Alt+2)"
              >
                <MapPin size={18} className="mr-2" />
                <span>Saved</span> <span className='ml-1'> Locations</span>
              </button>
              
              <button
                onClick={() => setActiveTab('export')}
                className={`flex-shrink-0 flex items-center px-4 py-2 rounded-full transition-colors snap-center ${
                  activeTab === 'export' ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title="Export to File (Alt+3)"
              >
                <FileDown size={18} className="mr-2" />
                <span>Export</span> <span className='ml-1'> to File</span>
              </button>
              
              <button
                onClick={() => setActiveTab('import')}
                className={`flex-shrink-0 flex items-center px-4 py-2 rounded-full transition-colors snap-center ${
                  activeTab === 'import' ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title="Import to Back-Office (Alt+4)"
              >
                <Upload size={18} className="mr-2" />
                <span>Import</span> <span className='ml-1'> to Back-Office</span>
              </button>
              
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex-shrink-0 flex items-center px-4 py-2 rounded-full transition-colors snap-center ${
                  activeTab === 'analytics' ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title="Analytics (Alt+5)"
              >
                <BarChart size={18} className="mr-2" />
                <span>Analytics</span>
              </button>
            </div>
          </div>
          
          {/* Subtle gradient indicator for desktop */}
          {showScrollIndicator && (
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white dark:from-gray-800 to-transparent pointer-events-none"></div>
          )}
        </div>

        {/* Mobile current tab indicator */}
        <div className="md:hidden mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            {activeTab === 'new' ? 'New Location' : 
             activeTab === 'list' ? 'Saved Locations' : 
             activeTab === 'export' ? 'Export to File' : 
             activeTab === 'import' ? 'Import to Back-Office' : 
             'Analytics'}
          </h2>
        </div>

        <div className="max-w-8xl mx-auto" style={{ minHeight: '70vh' }}>
          {activeTab === 'analytics' ? (
            <AnalyticsDashboard />
          ) : activeTab === 'new' ? (
            <LocationForm onLocationSaved={handleLocationSaved} />
          ) : activeTab === 'list' ? (
            <LocationList />
          ) : activeTab === 'import' ? (
            <CSVImport />
          ) : (
            <ExportPage />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 dark:bg-gray-950 text-gray-300 py-4 sm:py-6 mt-auto transition-colors mb-16 hidden md:flex md:mb-0">
        <div className="container mx-auto px-4 text-center">
          <p>MCCI GPS Collector &copy; {new Date().getFullYear()}</p>
          <div className="flex justify-center items-center gap-4 mt-2">
            <p className="text-xs sm:text-sm text-gray-400">
              Logged in as {user.email}
            </p>
          </div>
        </div>
      </footer>

      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onDeleteAll={handleDeleteAll}
        onSignOut={handleSignOut}
        onOpenAnalytics={handleOpenAnalytics}
        onOpenImport={handleOpenImport}
      />

      {/* Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg z-30">
        <div className="flex justify-between items-center px-2 py-3">
          <button
            onClick={() => setActiveTab('new')}
            className={`flex flex-col items-center justify-center flex-1 ${
              activeTab === 'new' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <Plus size={20} />
            <span className="text-xs mt-1">New</span>
          </button>
          
          <button
            onClick={() => setActiveTab('list')}
            className={`flex flex-col items-center justify-center flex-1 ${
              activeTab === 'list' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <MapPin size={20} />
            <span className="text-xs mt-1">Saved</span>
          </button>
          
          <button
            onClick={() => setActiveTab('export')}
            className={`flex flex-col items-center justify-center flex-1 ${
              activeTab === 'export' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <FileDown size={20} />
            <span className="text-xs mt-1">Export</span>
          </button>
          
          <button
            onClick={() => setActiveTab('import')}
            className={`flex flex-col items-center justify-center flex-1 ${
              activeTab === 'import' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <Upload size={20} />
            <span className="text-xs mt-1">Import</span>
          </button>
          
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-col items-center justify-center flex-1 ${
              activeTab === 'analytics' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <BarChart size={20} />
            <span className="text-xs mt-1">Analytics</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;

