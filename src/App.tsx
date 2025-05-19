import React, { useState, useEffect } from 'react';
import LocationForm from './components/LocationForm';
import LocationList from './components/LocationList';
import ExportButton from './components/ExportButton';
import ThemeToggle from './components/ThemeToggle';
import Sidebar from './components/Sidebar';
import Auth from './components/Auth';
import { getLocations, deleteAllLocations } from './services/locationService';
import { Compass, Plus, MapPin, Menu } from 'lucide-react';
import useDarkMode from './hooks/useDarkMode';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';

function App() {
  const [activeTab, setActiveTab] = useState<'list' | 'new'>('new');
  const [locationCount, setLocationCount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isDark, setIsDark } = useDarkMode();
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);
  
  useEffect(() => {
    updateLocationCount();
  }, []);
  
  const updateLocationCount = () => {
    const locations = getLocations();
    setLocationCount(locations.length);
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
    await supabase.auth.signOut();
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
              <Compass size={24} className="mr-2 shrink-0" />
              <h1 className="text-xl sm:text-2xl font-bold">MCCI GPS</h1>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} />
              <ExportButton />
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
      <main className="container mx-auto px-4 py-6">
        <div className="flex justify-center mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-full shadow-md p-1 inline-flex transition-colors">
            <button
              onClick={() => setActiveTab('new')}
              className={`flex items-center px-3 sm:px-6 py-2 rounded-full transition-colors whitespace-nowrap ${
                activeTab === 'new'
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Plus size={18} className="mr-1 sm:mr-2 shrink-0" />
              <span>New</span>
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center px-3 sm:px-6 py-2 rounded-full transition-colors whitespace-nowrap ${
                activeTab === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <MapPin size={18} className="mr-1 sm:mr-2 shrink-0" />
              <span>Saved</span>
              {locationCount > 0 && (
                <span className={`ml-1 sm:ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === 'list'
                    ? 'bg-white text-blue-600'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                }`}>
                  {locationCount}
                </span>
              )}
            </button>
          </div>
        </div>
        
        <div className="max-w-8xl mx-auto" style={{ minHeight: '70vh' }}>
          {activeTab === 'new' ? (
            <LocationForm onLocationSaved={handleLocationSaved} />
          ) : (
            <LocationList />
          )}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-800 dark:bg-gray-950 text-gray-300 py-4 sm:py-6 mt-auto transition-colors">
        <div className="container mx-auto px-4 text-center">
          <p>MCCI GPS Collector &copy; {new Date().getFullYear()}</p>
          <p className="text-xs sm:text-sm mt-2 text-gray-400">
            Logged in as {user.email}
          </p>
        </div>
      </footer>

      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onDeleteAll={handleDeleteAll}
        onSignOut={handleSignOut}
      />

      {/* Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default App