import { getCardGenesysPoints } from '@/utils/Genesys';
import type { Card } from '../types';
import { toURL } from 'ydke';
import { api } from '@/utils/Api';
import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';

interface DeckStatsProps {
  banlist: 'TCG' | 'OCG' | 'TCG Genesys';
  totalCards: number;
  cardTypes: {
    monsters: number;
    spells: number;
    traps: number;
  };
  mainDeck: Array<{ card: Card; quantity: number }>;
  extraDeck: Array<{ card: Card; quantity: number }>;
  sideDeck: Array<{ card: Card; quantity: number }>;
  onBanlistChange: (banlist: 'TCG' | 'OCG' | 'TCG Genesys') => void;
}

const DeckStats: React.FC<DeckStatsProps> = ({
  banlist,
  totalCards,
  cardTypes,
  mainDeck,
  extraDeck,
  sideDeck,
  onBanlistChange
}) => {
  const [showExportButtons, setShowExportButtons] = useState(false);
  const [deckName, setDeckName] = useState<string>('Duelists Unite Deck');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const { showSuccess, showError } = useToast();

  // Reset export state when deck changes
  useEffect(() => {
    // Reset export buttons and API response when deck composition changes
    setShowExportButtons(false);
    setApiResponse(null);
  }, [mainDeck, extraDeck, sideDeck]);

  // Export Deck function - converts to YDKE and calls API
  const exportDeck = async () => {
    try {
      // Convert deck to arrays of card IDs
      const mainArray: number[] = [];
      const extraArray: number[] = [];
      const sideArray: number[] = [];

      // Add cards to arrays based on quantity
      mainDeck.forEach(({ card, quantity }) => {
        for (let i = 0; i < quantity; i++) {
          mainArray.push(card.id);
        }
      });

      extraDeck.forEach(({ card, quantity }) => {
        for (let i = 0; i < quantity; i++) {
          extraArray.push(card.id);
        }
      });

      sideDeck.forEach(({ card, quantity }) => {
        for (let i = 0; i < quantity; i++) {
          sideArray.push(card.id);
        }
      });

      // Call API to encode deck arrays
      const deckData = {
        main: mainArray,
        extra: extraArray,
        side: sideArray
      };
      
      const response = await api.main.encodeDeck(deckData);
      
      if (response.ok && response.success) {
        setApiResponse(response.data);
        setShowExportButtons(true);
        showSuccess('Deck encoded successfully!', { 
          title: 'Export Ready',
          duration: 3000 
        });
      } else {
        showError(response.message || 'Failed to encode deck', { 
          title: 'Encoding Error',
          duration: 5000 
        });
        // Don't show export buttons on API failure
        setShowExportButtons(false);
        setApiResponse(null);
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Unknown error occurred', { 
        title: 'Export Error',
        duration: 5000 
      });
      // Don't show export buttons on network/unexpected errors
      setShowExportButtons(false);
      setApiResponse(null);
    }
  };

  // Normalize deck name for file name
  const normalizeDeckName = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .trim();
  };

  // Export to YDK function
  const exportToYDK = () => {
    const lines: string[] = [];
    
    // Header
    lines.push('#created by Omega Web Deck Builder');
    lines.push(`#${deckName}`);
    lines.push('#main');
    
    // Main deck cards
    mainDeck.forEach(({ card, quantity }) => {
      for (let i = 0; i < quantity; i++) {
        lines.push(card.id.toString());
      }
    });
    
    lines.push('#extra');
    
    // Extra deck cards
    extraDeck.forEach(({ card, quantity }) => {
      for (let i = 0; i < quantity; i++) {
        lines.push(card.id.toString());
      }
    });
    
    lines.push('!side');
    
    // Side deck cards
    sideDeck.forEach(({ card, quantity }) => {
      for (let i = 0; i < quantity; i++) {
        lines.push(card.id.toString());
      }
    });
    
    const ydkContent = lines.join('\n');
    
    // Create and download file
    const normalizedName = normalizeDeckName(deckName);
    const blob = new Blob([ydkContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${normalizedName}.ydk`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showSuccess(`YDK file "${normalizedName}.ydk" downloaded successfully!`, { 
      title: 'Download Complete',
      duration: 3000 
    });
  };

  // Generate YDKE code from current deck (since new API doesn't return YDKE format)
  const generateYDKECode = () => {
    try {
      const mainArray: number[] = [];
      const extraArray: number[] = [];
      const sideArray: number[] = [];

      mainDeck.forEach(({ card, quantity }) => {
        for (let i = 0; i < quantity; i++) {
          mainArray.push(card.id);
        }
      });

      extraDeck.forEach(({ card, quantity }) => {
        for (let i = 0; i < quantity; i++) {
          extraArray.push(card.id);
        }
      });

      sideDeck.forEach(({ card, quantity }) => {
        for (let i = 0; i < quantity; i++) {
          sideArray.push(card.id);
        }
      });

      return toURL({
        main: Uint32Array.from(mainArray),
        extra: Uint32Array.from(extraArray),
        side: Uint32Array.from(sideArray)
      });
    } catch (error) {
      showError('Failed to generate YDKE code', { 
        title: 'Generation Error',
        duration: 3000 
      });
      return null;
    }
  };

  // Copy YDKE to clipboard
  const copyYDKEToClipboard = async () => {
    const ydkeCode = generateYDKECode();
    if (ydkeCode) {
      try {
        await navigator.clipboard.writeText(ydkeCode);
        showSuccess('YDKE code copied to clipboard!', { 
          title: 'Copied',
          duration: 2000 
        });
      } catch (error) {
        showError('Failed to copy YDKE code to clipboard', { 
          title: 'Copy Error',
          duration: 3000 
        });
      }
    } else {
      showError('No YDKE code available - deck may be empty', { 
        title: 'Copy Failed',
        duration: 3000 
      });
    }
  };

  // Copy deck code to clipboard
  const copyOmegaCodeToClipboard = async () => {
    if (apiResponse?.code) {
      try {
        await navigator.clipboard.writeText(apiResponse.code);
        showSuccess('Deck code copied to clipboard!', { 
          title: 'Copied',
          duration: 2000 
        });
      } catch (error) {
        showError('Failed to copy deck code to clipboard', { 
          title: 'Copy Error',
          duration: 3000 
        });
      }
    } else {
      showError('No deck code available - please export deck first', { 
        title: 'Copy Failed',
        duration: 3000 
      });
    }
  };

  // Import into Omega using localDeckServer
  const importIntoOmega = async () => {
    if (apiResponse?.code) {
      try {
        const response = await api.external.localDeckServer.addDeck(deckName, apiResponse.code);
        if (response.ok) {
          showSuccess(`Deck "${deckName}" imported to Omega successfully!`, { 
            title: 'Import Successful',
            duration: 4000 
          });
        } else {
          showError(response.message || 'Failed to import deck to Omega', { 
            title: 'Import Failed',
            duration: 5000 
          });
        }
      } catch (error) {
        showError(error instanceof Error ? error.message : 'Error importing deck to Omega', { 
          title: 'Import Error',
          duration: 5000 
        });
      }
    } else {
      showError('No deck code available - please export deck first', { 
        title: 'Import Failed',
        duration: 3000 
      });
    }
  };

  // Calculate Genesys points
  const calculateGenesysPoints = () => {
    if (banlist !== 'TCG Genesys') return 0;

    let totalPoints = 0;

    // Calculate points for main deck
    mainDeck.forEach(({ card, quantity }) => {
      const points = getCardGenesysPoints(card.name);
      totalPoints += points * quantity;
    });

    // Calculate points for extra deck
    extraDeck.forEach(({ card, quantity }) => {
      const points = getCardGenesysPoints(card.name);
      totalPoints += points * quantity;
    });

    // Calculate points for side deck
    sideDeck.forEach(({ card, quantity }) => {
      const points = getCardGenesysPoints(card.name);
      totalPoints += points * quantity;
    });

    return totalPoints;
  };

  const format = {
    'TCG': 'TCG 15.09.2025',
    'OCG': 'TCG 15.09.2025',
    'TCG Genesys': 'Genesys Points'
  };

  const genesysPoints = calculateGenesysPoints();
  return (
    <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-xl border border-purple-500/30 p-4">
      {/* Deck Name Input and Export Button */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-purple-200 whitespace-nowrap">Deck Name:</label>
          <input
            type="text"
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            className="px-3 py-1 bg-purple-800/50 text-purple-100 rounded border border-purple-500/30 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 min-w-0"
            placeholder="Enter deck name"
          />
        </div>
        <button
          onClick={exportDeck}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
        >
          Export Deck
        </button>
      </div>

      {/* Export Options - Show after Export Deck is clicked */}
      {showExportButtons && (
        <div className="flex flex-wrap gap-2 justify-center mb-4 border-t border-purple-500/30 pt-4">
          <button
            onClick={exportToYDK}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
          >
            Export to YDK
          </button>
          <button
            onClick={copyYDKEToClipboard}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={mainDeck.length === 0 && extraDeck.length === 0 && sideDeck.length === 0}
          >
            Copy YDKE to Clipboard
          </button>
          <button
            onClick={copyOmegaCodeToClipboard}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!apiResponse?.code}
          >
            Copy Deck Code
          </button>
          <button
            onClick={importIntoOmega}
            className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm font-medium transition-colors"
          >
            Import into Omega
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-8 justify-center items-center">
        <div>
          <label className="text-sm text-purple-200 block mb-1">Current Banlist</label>
          <div className="text-lg font-semibold text-purple-100">
            {format[banlist]}
          </div>
        </div>

        {/* Genesys Points */}
        {banlist === 'TCG Genesys' && (
          <div>
            <label className="text-sm text-purple-200 block mb-1">Genesys Points</label>
            <div className="text-lg font-bold text-blue-400">
              {genesysPoints}
            </div>
          </div>
        )}

        {/* Banlist Selection */}
        <div>
          <label className="text-sm text-purple-200 block mb-1">Banlist</label>
          <select
            value={banlist}
            onChange={(e) => onBanlistChange(e.target.value as 'TCG' | 'OCG' | 'TCG Genesys')}
            className="w-full bg-purple-800/50 text-purple-100 rounded px-2 py-1 border border-purple-500/30 text-sm"
          >
            <option value="TCG">TCG</option>
            <option value="OCG">OCG</option>
            <option value="TCG Genesys">TCG Genesys</option>
          </select>
        </div>

        {/* Card Distribution */}
        <div className="">
          <label className="text-sm text-purple-200 block mb-1">Card Distribution</label>
          <div className="flex gap-4 text-sm">
            <span className="text-yellow-400 font-semibold">
              {cardTypes.monsters} Monsters
            </span>
            <span className="text-green-400 font-semibold">
              {cardTypes.spells} Spells
            </span>
            <span className="text-red-400 font-semibold">
              {cardTypes.traps} Traps
            </span>
            <span className="text-purple-200 font-bold border-l border-purple-500/30 pl-4">
              Total: {totalCards}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeckStats;
