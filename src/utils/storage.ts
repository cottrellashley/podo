import type { ObjectType, ScheduledItem } from '../types';

// Storage keys
export const STORAGE_KEYS = {
  OBJECTS: 'podo_objects',
  SCHEDULED_ITEMS: 'podo_scheduled_items',
  CURRENT_WEEK_START: 'podo_current_week_start',
  AI_API_KEY: 'podo_ai_api_key',
  AI_MODEL: 'podo_ai_model',
  ASSISTANT_MESSAGES: 'podo_assistant_messages',
  ASSISTANT_CONVERSATION_HISTORY: 'podo_assistant_conversation_history'
} as const;

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

// Specific storage functions for app data
export const saveObjects = (objects: ObjectType[]): boolean => {
  const serializedObjects = objects.map(obj => ({
    ...obj,
    createdAt: serializeDate(obj.createdAt)
  }));
  return setStorageItem(STORAGE_KEYS.OBJECTS, serializedObjects);
};

export const loadObjects = (): ObjectType[] => {
  const serializedObjects = getStorageItem<any[]>(STORAGE_KEYS.OBJECTS, []);
  return serializedObjects.map(obj => ({
    ...obj,
    createdAt: deserializeDate(obj.createdAt)
  }));
};

export const saveScheduledItems = (items: ScheduledItem[]): boolean => {
  const serializedItems = items.map(item => ({
    ...item,
    data: {
      ...item.data,
      createdAt: serializeDate(item.data.createdAt)
    }
  }));
  return setStorageItem(STORAGE_KEYS.SCHEDULED_ITEMS, serializedItems);
};

export const loadScheduledItems = (): ScheduledItem[] => {
  const serializedItems = getStorageItem<any[]>(STORAGE_KEYS.SCHEDULED_ITEMS, []);
  return serializedItems.map(item => ({
    ...item,
    data: {
      ...item.data,
      createdAt: deserializeDate(item.data.createdAt)
    }
  }));
};

export const saveCurrentWeekStart = (date: Date): boolean => {
  return setStorageItem(STORAGE_KEYS.CURRENT_WEEK_START, serializeDate(date));
};

export const loadCurrentWeekStart = (): Date => {
  const dateString = getStorageItem<string | null>(STORAGE_KEYS.CURRENT_WEEK_START, null);
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
export const saveAssistantMessages = (messages: any[]): boolean => {
  const serializedMessages = messages.map(msg => ({
    ...msg,
    timestamp: serializeDate(msg.timestamp)
  }));
  return setStorageItem(STORAGE_KEYS.ASSISTANT_MESSAGES, serializedMessages);
};

export const loadAssistantMessages = (): any[] => {
  const serializedMessages = getStorageItem<any[]>(STORAGE_KEYS.ASSISTANT_MESSAGES, []);
  return serializedMessages.map(msg => ({
    ...msg,
    timestamp: deserializeDate(msg.timestamp)
  }));
};

export const saveConversationHistory = (history: Array<{ role: 'user' | 'assistant'; content: string }>): boolean => {
  return setStorageItem(STORAGE_KEYS.ASSISTANT_CONVERSATION_HISTORY, history);
};

export const loadConversationHistory = (): Array<{ role: 'user' | 'assistant'; content: string }> => {
  return getStorageItem<Array<{ role: 'user' | 'assistant'; content: string }>>(
    STORAGE_KEYS.ASSISTANT_CONVERSATION_HISTORY, 
    []
  );
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