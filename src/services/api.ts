import type { ObjectType, ScheduledItem } from '../types';

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// API response types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    createdAt: string;
    lastLoginAt: string;
  };
  token: string;
}

interface RegisterResponse {
  user: {
    id: string;
    email: string;
    name: string;
    createdAt: string;
    lastLoginAt: string;
  };
  token: string;
}

// Helper function to make API requests
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  try {
    const token = localStorage.getItem('podo_auth_token');
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    // Handle different response types
    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // For endpoints that return no content (like DELETE)
      data = null;
    }

    if (!response.ok) {
      // Handle server error responses
      const errorMessage = data?.error || data?.message || `HTTP ${response.status}: ${response.statusText}`;
      return {
        success: false,
        error: errorMessage,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('API request failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
};

// Authentication API
export const authApi = {
  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    return apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async register(email: string, password: string, name: string): Promise<ApiResponse<RegisterResponse>> {
    return apiRequest<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  },

  async logout(): Promise<ApiResponse<void>> {
    const result = await apiRequest<void>('/auth/logout', {
      method: 'POST',
    });
    
    // Clear local token regardless of API response
    localStorage.removeItem('podo_auth_token');
    
    return result;
  },

  async verifyToken(): Promise<ApiResponse<{ user: LoginResponse['user'] }>> {
    return apiRequest<{ user: LoginResponse['user'] }>('/auth/verify');
  },

  async updateProfile(name: string): Promise<ApiResponse<{ user: LoginResponse['user'] }>> {
    return apiRequest<{ user: LoginResponse['user'] }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    return apiRequest<{ message: string }>('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
};

// Objects API
export const objectsApi = {
  async getObjects(): Promise<ApiResponse<ObjectType[]>> {
    return apiRequest<ObjectType[]>('/objects');
  },

  async createObject(object: ObjectType): Promise<ApiResponse<ObjectType>> {
    // Transform object to match server expectations
    const objectData = {
      id: object.id,
      title: object.title,
      description: '', // Default empty description for server
      color: '#3B82F6', // Default color for server
      createdAt: object.createdAt.toISOString(),
      // Include all object properties
      type: object.type,
      ...(object.type === 'recipe' && {
        ingredients: (object as any).ingredients,
        instructions: (object as any).instructions
      }),
      ...(object.type === 'workout' && {
        bodyGroup: (object as any).bodyGroup,
        exercises: (object as any).exercises,
        notes: (object as any).notes
      }),
      ...(object.type === 'todoList' && {
        items: (object as any).items
      })
    };

    return apiRequest<ObjectType>('/objects', {
      method: 'POST',
      body: JSON.stringify(objectData),
    });
  },

  async updateObject(object: ObjectType): Promise<ApiResponse<ObjectType>> {
    // Transform object to match server expectations
    const objectData = {
      id: object.id,
      title: object.title,
      description: '', // Default empty description for server
      color: '#3B82F6', // Default color for server
      createdAt: object.createdAt.toISOString(),
      // Include all object properties
      type: object.type,
      ...(object.type === 'recipe' && {
        ingredients: (object as any).ingredients,
        instructions: (object as any).instructions
      }),
      ...(object.type === 'workout' && {
        bodyGroup: (object as any).bodyGroup,
        exercises: (object as any).exercises,
        notes: (object as any).notes
      }),
      ...(object.type === 'todoList' && {
        items: (object as any).items
      })
    };

    return apiRequest<ObjectType>(`/objects/${object.id}`, {
      method: 'PUT',
      body: JSON.stringify(objectData),
    });
  },

  async deleteObject(objectId: string): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/objects/${objectId}`, {
      method: 'DELETE',
    });
  },

  async bulkSync(objects: ObjectType[]): Promise<ApiResponse<ObjectType[]>> {
    // Transform objects to match server expectations
    const objectsData = objects.map(obj => ({
      id: obj.id,
      title: obj.title,
      description: '', // Default empty description for server
      color: '#3B82F6', // Default color for server
      createdAt: obj.createdAt.toISOString(),
      // Include all object properties
      type: obj.type,
      ...(obj.type === 'recipe' && {
        ingredients: (obj as any).ingredients,
        instructions: (obj as any).instructions
      }),
      ...(obj.type === 'workout' && {
        bodyGroup: (obj as any).bodyGroup,
        exercises: (obj as any).exercises,
        notes: (obj as any).notes
      }),
      ...(obj.type === 'todoList' && {
        items: (obj as any).items
      })
    }));

    return apiRequest<ObjectType[]>('/objects/bulk-sync', {
      method: 'POST',
      body: JSON.stringify({ objects: objectsData }),
    });
  },
};

// Week objects API
export const weekObjectsApi = {
  async getWeekObjects(): Promise<ApiResponse<ScheduledItem[]>> {
    return apiRequest<ScheduledItem[]>('/week-objects');
  },

  async createWeekObject(scheduledItem: ScheduledItem): Promise<ApiResponse<ScheduledItem>> {
    // Transform scheduled item to match server expectations
    const title = scheduledItem.data.type === 'individualTodo' 
      ? (scheduledItem.data as any).text 
      : (scheduledItem.data as any).title;

    const itemData = {
      id: scheduledItem.id,
      data: {
        ...scheduledItem.data,
        title,
        color: '#3B82F6' // Default color for server
      },
      timeSlot: '09:00', // Default time slot for server
      dayOfWeek: 1, // Default day for server
      createdAt: new Date().toISOString()
    };

    return apiRequest<ScheduledItem>('/week-objects', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  },

  async updateWeekObject(scheduledItem: ScheduledItem): Promise<ApiResponse<ScheduledItem>> {
    // Transform scheduled item to match server expectations
    const title = scheduledItem.data.type === 'individualTodo' 
      ? (scheduledItem.data as any).text 
      : (scheduledItem.data as any).title;

    const itemData = {
      id: scheduledItem.id,
      data: {
        ...scheduledItem.data,
        title,
        color: '#3B82F6' // Default color for server
      },
      timeSlot: '09:00', // Default time slot for server
      dayOfWeek: 1 // Default day for server
    };

    return apiRequest<ScheduledItem>(`/week-objects/${scheduledItem.id}`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    });
  },

  async deleteWeekObject(scheduledItemId: string): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/week-objects/${scheduledItemId}`, {
      method: 'DELETE',
    });
  },

  async bulkSync(scheduledItems: ScheduledItem[]): Promise<ApiResponse<ScheduledItem[]>> {
    // Transform scheduled items to match server expectations
    const itemsData = scheduledItems.map(item => {
      const title = item.data.type === 'individualTodo' 
        ? (item.data as any).text 
        : (item.data as any).title;

      return {
        id: item.id,
        data: {
          ...item.data,
          title,
          color: '#3B82F6' // Default color for server
        },
        timeSlot: '09:00', // Default time slot for server
        dayOfWeek: 1, // Default day for server
        createdAt: new Date().toISOString()
      };
    });

    return apiRequest<ScheduledItem[]>('/week-objects/bulk-sync', {
      method: 'POST',
      body: JSON.stringify({ scheduledItems: itemsData }),
    });
  },
};

// Data migration API
export const migrationApi = {
  async migrateFromLocalStorage(): Promise<ApiResponse<{ objectsCount: number; weekObjectsCount: number }>> {
    // Get data from localStorage
    const objects = JSON.parse(localStorage.getItem('podo_objects') || '[]');
    const scheduledItems = JSON.parse(localStorage.getItem('podo_scheduled_items') || '[]');

    // Convert date strings back to proper format for API
    const processedObjects = objects.map((obj: any) => ({
      ...obj,
      createdAt: new Date(obj.createdAt).toISOString(),
    }));

    const processedScheduledItems = scheduledItems.map((item: any) => ({
      ...item,
      data: {
        ...item.data,
        createdAt: new Date(item.data.createdAt).toISOString(),
      },
    }));

    return apiRequest<{ objectsCount: number; weekObjectsCount: number }>('/migration/from-local', {
      method: 'POST',
      body: JSON.stringify({
        objects: processedObjects,
        scheduledItems: processedScheduledItems,
      }),
    });
  },

  async exportToLocalStorage(): Promise<ApiResponse<{ objectsCount: number; weekObjectsCount: number }>> {
    const objectsResponse = await objectsApi.getObjects();
    const weekObjectsResponse = await weekObjectsApi.getWeekObjects();

    if (!objectsResponse.success || !weekObjectsResponse.success) {
      return {
        success: false,
        error: 'Failed to fetch data from server',
      };
    }

    // Save to localStorage
    localStorage.setItem('podo_objects', JSON.stringify(objectsResponse.data || []));
    localStorage.setItem('podo_scheduled_items', JSON.stringify(weekObjectsResponse.data || []));

    return {
      success: true,
      data: {
        objectsCount: objectsResponse.data?.length || 0,
        weekObjectsCount: weekObjectsResponse.data?.length || 0,
      },
    };
  },
};

// Utility function to check if API is available
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    return response.ok;
  } catch {
    return false;
  }
};

// Set auth token (called after successful login)
export const setAuthToken = (token: string): void => {
  localStorage.setItem('podo_auth_token', token);
};

// Get auth token
export const getAuthToken = (): string | null => {
  return localStorage.getItem('podo_auth_token');
}; 