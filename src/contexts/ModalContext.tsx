import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import Modal from '@/components/ui/Modal';
import type { ModalProps } from '@/components/ui/Modal';

interface ModalData {
  id: string;
  title: string;
  content: ReactNode;
  size?: ModalProps['size'];
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  onClose?: () => void;
}

interface ModalContextType {
  showModal: (modal: Omit<ModalData, 'id'>) => string;
  hideModal: (id: string) => void;
  hideAllModals: () => void;
  isModalOpen: (id?: string) => boolean;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [modals, setModals] = useState<ModalData[]>([]);

  const generateId = useCallback(() => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }, []);

  const showModal = useCallback((modal: Omit<ModalData, 'id'>) => {
    const id = generateId();
    const newModal: ModalData = {
      id,
      size: 'md',
      showCloseButton: true,
      closeOnOverlayClick: true,
      closeOnEscape: true,
      ...modal,
    };

    setModals(prev => [...prev, newModal]);
    return id;
  }, [generateId]);

  const hideModal = useCallback((id: string) => {
    setModals(prev => {
      const modal = prev.find(m => m.id === id);
      if (modal?.onClose) {
        modal.onClose();
      }
      return prev.filter(m => m.id !== id);
    });
  }, []);

  const hideAllModals = useCallback(() => {
    setModals(prev => {
      prev.forEach(modal => {
        if (modal.onClose) {
          modal.onClose();
        }
      });
      return [];
    });
  }, []);

  const isModalOpen = useCallback((id?: string) => {
    if (id) {
      return modals.some(modal => modal.id === id);
    }
    return modals.length > 0;
  }, [modals]);

  const contextValue: ModalContextType = {
    showModal,
    hideModal,
    hideAllModals,
    isModalOpen,
  };

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
      
      {/* Render all modals */}
      {modals.map(modal => (
        <Modal
          key={modal.id}
          isOpen={true}
          onClose={() => hideModal(modal.id)}
          title={modal.title}
          size={modal.size}
          showCloseButton={modal.showCloseButton}
          closeOnOverlayClick={modal.closeOnOverlayClick}
          closeOnEscape={modal.closeOnEscape}
        >
          {modal.content}
        </Modal>
      ))}
    </ModalContext.Provider>
  );
};

export default ModalProvider;
