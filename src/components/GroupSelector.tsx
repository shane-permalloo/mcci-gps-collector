import React, { useState, useEffect } from 'react';
import { Group } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { getGroups, saveGroup, deleteGroup } from '../services/locationService';
import { PlusCircle, Trash2, X, Check } from 'lucide-react';
import { showAlert, showHtmlConfirm } from '../utils/alertUtils.tsx';

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
        } finally {
          setIsDeleting(false);
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
            <label htmlFor="groupColor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Group Color
            </label>
            <input
              type="color"
              id="groupColor"
              value={newGroupColor}
              onChange={(e) => setNewGroupColor(e.target.value)}
              className="w-full h-10 cursor-pointer rounded-md"
            />
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
                        <Trash2 size={18} />
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

