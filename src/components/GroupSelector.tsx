import React, { useState, useEffect } from 'react';
import { Group } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { getGroups, saveGroup, deleteGroup } from '../services/locationService';
import { PlusCircle, Trash2, X, Check, Info } from 'lucide-react';
import { showAlert, showHtmlConfirm } from '../utils/alertUtils.tsx';

// Expanded set of colors that work well in both light and dark modes
const RECOMMENDED_COLORS = [
  // Blues
  '#3B82F6', // Blue
  '#60A5FA', // Light Blue
  '#2563EB', // Royal Blue
  '#1D4ED8', // Dark Blue
  '#0EA5E9', // Sky Blue
  '#0284C7', // Sky Blue 600
  '#0369A1', // Sky Blue 700
  '#075985', // Sky Blue 800
  
  // Greens
  '#10B981', // Green
  '#34D399', // Light Green
  '#059669', // Emerald
  '#16A34A', // Forest Green
  '#14B8A6', // Teal
  '#0D9488', // Teal 600
  '#0F766E', // Teal 700
  '#115E59', // Teal 800
  
  // Warm Colors
  '#F59E0B', // Amber
  '#F97316', // Orange
  '#FB923C', // Light Orange
  '#EA580C', // Dark Orange
  '#DC2626', // Red
  '#B91C1C', // Red 700
  '#991B1B', // Red 800
  '#7F1D1D', // Red 900
  
  // Purples/Pinks
  '#8B5CF6', // Purple
  '#A855F7', // Violet
  '#6366F1', // Indigo
  '#4F46E5', // Indigo 600
  '#4338CA', // Indigo 700
  '#3730A3', // Indigo 800
  '#EC4899', // Pink
  '#DB2777', // Pink 600
  
  // Other Colors
  '#06B6D4', // Cyan
  '#0891B2', // Dark Cyan
  '#84CC16', // Lime
  '#65A30D', // Lime 600
  '#4D7C0F', // Lime 700
  '#CA8A04', // Yellow
  '#A16207', // Yellow 700
  '#BE123C', // Rose
  '#9F1239', // Rose 700
  '#881337', // Rose 800
];

interface GroupSelectorProps {
  selectedGroupId: string;
  onGroupSelect: (groupId: string) => void;
}

const GroupSelector: React.FC<GroupSelectorProps> = ({ selectedGroupId, onGroupSelect }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#3B82F6');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showColorPalette, setShowColorPalette] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setIsLoading(true);
    try {
      const fetchedGroups = await getGroups();
      setGroups(fetchedGroups);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddGroup = async () => {
    if (newGroupName.trim()) {
      const newGroup: Group = {
        id: uuidv4(),
        name: newGroupName.trim(),
        color: newGroupColor,
      };
      
      setIsSaving(true);
      try {
        await saveGroup(newGroup);
        await loadGroups();
        onGroupSelect(newGroup.id);
        setNewGroupName('');
        setShowAddForm(false);
      } catch (error) {
        console.error('Error saving group:', error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleDeleteClick = (groupId: string) => {
    setShowDeleteConfirm(groupId);
  };

  const handleDeleteConfirm = async (groupId: string) => {
    if (groupId === 'default') {
      showAlert('Cannot Delete', 'The default group cannot be deleted');
      return;
    }
    
    showHtmlConfirm(
      'Confirm Group Deletion',
      `Are you sure you want to delete the group <strong class="font-bold text-red-600 dark:text-red-400">${groups.find(g => g.id === groupId)?.name}</strong>? All locations in this group will be moved to the default group.`,
      async () => {
        setIsDeleting(true);
        try {
          await deleteGroup(groupId);
          await loadGroups();
          if (selectedGroupId === groupId) {
            onGroupSelect('default');
          }
          setShowDeleteConfirm(null);
        } catch (error) {
          console.error('Error deleting group:', error);
          
          // Check if the error is related to foreign key constraint
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes('foreign key constraint') || 
              errorMessage.includes('violates foreign key') || 
              errorMessage.includes('referenced by')) {
            showAlert(
              'Cannot Delete Group', 
              'This group has locations associated with it. Please delete or move these locations to another group first.'
            );
          } else {
            showAlert('Error', 'Failed to delete the group. Some locations are already in this group. Please move them to another group first or delete these associated locations first.');
          }
        } finally {
          setIsDeleting(false);
          setShowDeleteConfirm(null);
        }
      },
      () => setShowDeleteConfirm(null),
      'Delete',
      'Cancel',
      true
    );
  };

  const LoadingPlaceholder = () => (
    <div className="flex items-center justify-center py-4">
      <div className="animate-pulse flex space-x-4">
        <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-24"></div>
        <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-24"></div>
      </div>
    </div>
  );

  // Add this function to check color contrast
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

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Groups</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors flex items-center"
        >
          <PlusCircle size={16} className="mr-1" />
          <span>Add Group</span>
        </button>
      </div>
      
      {showAddForm && (
        <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-md mb-4 animate-fade-in">
          <div className="mb-3">
            <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Group Name
            </label>
            <input
              type="text"
              id="groupName"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="Enter group name"
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Group Color
            </label>
            
            <div className="flex items-center mb-2">
              <div 
                className="w-10 h-10 rounded-md mr-3 border border-gray-300 dark:border-gray-600"
                style={{ backgroundColor: newGroupColor }}
              ></div>
              
              <div className="flex-1">
                <div 
                  className="px-3 py-2 rounded-md text-center text-sm font-medium"
                  style={{ 
                    backgroundColor: newGroupColor,
                    color: getTextColorForBackground(newGroupColor)
                  }}
                >
                  Preview Text
                </div>
              </div>
            </div>
            
            <div className="mt-2 p-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800">
              <div className="flex items-center mb-2">
                <Info size={14} className="text-gray-500 dark:text-gray-400 mr-2" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Select a color for your group
                </span>
              </div>
              <div className="grid grid-cols-8 md:grid-cols-12 gap-2">
                {RECOMMENDED_COLORS.map(color => (
                  <div
                    key={color}
                    className={`w-8 h-8 rounded-md cursor-pointer border hover:scale-110 transition-transform ${
                      newGroupColor === color ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-gray-800' : 'border-gray-200 dark:border-gray-700'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewGroupColor(color)}
                  ></div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleAddGroup}
              disabled={isSaving}
              className="px-4 py-2 text-sm bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Adding...' : 'Add Group'}
            </button>
          </div>
        </div>
      )}
      
      {isLoading || isDeleting ? (
        <LoadingPlaceholder />
      ) : (
        <div className="flex flex-wrap gap-2">
          {groups.map((group) => (
            <div key={group.id} className="flex items-center">
              <button
                onClick={() => onGroupSelect(group.id)}
                className={`px-4 py-2 ${group.isOwner ? 'rounded-l-full' : 'rounded-full'} 
                  text-xs font-medium transition-all ${
                  selectedGroupId === group.id
                    ? group.id === 'default' 
                      ? 'bg-gray-700 dark:bg-gray-200 text-white dark:text-gray-900' 
                      : 'bg-opacity-100 text-gray-100'
                    : group.id === 'default'
                      ? 'bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-600'
                      : 'bg-opacity-20 hover:bg-opacity-30 text-gray-800 dark:text-gray-200'
                }`}
                style={{
                  backgroundColor: selectedGroupId === group.id 
                    ? (group.id === 'default' ? undefined : group.color) 
                    : (group.id === 'default' ? undefined : `${group.color}30`),
                  borderWidth: '1px',
                  borderColor: selectedGroupId === group.id 
                    ? (group.id === 'default' ? '#4B5563' : group.color) 
                    : (group.id === 'default' ? '#9CA3AF' : group.color),
                  borderRightWidth: group.id === 'default' ? '1px' : '0',
                  borderRadius: group.id === 'default' ? '9999px' : undefined,
                }}
              >
                {group.name}
              </button>
              {group.id !== 'default' && (
                <div className="relative">
                  {showDeleteConfirm === group.id ? (
                    <div className="flex">
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors border border-l-0"
                        style={{ borderColor: group.color }}
                      >
                        <X size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteConfirm(group.id)}
                        className="p-2 rounded-r-full text-red-500 hover:text-red-700 transition-colors border border-l-0"
                        style={{ borderColor: group.color }}
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  ) : (
                    // Only show delete button if user owns the group
                    group.isOwner && (
                      <button
                        onClick={() => handleDeleteClick(group.id)}
                        className={`p-2 rounded-r-full transition-all border border-l-0 hover:bg-red-50 dark:hover:bg-red-900/20 ${
                          selectedGroupId === group.id
                            ? 'text-white bg-opacity-100'
                            : 'text-red-500 bg-opacity-20'
                        }`}
                        style={{
                          backgroundColor: selectedGroupId === group.id ? group.color : undefined,
                          borderColor: group.color,
                        }}
                        title="Delete group"
                      >
                        <Trash2 size={15} />
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GroupSelector;

