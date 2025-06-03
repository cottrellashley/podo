import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, setAuthToken, getAuthToken, checkApiHealth } from '../services/api';

// User interface
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  lastLoginAt: Date;
}

// Auth context interface
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOnline: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

// Storage keys for user data (fallback for offline mode)
const STORAGE_KEYS = {
  USER_SESSION: 'podo_user_session',
  USERS_DB: 'podo_users_db'
} as const;

// Session data interface
interface SessionData {
  user: {
    id: string;
    email: string;
    name: string;
    createdAt: string;
    lastLoginAt: string;
  };
  expiresAt: string;
}

// Simple in-memory user database (fallback for offline mode)
interface UserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  lastLoginAt: string;
}

// Utility functions for localStorage operations
const getStorageItem = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage key "${key}":`, error);
    return defaultValue;
  }
};

const setStorageItem = <T,>(key: string, value: T): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error writing to localStorage key "${key}":`, error);
    return false;
  }
};

// Crypto utilities for offline mode
const generateSalt = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

const hashPassword = async (password: string, salt: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
};

const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

// Validation functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }
  if (!/\d/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }
  return { valid: true };
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);

  // Check API availability and initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if API is available
        const apiAvailable = await checkApiHealth();
        setIsOnline(apiAvailable);

        if (apiAvailable) {
          // Try to verify existing token with API
          const token = getAuthToken();
          if (token) {
            const response = await authApi.verifyToken();
            if (response.success && response.data) {
              setUser({
                ...response.data.user,
                createdAt: new Date(response.data.user.createdAt),
                lastLoginAt: new Date(response.data.user.lastLoginAt)
              });
            } else {
              // Invalid token, clear it
              localStorage.removeItem('podo_auth_token');
            }
          }
        } else {
          // Fallback to localStorage for offline mode
          const sessionData = getStorageItem<SessionData | null>(STORAGE_KEYS.USER_SESSION, null);
          if (sessionData && sessionData.user && sessionData.expiresAt) {
            const expiresAt = new Date(sessionData.expiresAt);
            if (expiresAt > new Date()) {
              setUser({
                ...sessionData.user,
                createdAt: new Date(sessionData.user.createdAt),
                lastLoginAt: new Date(sessionData.user.lastLoginAt)
              });
            } else {
              localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Offline mode helper functions
  const saveUserSession = (userData: User) => {
    const sessionData = {
      user: userData,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };
    setStorageItem(STORAGE_KEYS.USER_SESSION, sessionData);
  };

  const getUsersDatabase = (): UserRecord[] => {
    return getStorageItem(STORAGE_KEYS.USERS_DB, []);
  };

  const saveUsersDatabase = (users: UserRecord[]): boolean => {
    return setStorageItem(STORAGE_KEYS.USERS_DB, users);
  };

  // Login function with online/offline support
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (isOnline) {
        // Online mode - use API
        const response = await authApi.login(email, password);
        if (response.success && response.data) {
          const userData: User = {
            ...response.data.user,
            createdAt: new Date(response.data.user.createdAt),
            lastLoginAt: new Date(response.data.user.lastLoginAt)
          };
          
          setUser(userData);
          setAuthToken(response.data.token);
          saveUserSession(userData); // Also save locally for offline access
          
          return { success: true };
        } else {
          return { success: false, error: response.error || 'Login failed' };
        }
      } else {
        // Offline mode - use localStorage
        if (!email || !password) {
          return { success: false, error: 'Email and password are required' };
        }

        if (!validateEmail(email)) {
          return { success: false, error: 'Please enter a valid email address' };
        }

        const users = getUsersDatabase();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!user) {
          return { success: false, error: 'Invalid email or password' };
        }

        const hashedPassword = await hashPassword(password, user.salt);
        if (hashedPassword !== user.passwordHash) {
          return { success: false, error: 'Invalid email or password' };
        }

        const userData: User = {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: new Date(user.createdAt),
          lastLoginAt: new Date()
        };

        // Update last login time
        const updatedUsers = users.map(u => 
          u.id === user.id ? { ...u, lastLoginAt: new Date().toISOString() } : u
        );
        saveUsersDatabase(updatedUsers);

        setUser(userData);
        saveUserSession(userData);

        return { success: true };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An unexpected error occurred during login' };
    }
  };

  // Register function with online/offline support
  const register = async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Validate input
      if (!email || !password || !name) {
        return { success: false, error: 'All fields are required' };
      }

      if (!validateEmail(email)) {
        return { success: false, error: 'Please enter a valid email address' };
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return { success: false, error: passwordValidation.error };
      }

      if (name.trim().length < 2) {
        return { success: false, error: 'Name must be at least 2 characters long' };
      }

      if (isOnline) {
        // Online mode - use API
        const response = await authApi.register(email, password, name);
        if (response.success && response.data) {
          const userData: User = {
            ...response.data.user,
            createdAt: new Date(response.data.user.createdAt),
            lastLoginAt: new Date(response.data.user.lastLoginAt)
          };
          
          setUser(userData);
          setAuthToken(response.data.token);
          saveUserSession(userData); // Also save locally for offline access
          
          return { success: true };
        } else {
          return { success: false, error: response.error || 'Registration failed' };
        }
      } else {
        // Offline mode - use localStorage
        const users = getUsersDatabase();
        const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (existingUser) {
          return { success: false, error: 'An account with this email already exists' };
        }

        const salt = generateSalt();
        const passwordHash = await hashPassword(password, salt);
        const now = new Date().toISOString();

        const newUserRecord: UserRecord = {
          id: generateId(),
          email: email.toLowerCase(),
          name: name.trim(),
          passwordHash,
          salt,
          createdAt: now,
          lastLoginAt: now
        };

        users.push(newUserRecord);
        saveUsersDatabase(users);

        const userData: User = {
          id: newUserRecord.id,
          email: newUserRecord.email,
          name: newUserRecord.name,
          createdAt: new Date(newUserRecord.createdAt),
          lastLoginAt: new Date(newUserRecord.lastLoginAt)
        };

        setUser(userData);
        saveUserSession(userData);

        return { success: true };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'An unexpected error occurred during registration' };
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      if (isOnline) {
        await authApi.logout(); // This also clears the token
      } else {
        localStorage.removeItem('podo_auth_token');
      }
      
      // Clear local session data
      localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local data even if API call fails
      localStorage.removeItem('podo_auth_token');
      localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
      setUser(null);
    }
  };

  // Update user function
  const updateUser = (updates: Partial<User>): void => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      saveUserSession(updatedUser);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isOnline,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 