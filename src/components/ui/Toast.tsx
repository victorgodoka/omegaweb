import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top-left' | 'top-center' | 'top-right' | 'middle-center' | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface ToastProps {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  position?: ToastPosition;
  duration?: number;
  onClose: (id: string) => void;
  actionButton?: {
    label: string;
    onClick: () => void;
  };
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  position = 'top-right',
  duration = 2000,
  onClose,
  actionButton
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Show toast with animation
    const showTimer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto-hide toast after duration
    const hideTimer = setTimeout(() => {
      if (duration > 0) {
        handleClose();
      }
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(id), 300);
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-900/90 border-green-500/50',
          text: 'text-green-400',
          icon: 'mdi:check-circle'
        };
      case 'error':
        return {
          bg: 'bg-red-900/90 border-red-500/50',
          text: 'text-red-400',
          icon: 'mdi:alert-circle'
        };
      case 'warning':
        return {
          bg: 'bg-orange-900/90 border-orange-500/50',
          text: 'text-orange-400',
          icon: 'mdi:alert'
        };
      case 'info':
        return {
          bg: 'bg-blue-900/90 border-blue-500/50',
          text: 'text-blue-400',
          icon: 'mdi:information'
        };
      default:
        return {
          bg: 'bg-zinc-800/90 border-zinc-600/50',
          text: 'text-zinc-300',
          icon: 'mdi:information'
        };
    }
  };

  const getPositionStyles = () => {
    const baseStyles = 'fixed z-50 max-w-sm w-full mx-4';
    
    switch (position) {
      case 'top-left':
        return `${baseStyles} top-4 left-4`;
      case 'top-center':
        return `${baseStyles} top-4 left-1/2 transform -translate-x-1/2`;
      case 'top-right':
        return `${baseStyles} top-4 right-4`;
      case 'middle-center':
        return `${baseStyles} top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2`;
      case 'bottom-left':
        return `${baseStyles} bottom-4 left-4`;
      case 'bottom-center':
        return `${baseStyles} bottom-4 left-1/2 transform -translate-x-1/2`;
      case 'bottom-right':
        return `${baseStyles} bottom-4 right-4`;
      default:
        return `${baseStyles} top-4 right-4`;
    }
  };

  const getAnimationStyles = () => {
    if (isExiting) {
      return 'opacity-0 scale-95 translate-y-2';
    }

    if (isVisible) {
      return 'opacity-100 scale-100 translate-y-0';
    }

    return 'opacity-0 scale-95 translate-y-2';
  };

  const typeStyles = getTypeStyles();

  return (
    <div
      className={`${getPositionStyles()} ${getAnimationStyles()} transition-all duration-300 ease-out`}
    >
      <div className={`${typeStyles.bg} border backdrop-blur-sm rounded-lg shadow-lg p-4`}>
        <div className="flex items-start gap-3">
          <Icon 
            icon={typeStyles.icon} 
            className={`${typeStyles.text} text-lg flex-shrink-0 mt-0.5`} 
          />
          
          <div className="flex-1 min-w-0">
            {title && (
              <h4 className={`${typeStyles.text} font-medium text-sm mb-1`}>
                {title}
              </h4>
            )}
            <p className="text-zinc-200 text-sm leading-relaxed">
              {message}
            </p>
            
            {actionButton && (
              <button
                onClick={actionButton.onClick}
                className={`mt-2 px-3 py-1 text-xs font-medium rounded transition-colors ${
                  type === 'success' 
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : type === 'error'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : type === 'warning'
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {actionButton.label}
              </button>
            )}
          </div>
          
          <button
            onClick={handleClose}
            className="text-zinc-400 hover:text-zinc-200 transition-colors flex-shrink-0 ml-2"
          >
            <Icon icon="mdi:close" className="text-lg" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toast;
