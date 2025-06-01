import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Location } from '../types';
import useGeolocation from '../hooks/useGeolocation';
import GroupSelector from './GroupSelector';
import TitleSelector from './TitleSelector';
import { saveLocation } from '../services/locationService';
import { MapPin, Save, Crosshair, Map as MapIcon } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';

interface LocationFormProps {
  onLocationSaved: () => void;
}

const DraggableMarker: React.FC<{
  position: [number, number];
  onPositionChange: (lat: number, lng: number) => void;
}> = ({ position, onPositionChange }) => {
  const [markerPosition, setMarkerPosition] = useState(position);

  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setMarkerPosition([lat, lng]);
      onPositionChange(lat, lng);
    },
  });

  useEffect(() => {
    setMarkerPosition(position);
    map.flyTo(position, map.getZoom());
  }, [position, map]);

  return (
    <Marker
      position={markerPosition}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const position = marker.getLatLng();
          setMarkerPosition([position.lat, position.lng]);
          onPositionChange(position.lat, position.lng);
        },
      }}
    />
  );
};

const LocationForm: React.FC<LocationFormProps> = ({ onLocationSaved }) => {
  const { latitude, longitude, loading, error, getLocation } = useGeolocation(2000);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('default');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [titleError, setTitleError] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<[number, number]>([0, 0]);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (latitude && longitude) {
      setCurrentPosition([latitude, longitude]);
    }
  }, [latitude, longitude]);

  const handlePositionChange = (lat: number, lng: number) => {
    setCurrentPosition([lat, lng]);
  };

  const handleRecenterPosition = () => {
    if (latitude && longitude) {
      setCurrentPosition([latitude, longitude]);
    } else {
      getLocation();
    }
  };
  
  const handleSaveLocation = () => {
    if (!currentPosition[0] || !currentPosition[1]) {
      return;
    }

    if (!title.trim()) {
      setTitleError(true);
      return;
    }
    
    setIsSaving(true);
    setTitleError(false);
    
    const newLocation: Location = {
      id: uuidv4(),
      title: title.trim(),
      latitude: currentPosition[0],
      longitude: currentPosition[1],
      description: description.trim(),
      tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
      groupId: selectedGroupId,
      createdAt: Date.now()
    };
    
    saveLocation(newLocation);
    
    // Reset form
    setTitle('');
    setDescription('');
    setTags('');
    setShowMap(false);
    
    setIsSaving(false);
    setShowSuccess(true);
    
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
    
    onLocationSaved();
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Save Current Location</h2>
      
      <div className="space-y-4">
        <div>
          <TitleSelector onTitleSelect={setTitle} value={title} />
          <div className="mt-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setTitleError(false);
              }}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                titleError ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter a title for this location"
            />
            {titleError && (
              <p className="mt-1 text-sm text-red-500">Title is required</p>
            )}
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <MapPin className="text-blue-600 dark:text-blue-400 mr-2" size={20} />
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Location</h3>
            </div>
            <button
              onClick={() => setShowMap(!showMap)}
              className="flex items-center px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-800/40 border border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-600 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            >
              <MapIcon size={16} className="mr-1.5" />
              {showMap ? 'Hide Map' : 'Show Map'}
            </button>
          </div>

          {/* Coordinates display */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-md text-gray-500 dark:text-gray-400 mb-1">Latitude</p>
              <div className="font-mono text-md font-medium dark:text-white">
                {currentPosition[0].toFixed(7)}
              </div>
            </div>
            <div>
              <p className="text-md text-gray-500 dark:text-gray-400 mb-1">Longitude</p>
              <div className="font-mono text-md font-medium dark:text-white">
                {currentPosition[1].toFixed(7)}
              </div>
            </div>
          </div>
          
          {error ? (
            <div className="text-red-500 dark:text-red-400 mb-2">
              Error: {error}
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-pulse flex space-x-4">
                <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-24"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-24"></div>
              </div>
            </div>
          ) : (
            <>
              {showMap && (
                <div className="relative">
                  <div className="h-[300px] mb-4 rounded-lg overflow-hidden">
                    <MapContainer
                      center={currentPosition}
                      zoom={16}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <DraggableMarker
                        position={currentPosition}
                        onPositionChange={handlePositionChange}
                      />
                    </MapContainer>
                  </div>
                  <button
                    onClick={handleRecenterPosition}
                    className="absolute top-4 right-4 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    style={{ zIndex: 400 }}
                    title="Recenter to current position"
                  >
                    <Crosshair size={20} className="text-blue-600 dark:text-blue-400" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={1}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Add a description..."
          />
        </div>
        
        <div>
          <div className="flex items-center mb-1">
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tags
            </label>
          </div>
          <input
            type="text"
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Enter tags separated by commas"
          />
        </div>
        
        <GroupSelector 
          selectedGroupId={selectedGroupId} 
          onGroupSelect={setSelectedGroupId} 
        />
        
        <button
          onClick={handleSaveLocation}
          disabled={!currentPosition[0] || !currentPosition[1] || isSaving}
          className={`w-full flex items-center justify-center px-4 py-3 rounded-md font-medium text-white transition-all ${
            !currentPosition[0] || !currentPosition[1] || isSaving
              ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
          }`}
        >
          <Save size={18} className="mr-2" />
          {isSaving ? 'Saving...' : 'Save Location'}
        </button>
        
        {showSuccess && (
          <div className="mt-4 p-3 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 rounded-md animate-fade-in">
            Location saved successfully!
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationForm;