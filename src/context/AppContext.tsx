import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { ObjectType, ScheduledItem, TimeCategory, WeekData, IndividualTodo } from '../types';
import { 
  saveObjects, 
  loadObjects, 
  saveScheduledItems, 
  loadScheduledItems, 
  saveCurrentWeekStart, 
  loadCurrentWeekStart,
  saveAISettings,
  loadAISettings,
  exportAppState,
  importAppState,
  exportObjectsData,
  exportWeekData,
  exportAnalyticsData,
  importObjectsData,
  importWeekData,
  importAnalyticsData,
  clearAllAppData,
  clearUserData
} from '../utils/storage';
import { useAuth } from './AuthContext';
import { OpenAIService } from '../services/openai';
import { objectsApi } from '../services/api';
import { weekObjectsApi } from '../services/api';
import { checkApiHealth } from '../services/api';

interface AppContextType {
  // Objects state
  objects: ObjectType[];
  setObjects: React.Dispatch<React.SetStateAction<ObjectType[]>>;
  addObject: (object: ObjectType) => void;
  updateObject: (id: string, object: ObjectType) => void;
  deleteObject: (id: string) => void;
  
  // Scheduled items state
  scheduledItems: ScheduledItem[];
  setScheduledItems: React.Dispatch<React.SetStateAction<ScheduledItem[]>>;
  addScheduledItem: (item: ScheduledItem) => void;
  updateScheduledItem: (id: string, updates: Partial<ScheduledItem>) => void;
  deleteScheduledItem: (id: string) => void;
  moveScheduledItem: (id: string, newDate: string, newTimeCategory: TimeCategory, newOrder: number) => void;
  toggleItemCompletion: (scheduledItemId: string, itemId?: string) => void;
  
  // Week navigation
  currentWeekStart: Date;
  setCurrentWeekStart: React.Dispatch<React.SetStateAction<Date>>;
  
  // AI Settings
  aiApiKey: string;
  aiModel: string;
  setAISettings: (apiKey: string, model: string) => void;
  openAIService: OpenAIService | null;
  
  // AI Actions
  processAIResponse: (objects?: ObjectType[], scheduleItems?: Array<{objectId: string, date: string, timeCategory: TimeCategory}>) => void;
  
  // Data management
  exportData: () => any;
  importData: (data: any) => boolean;
  clearAllData: () => void;
  
  // Tab-specific data management
  exportTabData: (tab: 'objects' | 'week' | 'analytics') => any;
  importTabData: (tab: 'objects' | 'week' | 'analytics', data: any) => boolean;
  
  // Database sync
  syncToDatabase: () => Promise<{ success: boolean; error?: string }>;
  syncFromDatabase: () => Promise<{ success: boolean; error?: string }>;
  isOnline: boolean;
  
  // Utility functions
  getWeekData: (weekStart: Date) => WeekData;
  getObjectById: (id: string) => ObjectType | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const { user, isOnline: authIsOnline } = useAuth();
  
  // Initialize state - will be loaded per user
  const [objects, setObjects] = useState<ObjectType[]>([]);
  const [scheduledItems, setScheduledItems] = useState<ScheduledItem[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date());
  const [isOnline, setIsOnline] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(user?.id || null);

  // AI Settings - load from localStorage (not user-specific)
  const [aiApiKey, setAiApiKey] = useState(() => {
    const { apiKey } = loadAISettings();
    return apiKey;
  });
  const [aiModel, setAiModel] = useState(() => {
    const { model } = loadAISettings();
    return model;
  });
  const [openAIService, setOpenAIService] = useState<OpenAIService | null>(() => {
    const { apiKey, model } = loadAISettings();
    if (apiKey) {
      return new OpenAIService(apiKey, model);
    }
    return null;
  });

  // Load user-specific data when user changes
  useEffect(() => {
    if (!user) {
      // User logged out - clear all data
      setObjects([]);
      setScheduledItems([]);
      setCurrentWeekStart(new Date());
      setCurrentUserId(null);
    } else if (currentUserId !== user.id) {
      // Different user logged in or first time login - load their data
      setObjects(loadObjects(user.id));
      setScheduledItems(loadScheduledItems(user.id));
      setCurrentWeekStart(loadCurrentWeekStart(user.id));
      setCurrentUserId(user.id);
    }
  }, [user, currentUserId]);

  // Check API availability and sync data when user is authenticated
  useEffect(() => {
    const checkAndSync = async () => {
      if (user && authIsOnline) {
        const apiAvailable = await checkApiHealth();
        setIsOnline(apiAvailable);
        
        if (apiAvailable) {
          // Auto-sync from database when user logs in
          await syncFromDatabase();
        }
      } else {
        setIsOnline(false);
      }
    };

    checkAndSync();
  }, [user, authIsOnline]);

  // Persist objects to localStorage whenever they change (user-specific)
  useEffect(() => {
    if (user) {
      saveObjects(objects, user.id);
    }
  }, [objects, user]);

  // Persist scheduled items to localStorage whenever they change (user-specific)
  useEffect(() => {
    if (user) {
      saveScheduledItems(scheduledItems, user.id);
    }
  }, [scheduledItems, user]);

  // Persist current week start to localStorage whenever it changes (user-specific)
  useEffect(() => {
    if (user) {
      saveCurrentWeekStart(currentWeekStart, user.id);
    }
  }, [currentWeekStart, user]);

  // Update OpenAI service when settings change
  useEffect(() => {
    if (aiApiKey) {
      setOpenAIService(new OpenAIService(aiApiKey, aiModel));
    } else {
      setOpenAIService(null);
    }
  }, [aiApiKey, aiModel]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Database sync functions
  const syncToDatabase = async (): Promise<{ success: boolean; error?: string }> => {
    if (!user || !isOnline) {
      return { success: false, error: 'User not authenticated or offline' };
    }

    try {
      // Sync objects
      const objectsResponse = await objectsApi.bulkSync(objects);
      if (!objectsResponse.success) {
        return { success: false, error: `Failed to sync objects: ${objectsResponse.error}` };
      }

      // Sync scheduled items
      const weekObjectsResponse = await weekObjectsApi.bulkSync(scheduledItems);
      if (!weekObjectsResponse.success) {
        return { success: false, error: `Failed to sync week objects: ${weekObjectsResponse.error}` };
      }

      return { success: true };
    } catch (error) {
      console.error('Sync to database failed:', error);
      return { success: false, error: 'Network error during sync' };
    }
  };

  const syncFromDatabase = async (): Promise<{ success: boolean; error?: string }> => {
    if (!user || !isOnline) {
      return { success: false, error: 'User not authenticated or offline' };
    }

    try {
      // Fetch objects from database
      const objectsResponse = await objectsApi.getObjects();
      if (!objectsResponse.success) {
        return { success: false, error: `Failed to fetch objects: ${objectsResponse.error}` };
      }

      // Fetch scheduled items from database
      const weekObjectsResponse = await weekObjectsApi.getWeekObjects();
      if (!weekObjectsResponse.success) {
        return { success: false, error: `Failed to fetch week objects: ${weekObjectsResponse.error}` };
      }

      // Update local state with database data
      if (objectsResponse.data) {
        const processedObjects = objectsResponse.data.map(obj => ({
          ...obj,
          createdAt: new Date(obj.createdAt)
        }));
        setObjects(processedObjects);
      }

      if (weekObjectsResponse.data) {
        const processedScheduledItems = weekObjectsResponse.data.map(item => ({
          ...item,
          data: {
            ...item.data,
            createdAt: new Date(item.data.createdAt)
          }
        }));
        setScheduledItems(processedScheduledItems);
      }

      return { success: true };
    } catch (error) {
      console.error('Sync from database failed:', error);
      return { success: false, error: 'Network error during sync' };
    }
  };

  // Enhanced object operations with database sync
  const addObject = async (object: ObjectType) => {
    setObjects(prev => {
      const newObjects = [...prev, object];
      return newObjects;
    });

    // Sync to database if online
    if (user && isOnline) {
      try {
        await objectsApi.createObject(object);
      } catch (error) {
        console.error('Failed to sync new object to database:', error);
      }
    }
  };

  const updateObject = async (id: string, object: ObjectType) => {
    setObjects(prev => {
      const newObjects = prev.map(obj => obj.id === id ? object : obj);
      return newObjects;
    });
    
    // Also update any scheduled items that reference this object
    setScheduledItems(prev => {
      const newScheduledItems = prev.map(item => 
        item.objectId === id ? { ...item, data: object } : item
      );
      return newScheduledItems;
    });

    // Sync to database if online
    if (user && isOnline) {
      try {
        await objectsApi.updateObject(object);
      } catch (error) {
        console.error('Failed to sync updated object to database:', error);
      }
    }
  };

  const deleteObject = async (id: string) => {
    setObjects(prev => {
      const newObjects = prev.filter(obj => obj.id !== id);
      return newObjects;
    });
    
    // Remove any scheduled items that reference this object
    setScheduledItems(prev => {
      const newScheduledItems = prev.filter(item => item.objectId !== id);
      return newScheduledItems;
    });

    // Sync to database if online
    if (user && isOnline) {
      try {
        await objectsApi.deleteObject(id);
      } catch (error) {
        console.error('Failed to sync deleted object to database:', error);
      }
    }
  };

  // Enhanced scheduled item operations with database sync
  const addScheduledItem = async (item: ScheduledItem) => {
    setScheduledItems(prev => {
      const newScheduledItems = [...prev, item];
      return newScheduledItems;
    });

    // Sync to database if online
    if (user && isOnline) {
      try {
        await weekObjectsApi.createWeekObject(item);
      } catch (error) {
        console.error('Failed to sync new scheduled item to database:', error);
      }
    }
  };

  const updateScheduledItem = async (id: string, updates: Partial<ScheduledItem>) => {
    setScheduledItems(prev => {
      const newScheduledItems = prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      );
      return newScheduledItems;
    });

    // Sync to database if online
    if (user && isOnline) {
      try {
        const updatedItem = scheduledItems.find(item => item.id === id);
        if (updatedItem) {
          await weekObjectsApi.updateWeekObject({ ...updatedItem, ...updates });
        }
      } catch (error) {
        console.error('Failed to sync updated scheduled item to database:', error);
      }
    }
  };

  const deleteScheduledItem = async (id: string) => {
    setScheduledItems(prev => {
      const newScheduledItems = prev.filter(item => item.id !== id);
      return newScheduledItems;
    });

    // Sync to database if online
    if (user && isOnline) {
      try {
        await weekObjectsApi.deleteWeekObject(id);
      } catch (error) {
        console.error('Failed to sync deleted scheduled item to database:', error);
      }
    }
  };

  const moveScheduledItem = (id: string, newDate: string, newTimeCategory: TimeCategory, newOrder: number) => {
    updateScheduledItem(id, { date: newDate, timeCategory: newTimeCategory, order: newOrder });
  };

  const toggleItemCompletion = (scheduledItemId: string, itemId?: string) => {
    setScheduledItems(prev => {
      const newScheduledItems = prev.map(scheduledItem => {
        if (scheduledItem.id === scheduledItemId) {
          const updatedData = { ...scheduledItem.data };
          
          if (scheduledItem.objectType === 'workout' && itemId) {
            // Toggle exercise completion
            const workout = updatedData as any;
            workout.exercises = workout.exercises.map((exercise: any) => 
              exercise.id === itemId 
                ? { ...exercise, completed: !exercise.completed }
                : exercise
            );
          } else if (scheduledItem.objectType === 'todoList' && itemId) {
            // Toggle todo item completion
            const todoList = updatedData as any;
            todoList.items = todoList.items.map((item: any) => 
              item.id === itemId 
                ? { ...item, completed: !item.completed }
                : item
            );
          } else if (scheduledItem.objectType === 'individualTodo') {
            // Toggle individual todo completion
            const individualTodo = updatedData as IndividualTodo;
            individualTodo.completed = !individualTodo.completed;
          }
          
          return { ...scheduledItem, data: updatedData };
        }
        return scheduledItem;
      });
      return newScheduledItems;
    });

    // Sync to database if online
    if (user && isOnline) {
      try {
        const updatedItem = scheduledItems.find(item => item.id === scheduledItemId);
        if (updatedItem) {
          weekObjectsApi.updateWeekObject(updatedItem);
        }
      } catch (error) {
        console.error('Failed to sync completion toggle to database:', error);
      }
    }
  };

  const setAISettings = (apiKey: string, model: string) => {
    setAiApiKey(apiKey);
    setAiModel(model);
    saveAISettings(apiKey, model);
  };

  const processAIResponse = (
    newObjects?: ObjectType[], 
    scheduleItems?: Array<{objectId: string, date: string, timeCategory: TimeCategory}>
  ) => {
    if (newObjects && newObjects.length > 0) {
      setObjects(prev => {
        const existingIds = new Set(prev.map(obj => obj.id));
        const uniqueNewObjects = newObjects.filter(obj => !existingIds.has(obj.id));
        return [...prev, ...uniqueNewObjects];
      });
    }

    if (scheduleItems && scheduleItems.length > 0) {
      const newScheduledItems: ScheduledItem[] = scheduleItems.map(item => {
        const objectData = objects.find(obj => obj.id === item.objectId);
        if (!objectData) {
          throw new Error(`Object with id ${item.objectId} not found`);
        }

        return {
          id: generateId(),
          objectId: item.objectId,
          objectType: objectData.type,
          date: item.date,
          timeCategory: item.timeCategory,
          order: 0,
          data: objectData
        };
      });

      setScheduledItems(prev => [...prev, ...newScheduledItems]);
    }
  };

  const exportData = () => {
    return exportAppState();
  };

  const importData = (data: any): boolean => {
    return importAppState(data);
  };

  const exportTabData = (tab: 'objects' | 'week' | 'analytics') => {
    switch (tab) {
      case 'objects':
        return exportObjectsData();
      case 'week':
        return exportWeekData();
      case 'analytics':
        return exportAnalyticsData();
      default:
        return null;
    }
  };

  const importTabData = (tab: 'objects' | 'week' | 'analytics', data: any): boolean => {
    try {
      switch (tab) {
        case 'objects':
          return importObjectsData(data);
        case 'week':
          return importWeekData(data);
        case 'analytics':
          return importAnalyticsData(data);
        default:
          return false;
      }
    } catch (error) {
      console.error(`Error importing ${tab} data:`, error);
      return false;
    }
  };

  const clearAllData = () => {
    setObjects([]);
    setScheduledItems([]);
    setCurrentWeekStart(new Date());
    
    if (user) {
      // Clear user-specific data
      clearUserData(user.id);
    } else {
      // Clear all app data if no user is logged in
      clearAllAppData();
    }
  };

  const getWeekData = (weekStart: Date): WeekData => {
    const weekData: WeekData = {};
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      
      weekData[dateString] = scheduledItems
        .filter(item => item.date === dateString)
        .sort((a, b) => {
          const timeOrder = { 'Morning': 0, 'Afternoon': 1, 'Evening': 2, 'Night': 3 };
          const timeComparison = timeOrder[a.timeCategory] - timeOrder[b.timeCategory];
          return timeComparison !== 0 ? timeComparison : a.order - b.order;
        });
    }
    
    return weekData;
  };

  const getObjectById = (id: string): ObjectType | undefined => {
    return objects.find(obj => obj.id === id);
  };

  const value: AppContextType = {
    objects,
    setObjects,
    addObject,
    updateObject,
    deleteObject,
    scheduledItems,
    setScheduledItems,
    addScheduledItem,
    updateScheduledItem,
    deleteScheduledItem,
    moveScheduledItem,
    toggleItemCompletion,
    currentWeekStart,
    setCurrentWeekStart,
    aiApiKey,
    aiModel,
    setAISettings,
    openAIService,
    processAIResponse,
    exportData,
    importData,
    clearAllData,
    exportTabData,
    importTabData,
    syncToDatabase,
    syncFromDatabase,
    isOnline,
    getWeekData,
    getObjectById,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}; 