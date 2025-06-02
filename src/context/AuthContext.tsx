import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  lastLoginAt: Date;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<Pick<User, 'name' | 'email'>>) => Promise<{ success: boolean; error?: string }>;
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
  children: ReactNode;
}

// Storage keys for user data
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

// Simple in-memory user database (in production, this would be a real backend)
interface UserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  lastLoginAt: string;
}

// Simple password hashing (in production, use bcrypt or similar)
const hashPassword = async (password: string, salt: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const generateSalt = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

const generateId = (): string => {
  return crypto.randomUUID();
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
  if (!/(?=.*[a-z])/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }
  if (!/(?=.*[A-Z])/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }
  if (!/(?=.*\d)/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }
  return { valid: true };
};

// Storage utilities
const getStorageItem = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage key "${key}":`, error);
    return defaultValue;
  }
};

const setStorageItem = (key: string, value: any): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error writing to localStorage key "${key}":`, error);
    return false;
  }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const sessionData = getStorageItem<SessionData | null>(STORAGE_KEYS.USER_SESSION, null);
        if (sessionData && sessionData.user && sessionData.expiresAt) {
          const expiresAt = new Date(sessionData.expiresAt);
          if (expiresAt > new Date()) {
            // Session is still valid
            setUser({
              ...sessionData.user,
              createdAt: new Date(sessionData.user.createdAt),
              lastLoginAt: new Date(sessionData.user.lastLoginAt)
            });
          } else {
            // Session expired, clear it
            localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

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

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Validate input
      if (!email || !password) {
        return { success: false, error: 'Email and password are required' };
      }

      if (!validateEmail(email)) {
        return { success: false, error: 'Please enter a valid email address' };
      }

      // Get users database
      const users = getUsersDatabase();
      const userRecord = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!userRecord) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Verify password
      const passwordHash = await hashPassword(password, userRecord.salt);
      if (passwordHash !== userRecord.passwordHash) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Update last login time
      userRecord.lastLoginAt = new Date().toISOString();
      saveUsersDatabase(users);

      // Create user session
      const userData: User = {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
        createdAt: new Date(userRecord.createdAt),
        lastLoginAt: new Date(userRecord.lastLoginAt)
      };

      setUser(userData);
      saveUserSession(userData);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
  };

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

      // Check if user already exists
      const users = getUsersDatabase();
      const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (existingUser) {
        return { success: false, error: 'An account with this email already exists' };
      }

      // Create new user
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

      // Save to database
      users.push(newUserRecord);
      saveUsersDatabase(users);

      // Create user session
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
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
  };

  const updateProfile = async (updates: Partial<Pick<User, 'name' | 'email'>>): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user) {
        return { success: false, error: 'No user logged in' };
      }

      // Validate updates
      if (updates.email && !validateEmail(updates.email)) {
        return { success: false, error: 'Please enter a valid email address' };
      }

      if (updates.name && updates.name.trim().length < 2) {
        return { success: false, error: 'Name must be at least 2 characters long' };
      }

      // Check if email is already taken by another user
      if (updates.email) {
        const users = getUsersDatabase();
        const existingUser = users.find(u => 
          u.email.toLowerCase() === updates.email!.toLowerCase() && u.id !== user.id
        );
        if (existingUser) {
          return { success: false, error: 'This email is already taken' };
        }
      }

      // Update user record
      const users = getUsersDatabase();
      const userIndex = users.findIndex(u => u.id === user.id);
      
      if (userIndex === -1) {
        return { success: false, error: 'User not found' };
      }

      if (updates.email) {
        users[userIndex].email = updates.email.toLowerCase();
      }
      if (updates.name) {
        users[userIndex].name = updates.name.trim();
      }

      saveUsersDatabase(users);

      // Update current user state
      const updatedUser = {
        ...user,
        ...(updates.email && { email: updates.email.toLowerCase() }),
        ...(updates.name && { name: updates.name.trim() })
      };

      setUser(updatedUser);
      saveUserSession(updatedUser);

      return { success: true };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 