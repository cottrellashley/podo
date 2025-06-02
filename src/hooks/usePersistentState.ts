import { useState, useEffect, useCallback, useRef } from 'react';

// Custom hook for persistent state with localStorage
export function usePersistentState<T>(
  key: string,
  defaultValue: T,
  serializer?: {
    serialize: (value: T) => string;
    deserialize: (value: string) => T;
  }
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const serialize = serializer?.serialize || JSON.stringify;
  const deserialize = serializer?.deserialize || JSON.parse;
  
  // Use ref to track if we've initialized from localStorage
  const initialized = useRef(false);
  
  // Initialize state
  const [state, setState] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      if (item !== null) {
        initialized.current = true;
        return deserialize(item);
      }
    } catch (error) {
      console.error(`Failed to load persisted state for key "${key}":`, error);
    }
    return defaultValue;
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    // Don't save on initial load if we loaded from localStorage
    if (!initialized.current) {
      initialized.current = true;
      return;
    }

    try {
      localStorage.setItem(key, serialize(state));
    } catch (error) {
      console.error(`Failed to persist state for key "${key}":`, error);
    }
  }, [key, state, serialize]);

  // Clear function to remove from localStorage
  const clearPersistedState = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setState(defaultValue);
    } catch (error) {
      console.error(`Failed to clear persisted state for key "${key}":`, error);
    }
  }, [key, defaultValue]);

  return [state, setState, clearPersistedState];
}

// Specialized hook for arrays with better performance
export function usePersistentArray<T>(
  key: string,
  defaultValue: T[] = [],
  serializer?: {
    serialize: (value: T[]) => string;
    deserialize: (value: string) => T[];
  }
): [T[], (value: T[] | ((prev: T[]) => T[])) => void, () => void] {
  return usePersistentState(key, defaultValue, serializer);
}

// Hook for debounced persistent state (useful for frequent updates)
export function useDebouncedPersistentState<T>(
  key: string,
  defaultValue: T,
  delay: number = 500,
  serializer?: {
    serialize: (value: T) => string;
    deserialize: (value: string) => T;
  }
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [state, setState] = usePersistentState(key, defaultValue, serializer);
  const timeoutRef = useRef<number | undefined>(undefined);

  const debouncedSetState = useCallback((value: T | ((prev: T) => T)) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = window.setTimeout(() => {
      setState(value);
    }, delay);
  }, [setState, delay]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const clearPersistedState = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    try {
      localStorage.removeItem(key);
      setState(defaultValue);
    } catch (error) {
      console.error(`Failed to clear persisted state for key "${key}":`, error);
    }
  }, [key, defaultValue]);

  return [state, debouncedSetState, clearPersistedState];
} 