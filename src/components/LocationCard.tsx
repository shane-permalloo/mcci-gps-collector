import React, { useState } from 'react';
import { Location, Group } from '../types';
import { MapPin, Trash2, Edit2, X, Check, Info } from 'lucide-react';
import { updateLocation } from '../services/locationService';
import GroupSelector from './GroupSelector';
import { showHtmlConfirm } from '../utils/alertUtils.tsx';

interface LocationCardProps {
  location: Location;
  group: Group;
  onDelete: (id: string) => void;
  onUpdate: () => void;
}

const LocationCard: React.FC<LocationCardProps> = ({ location, group, onDelete, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(location.title);
  const [editedDescription, setEditedDescription] = useState(location.description);
  const [editedTags, setEditedTags] = useState((location.tags ?? []).join(', '));
  const [editedGroupId, setEditedGroupId] = useState(location.groupId);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [titleError, setTitleError] = useState(false);
  
  const formattedDate = new Date(location.createdAt).toLocaleString();
  
  // Use the isOwner property directly from the location object
  // Default to false if not provided
  const isOwner = location.isOwner === true;

  // console.log(`Location ${location.id} isOwner: ${isOwner}`);

  const handleSave = async () => {
    if (!editedTitle.trim()) {
      setTitleError(true);
      return;
    }

    const updatedLocation: Location = {
      ...location,
      title: editedTitle.trim(),
      description: editedDescription?.trim() ?? '',
      tags: editedTags.split(',').map(tag => tag.trim()).filter(Boolean),
      groupId: editedGroupId,
    };
    
    try {
      await updateLocation(updatedLocation);
      setIsEditing(false);
      setTitleError(false);
      // Call onUpdate to refresh the parent component
      onUpdate();
    } catch (error) {
      console.error('Error updating location:', error);
      alert('Failed to update location.');
    }
  };
  
  const handleCancel = () => {
    setEditedTitle(location.title);
    setEditedDescription(location.description);
    setEditedTags((location.tags ?? []).join(', '));
    setEditedGroupId(location.groupId);
    setIsEditing(false);
    setTitleError(false);
  };

  const handleDelete = () => {
    showHtmlConfirm(
      'Confirm deletion',
      `Are you sure you want to delete the location: <strong class="font-bold text-red-700 dark:text-red-400">${location.title}</strong>?`,
      () => {
        onDelete(location.id);
      },
      undefined,
      'Delete',
      'Cancel',
      true
    );
  };
  
  return (
    <div className="overflow-hidden transition-all hover:shadow-md bg-white dark:bg-gray-700 border-t-0 rounded-lg shadow border border-gray-200 dark:border-gray-600">
      <div 
        className="h-2" 
        style={{ backgroundColor: group.color }}
      />
      <div className="p-5">
        <div className="flex justify-between items-start gap-4 sm:flex-row flex-col">
          {isEditing ? (
            <div className="flex-1">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => {
                  setEditedTitle(e.target.value);
                  setTitleError(false);
                }}
                className={`w-full sm:mb-0 mb-3 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                  titleError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Enter title"
              />
              {titleError && (
                <p className="mt-1 text-sm text-red-500">Title is required</p>
              )}
            </div>
          ) : (
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white sm:mb-3 mb-0 flex-1 truncate">
              {location.title}
            </h3>
          )}
          {group.name !== 'Default' ? (
            <span 
              className="text-xs font-medium px-2 py-1 rounded-full shrink-0"
              style={{ 
                backgroundColor: group.color,
                color: getTextColorForBackground(group.color)
              }}
            >
              {group.name}
            </span>
          ) : 
            <span 
              className="text-xs font-medium px-2 py-1 rounded-full shrink-0 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-600"
            >
              {group.name}
            </span>
          }
        </div>
        
        <div className="flex items-center text-gray-600 dark:text-gray-400 my-3">
          <MapPin size={16} className="mr-1 flex-shrink-0" />
          <div className="font-mono text-sm space-x-2 overflow-x-auto">
            <span title="Latitude">{location.latitude.toFixed(7)}</span>
            <span>,</span>
            <span title="Longitude">{location.longitude.toFixed(7)}</span>
          </div>
        </div>
        
          {isEditing ? (
        <div className="flex items-start mb-3">
            <input
              type="text"
              value={editedTags}
              onChange={(e) => setEditedTags(e.target.value)}
              className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter tags separated by commas"
            />
            </div>
          ) : (
        <div className="flex items-start">
            <div className="flex flex-wrap gap-1">
              {(location.tags ?? []).map((tag, index) => (
                <span
                  key={index}
                  className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 text-xs px-2 py-1 rounded"
                >
                  {tag}
                </span>
              ))}
        </div>
            </div>
          )}

            
        {isEditing ? (
          <textarea
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            rows={1}
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white mb-3"
            placeholder="Add a description..."
          />
        ) : location.description && (
          <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{location.description}</p>
        )}

        {isEditing && (
          <div className="mb-3">
            <GroupSelector
              selectedGroupId={editedGroupId}
              onGroupSelect={setEditedGroupId}
            />
          </div>
        )}
        
        <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400">{formattedDate}</span>
          
          <div className="flex items-center gap-2">
            {!isOwner && (
              <div className="flex items-center text-amber-600 dark:text-amber-400 text-xs p-1">
                <Info size={14} className="mr-1" />
                <span>Shared location</span>
              </div>
            )}
            
            {isOwner && isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors p-1"
                  title="Cancel"
                >
                  <X size={16} />
                </button>
                <button
                  onClick={handleSave}
                  className="text-green-500 hover:text-green-700 transition-colors p-1"
                  title="Save changes"
                >
                  <Check size={16} />
                </button>
              </>
            ) : isOwner ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-blue-500 hover:text-blue-700 transition-colors p-1"
                  title="Edit location"
                >
                  <Edit2 size={16} />
                </button>
                {showDeleteConfirm ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors p-1"
                      title="Cancel delete"
                    >
                      <X size={16} />
                    </button>
                    <button
                      onClick={handleDelete}
                      className="text-red-500 hover:text-red-700 transition-colors p-1"
                      title="Confirm delete"
                    >
                      <Check size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-red-500 hover:text-red-700 transition-colors p-1"
                    title="Delete location"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationCard;

// Add this helper function to determine text color based on background color
const getTextColorForBackground = (bgColor: string) => {
  // Convert hex to RGB
  const hex = bgColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return white for dark backgrounds, black for light backgrounds
  return luminance > 0.5 ? '#000000' : '#FFFFFF';

};
