import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import { Location, Group } from '../types';
import { divIcon } from 'leaflet';

interface LocationMapProps {
  locations: Location[];
  groups: Group[];
  onLocationSelect?: (id: string) => void;
}

const LocationMap: React.FC<LocationMapProps> = ({ locations, groups, onLocationSelect }) => {
  const center = locations.length > 0
    ? [locations[0].latitude, locations[0].longitude]
    : [0, 0];

  const getGroupById = (id: string): Group => {
    return groups.find(group => group.id === id) || groups[0];
  };

  const createCustomIcon = (color: string) => {
    return divIcon({
      className: 'custom-div-icon',
      html: `
        <div style="
          background-color: ${color};
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  };

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .leaflet-popup-content-wrapper {
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .leaflet-popup-content {
        margin: 12px;
        min-width: 200px;
      }
      .leaflet-tooltip {
        padding: 6px 10px;
        border-radius: 4px;
        border: none;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="h-[calc(100vh-20rem)] min-h-[400px]">
        <MapContainer
          center={center as [number, number]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {locations.map((location) => {
            const group = getGroupById(location.groupId);
            return (
              <Marker
                key={location.id}
                position={[location.latitude, location.longitude]}
                icon={createCustomIcon(group.color)}
                eventHandlers={{
                  click: () => onLocationSelect?.(location.id),
                }}
              >
                <Tooltip permanent direction="top" offset={[0, -8]}>
                  {location.title}
                </Tooltip>
                <Popup>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">{location.title}</h3>
                    <div className="text-sm text-gray-600 mb-2">
                      <div>{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</div>
                      <div className="mt-1">
                        Group: <span style={{ color: group.color }}>{group.name}</span>
                      </div>
                    </div>
                    {location.description && (
                      <p className="text-sm text-gray-700 mt-2">{location.description}</p>
                    )}
                    {location.tags.length > 0 && (
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
        </MapContainer>
      </div>
    </div>
  );
};

export default LocationMap;