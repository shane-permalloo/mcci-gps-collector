import React, { useState } from 'react';
import { Location, Group } from '../types';
import { MapPin, Tag, Trash2, Edit2, X, Check } from 'lucide-react';
import { updateLocation } from '../services/locationService';
import GroupSelector from './GroupSelector';

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
  const [editedTags, setEditedTags] = useState(location.tags.join(', '));
  const [editedGroupId, setEditedGroupId] = useState(location.groupId);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [titleError, setTitleError] = useState(false);
  
  const formattedDate = new Date(location.createdAt).toLocaleString();
  
  const handleSave = () => {
    if (!editedTitle.trim()) {
      setTitleError(true);
      return;
    }

    const updatedLocation: Location = {
      ...location,
      title: editedTitle.trim(),
      description: editedDescription.trim(),
      tags: editedTags.split(',').map(tag => tag.trim()).filter(Boolean),
      groupId: editedGroupId,
    };
    
    updateLocation(updatedLocation);
    setIsEditing(false);
    setTitleError(false);
    onUpdate();
  };
  
  const handleCancel = () => {
    setEditedTitle(location.title);
    setEditedDescription(location.description);
    setEditedTags(location.tags.join(', '));
    setEditedGroupId(location.groupId);
    setIsEditing(false);
    setTitleError(false);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    onDelete(location.id);
    setShowDeleteConfirm(false);
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all hover:shadow-lg">
      <div 
        className="h-2" 
        style={{ backgroundColor: group.color }}
      />
      <div className="p-5">
        <div className="flex justify-between items-start gap-4">
          {isEditing ? (
            <div className="flex-1">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => {
                  setEditedTitle(e.target.value);
                  setTitleError(false);
                }}
                className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                  titleError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Enter title"
              />
              {titleError && (
                <p className="mt-1 text-sm text-red-500">Title is required</p>
              )}
            </div>
          ) : (
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2 flex-1 truncate">
              {location.title}
            </h3>
          )}
          <span 
            className="text-xs font-medium px-2 py-1 rounded-full shrink-0"
            style={{ 
              backgroundColor: `${group.color}20`,
              color: group.color,
              borderWidth: '1px',
              borderColor: group.color
            }}
          >
            {group.name}
          </span>
        </div>
        
        <div className="flex items-center text-gray-600 dark:text-gray-400 mb-3 mt-3">
          <MapPin size={16} className="mr-1 flex-shrink-0" />
          <div className="font-mono text-sm space-x-2 overflow-x-auto">
            <span title="Latitude">{location.latitude.toFixed(6)}</span>
            <span>,</span>
            <span title="Longitude">{location.longitude.toFixed(6)}</span>
          </div>
        </div>
        
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
        
        <div className="flex items-start mb-3">
          {isEditing ? (
            <input
              type="text"
              value={editedTags}
              onChange={(e) => setEditedTags(e.target.value)}
              className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter tags separated by commas"
            />
          ) : (
            <div className="flex flex-wrap gap-1">
              {location.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {isEditing && (
          <div className="mb-3">
            <GroupSelector
              selectedGroupId={editedGroupId}
              onGroupSelect={setEditedGroupId}
            />
          </div>
        )}
        
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400">{formattedDate}</span>
          
          <div className="flex items-center gap-2">
            {isEditing ? (
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
            ) : (
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
                      onClick={handleDeleteConfirm}
                      className="text-red-500 hover:text-red-700 transition-colors p-1"
                      title="Confirm delete"
                    >
                      <Check size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleDeleteClick}
                    className="text-red-500 hover:text-red-700 transition-colors p-1"
                    title="Delete location"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationCard;