import React, { createContext, useContext, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { Toast } from './Toast';
import type { AppError } from '@types/index';

interface NotificationContextType {
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const addError = useAppStore((state) => state.addError);
  const errors = useAppStore((state) => state.errors);
  const removeError = useAppStore((state) => state.removeError);

  const showNotification = useCallback((
    type: AppError['type'],
    severity: AppError['severity'],
    message: string,
    title?: string
  ) => {
    const error: AppError = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      message: title ? `${title}: ${message}` : message,
      timestamp: new Date(),
      context: 'notification'
    };
    
    addError(error);
  }, [addError]);

  const contextValue: NotificationContextType = {
    showSuccess: useCallback((message: string, title?: string) => {
      showNotification('system', 'low', message, title);
    }, [showNotification]),

    showError: useCallback((message: string, title?: string) => {
      showNotification('system', 'high', message, title);
    }, [showNotification]),

    showWarning: useCallback((message: string, title?: string) => {
      showNotification('validation', 'medium', message, title);
    }, [showNotification]),

    showInfo: useCallback((message: string, title?: string) => {
      showNotification('system', 'low', message, title);
    }, [showNotification])
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {errors
          .filter(error => error.context === 'notification')
          .slice(-5) // Show only last 5 notifications
          .map((error) => (
            <Toast
              key={error.id}
              type={error.severity === 'high' ? 'error' : 
                    error.severity === 'medium' ? 'warning' : 
                    error.type === 'validation' ? 'warning' : 'success'}
              message={error.message}
              onClose={() => removeError(error.id)}
              autoClose={error.severity === 'low' ? 5000 : 10000}
            />
          ))}
      </div>
    </NotificationContext.Provider>
  );
}
