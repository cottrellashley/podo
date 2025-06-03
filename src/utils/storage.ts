import type { ObjectType, ScheduledItem } from '../types';

// Storage keys - now user-specific
export const STORAGE_KEYS = {
  OBJECTS: 'podo_objects',
  SCHEDULED_ITEMS: 'podo_scheduled_items',
  CURRENT_WEEK_START: 'podo_current_week_start',
  AI_API_KEY: 'podo_ai_api_key',
  AI_MODEL: 'podo_ai_model',
  ASSISTANT_MESSAGES: 'podo_assistant_messages',
  ASSISTANT_CONVERSATION_HISTORY: 'podo_assistant_conversation_history'
} as const;

// Helper function to create user-specific storage keys
const getUserStorageKey = (baseKey: string, userId?: string): string => {
  if (!userId) {
    return baseKey; // Fallback to non-user-specific key
  }
  return `${baseKey}_${userId}`;
};

// Serialization helpers
export const serializeDate = (date: Date): string => {
  return date.toISOString();
};

export const deserializeDate = (dateString: string): Date => {
  return new Date(dateString);
};

// Generic storage functions with error handling
export const setStorageItem = <T>(key: string, value: T): boolean => {
  try {
    const serializedValue = JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
    return true;
  } catch (error) {
    console.error(`Failed to save to localStorage (${key}):`, error);
    return false;
  }
};

export const getStorageItem = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Failed to read from localStorage (${key}):`, error);
    return defaultValue;
  }
};

export const removeStorageItem = (key: string): boolean => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Failed to remove from localStorage (${key}):`, error);
    return false;
  }
};

// Specific storage functions for app data - now user-specific
export const saveObjects = (objects: ObjectType[], userId?: string): boolean => {
  const serializedObjects = objects.map(obj => ({
    ...obj,
    createdAt: serializeDate(obj.createdAt)
  }));
  const key = getUserStorageKey(STORAGE_KEYS.OBJECTS, userId);
  return setStorageItem(key, serializedObjects);
};

export const loadObjects = (userId?: string): ObjectType[] => {
  const key = getUserStorageKey(STORAGE_KEYS.OBJECTS, userId);
  const serializedObjects = getStorageItem<any[]>(key, []);
  return serializedObjects.map(obj => ({
    ...obj,
    createdAt: deserializeDate(obj.createdAt)
  }));
};

export const saveScheduledItems = (items: ScheduledItem[], userId?: string): boolean => {
  const serializedItems = items.map(item => ({
    ...item,
    data: {
      ...item.data,
      createdAt: serializeDate(item.data.createdAt)
    }
  }));
  const key = getUserStorageKey(STORAGE_KEYS.SCHEDULED_ITEMS, userId);
  return setStorageItem(key, serializedItems);
};

export const loadScheduledItems = (userId?: string): ScheduledItem[] => {
  const key = getUserStorageKey(STORAGE_KEYS.SCHEDULED_ITEMS, userId);
  const serializedItems = getStorageItem<any[]>(key, []);
  return serializedItems.map(item => ({
    ...item,
    data: {
      ...item.data,
      createdAt: deserializeDate(item.data.createdAt)
    }
  }));
};

export const saveCurrentWeekStart = (date: Date, userId?: string): boolean => {
  const key = getUserStorageKey(STORAGE_KEYS.CURRENT_WEEK_START, userId);
  return setStorageItem(key, serializeDate(date));
};

export const loadCurrentWeekStart = (userId?: string): Date => {
  const key = getUserStorageKey(STORAGE_KEYS.CURRENT_WEEK_START, userId);
  const dateString = getStorageItem<string | null>(key, null);
  if (dateString) {
    return deserializeDate(dateString);
  }
  
  // Default to current week's Monday
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

export const saveAISettings = (apiKey: string, model: string): boolean => {
  const apiKeySaved = setStorageItem(STORAGE_KEYS.AI_API_KEY, apiKey);
  const modelSaved = setStorageItem(STORAGE_KEYS.AI_MODEL, model);
  return apiKeySaved && modelSaved;
};

export const loadAISettings = (): { apiKey: string; model: string } => {
  const apiKey = getStorageItem<string>(STORAGE_KEYS.AI_API_KEY, '');
  const model = getStorageItem<string>(STORAGE_KEYS.AI_MODEL, 'gpt-4o-mini');
  return { apiKey, model };
};

// Assistant conversation persistence
export const saveAssistantMessages = (messages: any[], userId?: string): boolean => {
  const serializedMessages = messages.map(msg => ({
    ...msg,
    timestamp: serializeDate(msg.timestamp)
  }));
  const key = getUserStorageKey(STORAGE_KEYS.ASSISTANT_MESSAGES, userId);
  return setStorageItem(key, serializedMessages);
};

export const loadAssistantMessages = (userId?: string): any[] => {
  const key = getUserStorageKey(STORAGE_KEYS.ASSISTANT_MESSAGES, userId);
  const serializedMessages = getStorageItem<any[]>(key, []);
  return serializedMessages.map(msg => ({
    ...msg,
    timestamp: deserializeDate(msg.timestamp)
  }));
};

export const saveConversationHistory = (history: Array<{ role: 'user' | 'assistant'; content: string }>, userId?: string): boolean => {
  const key = getUserStorageKey(STORAGE_KEYS.ASSISTANT_CONVERSATION_HISTORY, userId);
  return setStorageItem(key, history);
};

export const loadConversationHistory = (userId?: string): Array<{ role: 'user' | 'assistant'; content: string }> => {
  const key = getUserStorageKey(STORAGE_KEYS.ASSISTANT_CONVERSATION_HISTORY, userId);
  return getStorageItem<Array<{ role: 'user' | 'assistant'; content: string }>>(key, []);
};

// Clear all app data (useful for reset functionality)
export const clearAllAppData = (): boolean => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    return true;
  } catch (error) {
    console.error('Failed to clear app data:', error);
    return false;
  }
};

// Clear user-specific data
export const clearUserData = (userId: string): boolean => {
  try {
    const userSpecificKeys = [
      STORAGE_KEYS.OBJECTS,
      STORAGE_KEYS.SCHEDULED_ITEMS,
      STORAGE_KEYS.CURRENT_WEEK_START,
      STORAGE_KEYS.ASSISTANT_MESSAGES,
      STORAGE_KEYS.ASSISTANT_CONVERSATION_HISTORY
    ];
    
    userSpecificKeys.forEach(baseKey => {
      const userKey = getUserStorageKey(baseKey, userId);
      localStorage.removeItem(userKey);
    });
    return true;
  } catch (error) {
    console.error('Failed to clear user data:', error);
    return false;
  }
};

// Export app state for backup/sync (future database integration)
export const exportAppState = () => {
  return {
    objects: loadObjects(),
    scheduledItems: loadScheduledItems(),
    currentWeekStart: loadCurrentWeekStart(),
    aiSettings: loadAISettings(),
    assistantMessages: loadAssistantMessages(),
    conversationHistory: loadConversationHistory(),
    exportedAt: new Date().toISOString(),
    version: '1.0.0'
  };
};

// Import app state from backup/sync (future database integration)
export const importAppState = (state: any): boolean => {
  try {
    // Validate the state object
    if (!state || typeof state !== 'object') {
      console.error('Invalid state object');
      return false;
    }

    if (state.objects && Array.isArray(state.objects)) {
      // Validate and fix objects data
      const validObjects = state.objects.map((obj: any) => ({
        ...obj,
        createdAt: obj.createdAt ? new Date(obj.createdAt) : new Date()
      }));
      saveObjects(validObjects);
    }
    
    if (state.scheduledItems && Array.isArray(state.scheduledItems)) {
      // Validate and fix scheduled items data
      const validScheduledItems = state.scheduledItems.map((item: any) => ({
        ...item,
        data: {
          ...item.data,
          createdAt: item.data?.createdAt ? new Date(item.data.createdAt) : new Date()
        }
      }));
      saveScheduledItems(validScheduledItems);
    }
    
    if (state.currentWeekStart) {
      saveCurrentWeekStart(new Date(state.currentWeekStart));
    }
    
    if (state.aiSettings) {
      saveAISettings(state.aiSettings.apiKey || '', state.aiSettings.model || 'gpt-4o-mini');
    }
    
    if (state.assistantMessages && Array.isArray(state.assistantMessages)) {
      const validMessages = state.assistantMessages.map((msg: any) => ({
        ...msg,
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
      }));
      saveAssistantMessages(validMessages);
    }
    
    if (state.conversationHistory && Array.isArray(state.conversationHistory)) {
      saveConversationHistory(state.conversationHistory);
    }
    
    return true;
  } catch (error) {
    console.error('Failed to import app state:', error);
    return false;
  }
};

// Tab-specific export functions
export const exportObjectsData = () => {
  return {
    objects: loadObjects(),
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
    type: 'objects'
  };
};

export const exportWeekData = () => {
  return {
    scheduledItems: loadScheduledItems(),
    currentWeekStart: loadCurrentWeekStart(),
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
    type: 'week'
  };
};

export const exportAnalyticsData = () => {
  return {
    objects: loadObjects(),
    scheduledItems: loadScheduledItems(),
    currentWeekStart: loadCurrentWeekStart(),
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
    type: 'analytics'
  };
};

// Tab-specific import functions
export const importObjectsData = (state: any): boolean => {
  try {
    if (!state || typeof state !== 'object') {
      console.error('Invalid state object');
      return false;
    }

    if (state.objects && Array.isArray(state.objects)) {
      const validObjects = state.objects.map((obj: any) => ({
        ...obj,
        createdAt: obj.createdAt ? new Date(obj.createdAt) : new Date()
      }));
      saveObjects(validObjects);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Failed to import objects data:', error);
    return false;
  }
};

export const importWeekData = (state: any): boolean => {
  try {
    if (!state || typeof state !== 'object') {
      console.error('Invalid state object');
      return false;
    }

    let success = false;

    if (state.scheduledItems && Array.isArray(state.scheduledItems)) {
      const validScheduledItems = state.scheduledItems.map((item: any) => ({
        ...item,
        data: {
          ...item.data,
          createdAt: item.data?.createdAt ? new Date(item.data.createdAt) : new Date()
        }
      }));
      saveScheduledItems(validScheduledItems);
      success = true;
    }

    if (state.currentWeekStart) {
      saveCurrentWeekStart(new Date(state.currentWeekStart));
      success = true;
    }

    return success;
  } catch (error) {
    console.error('Failed to import week data:', error);
    return false;
  }
};

export const importAnalyticsData = (state: any): boolean => {
  try {
    if (!state || typeof state !== 'object') {
      console.error('Invalid state object');
      return false;
    }

    let success = false;

    if (state.objects && Array.isArray(state.objects)) {
      const validObjects = state.objects.map((obj: any) => ({
        ...obj,
        createdAt: obj.createdAt ? new Date(obj.createdAt) : new Date()
      }));
      saveObjects(validObjects);
      success = true;
    }

    if (state.scheduledItems && Array.isArray(state.scheduledItems)) {
      const validScheduledItems = state.scheduledItems.map((item: any) => ({
        ...item,
        data: {
          ...item.data,
          createdAt: item.data?.createdAt ? new Date(item.data.createdAt) : new Date()
        }
      }));
      saveScheduledItems(validScheduledItems);
      success = true;
    }

    if (state.currentWeekStart) {
      saveCurrentWeekStart(new Date(state.currentWeekStart));
      success = true;
    }

    return success;
  } catch (error) {
    console.error('Failed to import analytics data:', error);
    return false;
  }
}; 