import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { ObjectType, ScheduledItem, WeekData, TimeCategory, IndividualTodo } from '../types';
import { OpenAIService } from '../services/openai';
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
  clearAllAppData,
  exportObjectsData,
  exportWeekData,
  exportAnalyticsData,
  importObjectsData,
  importWeekData,
  importAnalyticsData
} from '../utils/storage';

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
  // Initialize state from localStorage
  const [objects, setObjects] = useState<ObjectType[]>(() => loadObjects());
  const [scheduledItems, setScheduledItems] = useState<ScheduledItem[]>(() => loadScheduledItems());
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => loadCurrentWeekStart());

  // AI Settings - load from localStorage
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

  // Persist objects to localStorage whenever they change
  useEffect(() => {
    saveObjects(objects);
  }, [objects]);

  // Persist scheduled items to localStorage whenever they change
  useEffect(() => {
    saveScheduledItems(scheduledItems);
  }, [scheduledItems]);

  // Persist current week start to localStorage whenever it changes
  useEffect(() => {
    saveCurrentWeekStart(currentWeekStart);
  }, [currentWeekStart]);

  // Update OpenAI service when settings change
  useEffect(() => {
    if (aiApiKey) {
      setOpenAIService(new OpenAIService(aiApiKey, aiModel));
    } else {
      setOpenAIService(null);
    }
  }, [aiApiKey, aiModel]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addObject = (object: ObjectType) => {
    setObjects(prev => {
      const newObjects = [...prev, object];
      return newObjects;
    });
  };

  const updateObject = (id: string, object: ObjectType) => {
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
  };

  const deleteObject = (id: string) => {
    setObjects(prev => {
      const newObjects = prev.filter(obj => obj.id !== id);
      return newObjects;
    });
    
    // Remove any scheduled items that reference this object
    setScheduledItems(prev => {
      const newScheduledItems = prev.filter(item => item.objectId !== id);
      return newScheduledItems;
    });
  };

  const addScheduledItem = (item: ScheduledItem) => {
    setScheduledItems(prev => {
      const newScheduledItems = [...prev, item];
      return newScheduledItems;
    });
  };

  const updateScheduledItem = (id: string, updates: Partial<ScheduledItem>) => {
    setScheduledItems(prev => {
      const newScheduledItems = prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      );
      return newScheduledItems;
    });
  };

  const deleteScheduledItem = (id: string) => {
    setScheduledItems(prev => {
      const newScheduledItems = prev.filter(item => item.id !== id);
      return newScheduledItems;
    });
  };

  const moveScheduledItem = (id: string, newDate: string, newTimeCategory: TimeCategory, newOrder: number) => {
    setScheduledItems(prev => {
      const newScheduledItems = prev.map(item => 
        item.id === id 
          ? { ...item, date: newDate, timeCategory: newTimeCategory, order: newOrder }
          : item
      );
      return newScheduledItems;
    });
  };

  const toggleItemCompletion = (scheduledItemId: string, itemId?: string) => {
    setScheduledItems(prev => {
      const newScheduledItems = prev.map(scheduledItem => {
        if (scheduledItem.id !== scheduledItemId) return scheduledItem;

        const data = { ...scheduledItem.data };
        
        if (data.type === 'individualTodo') {
          (data as IndividualTodo).completed = !(data as IndividualTodo).completed;
        } else if (data.type === 'todoList' && itemId) {
          const todoList = data as any;
          todoList.items = todoList.items.map((item: any) => 
            item.id === itemId ? { ...item, completed: !item.completed } : item
          );
        } else if (data.type === 'workout' && itemId) {
          const workout = data as any;
          workout.exercises = workout.exercises.map((exercise: any) => 
            exercise.id === itemId ? { ...exercise, completed: !exercise.completed } : exercise
          );
        }

        return { ...scheduledItem, data };
      });
      return newScheduledItems;
    });
  };

  const setAISettings = (apiKey: string, model: string) => {
    setAiApiKey(apiKey);
    setAiModel(model);
    
    // Save to localStorage
    saveAISettings(apiKey, model);
  };

  const processAIResponse = (
    newObjects?: ObjectType[], 
    scheduleItems?: Array<{objectId: string, date: string, timeCategory: TimeCategory}>
  ) => {
    // Add new objects
    if (newObjects && newObjects.length > 0) {
      newObjects.forEach(obj => {
        // Ensure the object has a proper createdAt date
        const objectWithDate = {
          ...obj,
          createdAt: new Date(obj.createdAt)
        };
        addObject(objectWithDate);
      });
    }

    // Schedule items
    if (scheduleItems && scheduleItems.length > 0) {
      scheduleItems.forEach(scheduleRequest => {
        // Find the object to schedule (either from new objects or existing ones)
        const objectToSchedule = newObjects?.find(obj => obj.id === scheduleRequest.objectId) ||
                                 objects.find(obj => obj.id === scheduleRequest.objectId);
        
        if (objectToSchedule) {
          const scheduledItem: ScheduledItem = {
            id: generateId(),
            objectId: scheduleRequest.objectId,
            objectType: objectToSchedule.type,
            date: scheduleRequest.date,
            timeCategory: scheduleRequest.timeCategory,
            order: 1, // Will be adjusted by the system
            data: objectToSchedule
          };
          
          addScheduledItem(scheduledItem);
        }
      });
    }
  };

  // Data management functions
  const exportData = () => {
    return exportAppState();
  };

  const importData = (data: any): boolean => {
    try {
      const success = importAppState(data);
      if (success) {
        // Reload state from localStorage after import
        setObjects(loadObjects());
        setScheduledItems(loadScheduledItems());
        setCurrentWeekStart(loadCurrentWeekStart());
        
        const { apiKey, model } = loadAISettings();
        setAiApiKey(apiKey);
        setAiModel(model);
      }
      return success;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  };

  // Tab-specific data management functions
  const exportTabData = (tab: 'objects' | 'week' | 'analytics') => {
    switch (tab) {
      case 'objects':
        return exportObjectsData();
      case 'week':
        return exportWeekData();
      case 'analytics':
        return exportAnalyticsData();
      default:
        return exportAppState();
    }
  };

  const importTabData = (tab: 'objects' | 'week' | 'analytics', data: any): boolean => {
    try {
      let success = false;
      
      switch (tab) {
        case 'objects':
          success = importObjectsData(data);
          if (success) {
            setObjects(loadObjects());
          }
          break;
        case 'week':
          success = importWeekData(data);
          if (success) {
            setScheduledItems(loadScheduledItems());
            setCurrentWeekStart(loadCurrentWeekStart());
          }
          break;
        case 'analytics':
          success = importAnalyticsData(data);
          if (success) {
            setObjects(loadObjects());
            setScheduledItems(loadScheduledItems());
            setCurrentWeekStart(loadCurrentWeekStart());
          }
          break;
        default:
          success = importAppState(data);
          if (success) {
            setObjects(loadObjects());
            setScheduledItems(loadScheduledItems());
            setCurrentWeekStart(loadCurrentWeekStart());
            const { apiKey, model } = loadAISettings();
            setAiApiKey(apiKey);
            setAiModel(model);
          }
      }
      
      return success;
    } catch (error) {
      console.error('Failed to import tab data:', error);
      return false;
    }
  };

  const clearAllData = () => {
    try {
      clearAllAppData();
      
      // Reset state to defaults
      setObjects([]);
      setScheduledItems([]);
      setCurrentWeekStart(() => {
        const today = new Date();
        const monday = new Date(today);
        monday.setDate(today.getDate() - today.getDay() + 1);
        monday.setHours(0, 0, 0, 0);
        return monday;
      });
      setAiApiKey('');
      setAiModel('gpt-4o-mini');
      setOpenAIService(null);
    } catch (error) {
      console.error('Failed to clear all data:', error);
    }
  };

  const getWeekData = (weekStart: Date): WeekData => {
    const weekData: WeekData = {};
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      weekData[dateStr] = scheduledItems
        .filter(item => item.date === dateStr)
        .sort((a, b) => {
          const categoryOrder = { Morning: 0, Afternoon: 1, Evening: 2, Night: 3 };
          const categoryDiff = categoryOrder[a.timeCategory] - categoryOrder[b.timeCategory];
          return categoryDiff !== 0 ? categoryDiff : a.order - b.order;
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
    getWeekData,
    getObjectById
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}; 