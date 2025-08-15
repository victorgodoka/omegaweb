import { useCallback } from 'react';
import { useModal } from '@/contexts/ModalContext';
import type { ReactNode } from 'react';
import { Icon } from '@iconify/react';

interface ConfirmModalOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger' | 'success' | 'warning';
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface AlertModalOptions {
  title?: string;
  message: string;
  buttonText?: string;
  variant?: 'info' | 'success' | 'warning' | 'error';
  onClose?: () => void;
}

export const useModalHelpers = () => {
  const { showModal, hideModal } = useModal();

  // Show confirmation modal
  const showConfirm = useCallback((options: ConfirmModalOptions) => {
    const {
      title = 'Confirm Action',
      message,
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      confirmVariant = 'primary',
      onConfirm,
      onCancel
    } = options;

    const getButtonStyles = (variant: string) => {
      switch (variant) {
        case 'danger':
          return 'bg-red-600 hover:bg-red-700 text-white';
        case 'success':
          return 'bg-green-600 hover:bg-green-700 text-white';
        case 'warning':
          return 'bg-orange-600 hover:bg-orange-700 text-white';
        default:
          return 'bg-blue-600 hover:bg-blue-700 text-white';
      }
    };

    const modalId = showModal({
      title,
      size: 'sm',
      content: (
        <div className="space-y-4">
          <p className="text-zinc-300 leading-relaxed">{message}</p>
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-700">
            <button
              onClick={() => {
                hideModal(modalId);
                onCancel?.();
              }}
              className="px-4 py-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 rounded-lg transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                hideModal(modalId);
                onConfirm?.();
              }}
              className={`px-4 py-2 font-medium rounded-lg transition-colors ${getButtonStyles(confirmVariant)}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      ),
      onClose: onCancel
    });

    return modalId;
  }, [showModal, hideModal]);

  // Show alert modal
  const showAlert = useCallback((options: AlertModalOptions) => {
    const {
      title = 'Alert',
      message,
      buttonText = 'OK',
      variant = 'info',
      onClose
    } = options;

    const getIconAndColor = (variant: string) => {
      switch (variant) {
        case 'success':
          return { icon: 'mdi:check-circle', color: 'text-green-400' };
        case 'warning':
          return { icon: 'mdi:alert', color: 'text-orange-400' };
        case 'error':
          return { icon: 'mdi:alert-circle', color: 'text-red-400' };
        default:
          return { icon: 'mdi:information', color: 'text-blue-400' };
      }
    };

    const { icon, color } = getIconAndColor(variant);

    const modalId = showModal({
      title,
      size: 'sm',
      content: (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Icon icon={icon} className={`${color} text-xl flex-shrink-0 mt-0.5`} />
            <p className="text-zinc-300 leading-relaxed">{message}</p>
          </div>
          <div className="flex justify-end pt-4 border-t border-zinc-700">
            <button
              onClick={() => {
                hideModal(modalId);
                onClose?.();
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              {buttonText}
            </button>
          </div>
        </div>
      ),
      onClose
    });

    return modalId;
  }, [showModal, hideModal]);

  // Show custom content modal
  const showCustom = useCallback((
    title: string,
    content: ReactNode,
    options?: {
      size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
      showCloseButton?: boolean;
      closeOnOverlayClick?: boolean;
      closeOnEscape?: boolean;
      onClose?: () => void;
    }
  ) => {
    return showModal({
      title,
      content,
      ...options
    });
  }, [showModal]);

  return {
    showConfirm,
    showAlert,
    showCustom,
    hideModal
  };
};

export default useModalHelpers;
