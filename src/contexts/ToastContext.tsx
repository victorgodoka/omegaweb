import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import Toast from '@/components/ui/Toast';
import type { ToastType, ToastPosition } from '@/components/ui/Toast';

interface ToastData {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  position?: ToastPosition;
  duration?: number;
  actionButton?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  showToast: (toast: Omit<ToastData, 'id'>) => string;
  hideToast: (id: string) => void;
  showSuccess: (message: string, options?: Partial<Omit<ToastData, 'id' | 'type' | 'message'>>) => string;
  showError: (message: string, options?: Partial<Omit<ToastData, 'id' | 'type' | 'message'>>) => string;
  showWarning: (message: string, options?: Partial<Omit<ToastData, 'id' | 'type' | 'message'>>) => string;
  showInfo: (message: string, options?: Partial<Omit<ToastData, 'id' | 'type' | 'message'>>) => string;
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
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const generateId = useCallback(() => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }, []);

  const showToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = generateId();
    const newToast: ToastData = {
      id,
      position: 'top-right',
      duration: 5000,
      ...toast,
    };

    setToasts(prev => [...prev, newToast]);
    return id;
  }, [generateId]);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showSuccess = useCallback((message: string, options?: Partial<Omit<ToastData, 'id' | 'type' | 'message'>>) => {
    return showToast({
      type: 'success',
      message,
      ...options,
    });
  }, [showToast]);

  const showError = useCallback((message: string, options?: Partial<Omit<ToastData, 'id' | 'type' | 'message'>>) => {
    return showToast({
      type: 'error',
      message,
      ...options,
    });
  }, [showToast]);

  const showWarning = useCallback((message: string, options?: Partial<Omit<ToastData, 'id' | 'type' | 'message'>>) => {
    return showToast({
      type: 'warning',
      message,
      ...options,
    });
  }, [showToast]);

  const showInfo = useCallback((message: string, options?: Partial<Omit<ToastData, 'id' | 'type' | 'message'>>) => {
    return showToast({
      type: 'info',
      message,
      ...options,
    });
  }, [showToast]);

  const contextValue: ToastContextType = {
    showToast,
    hideToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      
      {/* Render all toasts */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          position={toast.position}
          duration={toast.duration}
          onClose={hideToast}
          actionButton={toast.actionButton}
        />
      ))}
    </ToastContext.Provider>
  );
};

export default ToastProvider;
