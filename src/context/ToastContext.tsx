import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/Toast';

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type: 'success' | 'error' | 'info', duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info', duration = 5000) => {
    const id = generateId();
    const newToast: ToastMessage = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);
  }, []);

  const showSuccess = useCallback((message: string, duration?: number) => {
    showToast(message, 'success', duration);
  }, [showToast]);

  const showError = useCallback((message: string, duration?: number) => {
    showToast(message, 'error', duration);
  }, [showToast]);

  const showInfo = useCallback((message: string, duration?: number) => {
    showToast(message, 'info', duration);
  }, [showToast]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const value: ToastContextType = {
    showToast,
    showSuccess,
    showError,
    showInfo,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Render toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            style={{ transform: `translateY(${index * 80}px)` }}
            className="transition-transform duration-300"
          >
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
              duration={toast.duration}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}; 