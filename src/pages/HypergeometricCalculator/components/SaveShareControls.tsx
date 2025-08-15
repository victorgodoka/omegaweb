// src/pages/HypergeometricCalculator/components/SaveShareControls.tsx
import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { useAuth } from '../../../hooks/useAuth';
import { LoginModal } from '../../../components/LoginModal';
import { saveCalculatorConfiguration } from '../../../utils/calculatorApi';
import type { CardGroup } from '../types';

interface SaveShareControlsProps {
  deckCode: string;
  handSize: number;
  targetCards: CardGroup[];
  isDeckValid: boolean;
  onShareSuccess?: (shareableId: string, shareUrl: string) => void;
}

export const SaveShareControls: React.FC<SaveShareControlsProps> = ({
  deckCode,
  handSize,
  targetCards,
  isDeckValid,
  onShareSuccess,
}) => {
  const { isLoggedIn, userId, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleSaveShare = async () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    if (!isDeckValid || targetCards.length === 0) {
      setSaveError('Please ensure you have a valid deck and at least one target card group');
      return;
    }

    setIsSaving(true);
    setSaveError('');

    try {
      const response = await saveCalculatorConfiguration({
        deckCode,
        handSize,
        targetCards,
      });

      if (response.success && response.shareableId && response.shareUrl) {
        onShareSuccess?.(response.shareableId, response.shareUrl);
      } else {
        setSaveError(response.message || 'Failed to save configuration');
      }
    } catch (error) {
      setSaveError('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoginSuccess = () => {
    // After successful login, automatically try to save
    setTimeout(() => {
      handleSaveShare();
    }, 100);
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 my-4">
      <div className="mb-4 p-3 rounded-md flex items-center gap-2 text-sm">
        {isLoggedIn ? (
          <div className="bg-green-50 border border-green-200 text-green-800 flex items-center gap-2 w-full p-3 rounded-md">
            <Icon icon="mdi:account-check" className="text-xl" />
            <span>Logged in as: {userId}</span>
            <button 
              onClick={logout}
              className="ml-auto p-1 hover:bg-green-100 rounded text-green-800"
              title="Logout"
            >
              <Icon icon="mdi:logout" />
            </button>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 flex items-center gap-2 w-full p-3 rounded-md">
            <Icon icon="mdi:account-off" className="text-xl" />
            <span>Not logged in</span>
          </div>
        )}
      </div>

      <button
        onClick={handleSaveShare}
        disabled={isSaving || !isDeckValid || targetCards.length === 0}
        className="w-full bg-blue-600 text-white border-none py-3 px-6 rounded-md text-sm font-medium cursor-pointer flex items-center justify-center gap-2 transition-all hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Icon 
          icon={isSaving ? "mdi:loading" : "mdi:share-variant"} 
          className={isSaving ? "animate-spin" : ""} 
        />
        {isSaving ? 'Saving...' : isLoggedIn ? 'Save & Share' : 'Login to Save & Share'}
      </button>

      {saveError && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm flex items-center gap-2">
          <Icon icon="mdi:alert-circle" />
          {saveError}
        </div>
      )}

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
};
