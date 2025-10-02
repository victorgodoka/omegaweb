import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useCache } from '../../contexts/CacheContext';
import { Icon } from '@iconify/react';
import { api } from '../../utils/Api';
import DeckEditorSkeleton from './components/DeckEditorSkeleton';
import DeckBuilderInfoModal from './components/DeckBuilderInfoModal';
import { useDeck } from './hooks/useDeck';
import { useCardSelection } from './hooks/useCardSelection';
import { useCardSearch } from './hooks/useCardSearch';
import { useGenesys } from '../../contexts/GenesysContext';
import Toast, { type ToastType } from '../../components/ui/Toast';
import CardFiltersComponent from './components/CardFilters';
import type { Card, DeckCard } from './types';

interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
}

// Memoized card component for better performance
const CardItem = React.memo<{
  card: Card;
  banlist: string;
  onAdd: (card: Card) => void;
  onHover: (card: Card) => void;
  onLongPress: (card: Card) => void;
  getCardGenesysPoints: (cardName: string) => number;
}>(({ card, banlist, onAdd, onHover, onLongPress, getCardGenesysPoints }) => {
  const getBanlistStatus = (card: Card): string => {
    if (banlist === 'TCG Genesys') return 'unlimited';

    const banlistInfo = card.banlist_info;
    if (!banlistInfo) return 'unlimited';

    const statusKey = `ban_${banlist.toLowerCase()}` as keyof typeof banlistInfo;
    const status = banlistInfo[statusKey];

    switch (status) {
      case 'Forbidden': return 'forbidden';
      case 'Limited': return 'limited';
      case 'Semi-Limited': return 'semi-limited';
      default: return 'unlimited';
    }
  };

  return (
    <div
      className="relative group cursor-pointer"
      onClick={() => onAdd(card)}
      onMouseEnter={() => onHover(card)}
      onContextMenu={(e) => {
        e.preventDefault();
        onLongPress(card);
      }}
    >
      <img
        src={card.card_images[0]?.image_url_small}
        alt={card.name}
        className="w-full aspect-[3/4] object-cover rounded border-2 border-zinc-600 hover:border-blue-400 transition-colors"
      />

      {getBanlistStatus(card) !== 'unlimited' && (
        <div className={`absolute top-1 left-1 w-3 h-3 rounded-full ${getBanlistStatus(card) === 'forbidden' ? 'bg-red-500' :
          getBanlistStatus(card) === 'limited' ? 'bg-yellow-500' :
            getBanlistStatus(card) === 'semi-limited' ? 'bg-orange-500' : ''
          }`} />
      )}

      {banlist === 'TCG Genesys' && (
        <div className="absolute top-1 right-1 bg-blue-600 text-white text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-white">
          {getCardGenesysPoints(card.name)}
        </div>
      )}

      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
        <Icon icon="mdi:plus" className="text-white text-2xl" />
      </div>
    </div>
  );
});

const DeckEditor: React.FC = () => {
  const { cardStats, isLoading, error } = useCache();
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [activeDeckTab, setActiveDeckTab] = useState<'main' | 'extra' | 'side'>('main');
  const [deckName, setDeckName] = useState('New Deck');
  const [genesysPointsCap, setGenesysPointsCap] = useState(100);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [selectedCardModal, setSelectedCardModal] = useState<Card | null>(null);
  const [displayLimit, setDisplayLimit] = useState(50);
  const [isSearching, setIsSearching] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importCode, setImportCode] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [showCodesDialog, setShowCodesDialog] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<{ydke: string, omega: string} | null>(null);
  const [isGeneratingCodes, setIsGeneratingCodes] = useState(false);
  const [isExportingToOmega, setIsExportingToOmega] = useState(false);

  // Use custom hooks for deck and card selection logic
  const {
    deck,
    deckStats,
    addCardToDeck,
    removeCardFromDeck,
    clearDeck,
    changeBanlist,
  } = useDeck();

  const {
    handleCardHover
  } = useCardSelection();

  // Genesys context for points data - only access when needed
  const { genesysData } = useGenesys();
  
  // Create a memoized card name to ID mapping for better performance
  const cardNameToIdMap = useMemo(() => {
    if (!cardStats) return new Map<string, number>();
    const map = new Map<string, number>();
    cardStats.forEach(card => {
      map.set(card.name.toLowerCase(), card.id);
    });
    return map;
  }, [cardStats]);
  
  // Optimized helper function to get Genesys points for a card - only when banlist is TCG Genesys
  const getCardGenesysPoints = useCallback((cardName: string): number => {
    if (deck.banlist !== 'TCG Genesys') return 0; // Early return for non-Genesys formats
    const cardId = cardNameToIdMap.get(cardName.toLowerCase());
    if (!cardId) return 0;
    return genesysData[cardId] || 0;
  }, [genesysData, cardNameToIdMap, deck.banlist]);

  // Function to expand deck cards into individual instances (no stacking)
  const expandDeckCards = useCallback((cards: DeckCard[]): Card[] => {
    const expandedCards: Card[] = [];
    cards.forEach(deckCard => {
      for (let i = 0; i < deckCard.quantity; i++) {
        expandedCards.push(deckCard.card);
      }
    });
    return expandedCards;
  }, []);

  // Sorting function for individual cards
  const sortCards = useCallback((cards: Card[]): Card[] => {
    return [...cards].sort((cardA, cardB) => {
      // Priority: Monster > Spell > Trap
      const getTypeOrder = (card: Card): number => {
        if (card.humanReadableCardType.includes('Monster')) return 0;
        if (card.humanReadableCardType.includes('Spell')) return 1;
        if (card.humanReadableCardType.includes('Trap')) return 2;
        return 3;
      };

      const typeOrderA = getTypeOrder(cardA);
      const typeOrderB = getTypeOrder(cardB);

      if (typeOrderA !== typeOrderB) {
        return typeOrderA - typeOrderB;
      }

      // If both are monsters, sort by level > ATK > DEF > name
      if (typeOrderA === 0) {
        // Level comparison (higher level first)
        const levelA = cardA.level || 0;
        const levelB = cardB.level || 0;
        if (levelA !== levelB) {
          return levelB - levelA;
        }

        // ATK comparison (higher ATK first)
        const atkA = cardA.atk || 0;
        const atkB = cardB.atk || 0;
        if (atkA !== atkB) {
          return atkB - atkA;
        }

        // DEF comparison (higher DEF first)
        const defA = cardA.def || 0;
        const defB = cardB.def || 0;
        if (defA !== defB) {
          return defB - defA;
        }
      }

      // If both are spells/traps, sort by subtype then name
      if (typeOrderA === 1 || typeOrderA === 2) {
        const typeA = cardA.type || '';
        const typeB = cardB.type || '';
        if (typeA !== typeB) {
          return typeA.localeCompare(typeB);
        }
      }

      // Final sort by name
      return cardA.name.localeCompare(cardB.name);
    });
  }, []);

  // Get sorted and expanded deck cards for display
  const getSortedExpandedCards = useCallback((deckCards: DeckCard[]): Card[] => {
    const expanded = expandDeckCards(deckCards);
    return sortCards(expanded);
  }, [expandDeckCards, sortCards]);

  // Toast utility functions
  const showToast = useCallback((type: ToastType, message: string, title?: string) => {
    const id = Date.now().toString();
    const newToast: ToastMessage = { id, type, message, title };
    setToasts(prev => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Debounced search to prevent excessive filtering - increased delay for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setIsSearching(false);
    }, 500); // Increased from 300ms to 500ms

    if (searchQuery !== debouncedSearchQuery) {
      setIsSearching(true);
    }

    return () => clearTimeout(timer);
  }, [searchQuery, debouncedSearchQuery]);

  // Convert YGOAPI to Card type - optimized with early return for empty data
  const cardLibrary = useMemo(() => {
    if (!cardStats || cardStats.length === 0) return [];
    
    // Use a more efficient conversion that doesn't create new objects unnecessarily
    return cardStats as Card[];
  }, [cardStats]);

  // Use the card search hook for advanced filtering
  const {
    filters,
    filteredCards: allFilteredCards,
    filterOptions,
    updateFilter,
    clearFilters,
    applyQuickFilter,
    toggleMonsterType
  } = useCardSearch(cardLibrary, deck.banlist);

  // Update search filter when debounced query changes
  useEffect(() => {
    updateFilter('search', debouncedSearchQuery);
  }, [debouncedSearchQuery, updateFilter]);

  // Update sort filters when they change
  useEffect(() => {
    updateFilter('sortBy', sortBy);
    updateFilter('sortOrder', sortOrder);
  }, [sortBy, sortOrder, updateFilter]);

  // Handle keyboard shortcuts for filter panel
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showFilters) {
        setShowFilters(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showFilters]);

  // Normalize deck name for file export
  const normalizeDeckName = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .trim() || 'deck'; // Fallback to 'deck' if empty
  };

  // Export to YDK function
  const exportToYDK = useCallback(() => {
    // Check if deck is empty
    if (deck.mainDeck.length === 0 && deck.extraDeck.length === 0 && deck.sideDeck.length === 0) {
      showToast('warning', 'Cannot export an empty deck. Add some cards first!');
      return;
    }

    const lines: string[] = [];
    
    // Header
    lines.push('#created by Omega Web Deck Builder');
    lines.push(`#${deckName}`);
    lines.push('#main');
    
    // Main deck cards
    deck.mainDeck.forEach(({ card, quantity }) => {
      for (let i = 0; i < quantity; i++) {
        lines.push(card.id.toString());
      }
    });
    
    lines.push('#extra');
    
    // Extra deck cards
    deck.extraDeck.forEach(({ card, quantity }) => {
      for (let i = 0; i < quantity; i++) {
        lines.push(card.id.toString());
      }
    });
    
    lines.push('!side');
    
    // Side deck cards
    deck.sideDeck.forEach(({ card, quantity }) => {
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
    
    showToast('success', `YDK file "${normalizedName}.ydk" downloaded successfully!`, 'Export Complete');
  }, [deck, deckName, showToast]);

  // Generate YDKE and Omega codes
  const generateCodes = useCallback(async () => {
    // Check if deck is empty
    if (deck.mainDeck.length === 0 && deck.extraDeck.length === 0 && deck.sideDeck.length === 0) {
      showToast('warning', 'Cannot generate codes for an empty deck. Add some cards first!');
      return;
    }

    setIsGeneratingCodes(true);
    try {
      // Prepare deck data for API
      const deckData = {
        main: deck.mainDeck.flatMap(({ card, quantity }) => Array(quantity).fill(card.id)),
        extra: deck.extraDeck.flatMap(({ card, quantity }) => Array(quantity).fill(card.id)),
        side: deck.sideDeck.flatMap(({ card, quantity }) => Array(quantity).fill(card.id))
      };

      const response = await api.main.encodeDeck(deckData);

      if (response.ok && response.success && response.data) {
        setGeneratedCodes({
          ydke: response.data.ydkeUrl || '',
          omega: response.data.code || ''
        });
        setShowCodesDialog(true);
        showToast('success', 'Deck codes generated successfully!');
      } else {
        showToast('error', response.message || 'Failed to generate deck codes');
      }
    } catch (error) {
      console.error('Generate codes error:', error);
      showToast('error', 'Failed to generate deck codes');
    } finally {
      setIsGeneratingCodes(false);
    }
  }, [deck, showToast]);

  // Export to Omega
  const exportToOmega = useCallback(async () => {
    // Check if deck is empty
    if (deck.mainDeck.length === 0 && deck.extraDeck.length === 0 && deck.sideDeck.length === 0) {
      showToast('warning', 'Cannot export an empty deck. Add some cards first!');
      return;
    }

    setIsExportingToOmega(true);
    try {
      // First generate the omega code
      const deckData = {
        main: deck.mainDeck.flatMap(({ card, quantity }) => Array(quantity).fill(card.id)),
        extra: deck.extraDeck.flatMap(({ card, quantity }) => Array(quantity).fill(card.id)),
        side: deck.sideDeck.flatMap(({ card, quantity }) => Array(quantity).fill(card.id))
      };

      const encodeResponse = await api.main.encodeDeck(deckData);

      if (encodeResponse.ok && encodeResponse.success && encodeResponse.data?.code) {
        // Now add the deck to local server using the omega code
        const normalizedName = normalizeDeckName(deckName);
        const addDeckResponse = await api.external.localDeckServer.addDeck(normalizedName, encodeResponse.data.code);

        if (addDeckResponse.ok) {
          showToast('success', `Deck "${normalizedName}" exported to Omega successfully!`);
        } else {
          showToast('error', addDeckResponse.message || 'Failed to export deck to Omega');
        }
      } else {
        showToast('error', encodeResponse.message || 'Failed to generate Omega code');
      }
    } catch (error) {
      console.error('Export to Omega error:', error);
      showToast('error', 'Failed to export deck to Omega');
    } finally {
      setIsExportingToOmega(false);
    }
  }, [deck, deckName, showToast]);

  // Check if any filters are currently active
  const hasActiveFilters = useMemo(() => {
    return filters.frameType || filters.type || filters.attribute ||
      filters.race || filters.level !== null || filters.limitation ||
      filters.monsterTypes.length > 0 || filters.spellSubtype ||
      filters.pointsFilter || filters.atkMin !== null || filters.atkMax !== null ||
      filters.defMin !== null || filters.defMax !== null || filters.pendulumScale !== null ||
      filters.linkval !== null;
  }, [filters]);

  // Get filtered cards with display limit for performance
  const filteredCards = useMemo(() => {
    // Show cards if there's a search query OR if any filters are active
    if (!debouncedSearchQuery.trim() && !hasActiveFilters) return [];

    // Apply display limit for performance
    return allFilteredCards.slice(0, displayLimit);
  }, [allFilteredCards, debouncedSearchQuery, displayLimit, hasActiveFilters]);

  // Calculate total Genesys points
  const totalGenesysPoints = useMemo(() => {
    if (deck.banlist !== 'TCG Genesys') return 0;

    return [...deck.mainDeck, ...deck.extraDeck, ...deck.sideDeck]
      .reduce((total, deckCard) => {
        const cardPoints = getCardGenesysPoints(deckCard.card.name);
        return total + (cardPoints * deckCard.quantity);
      }, 0);
  }, [deck.mainDeck, deck.extraDeck, deck.sideDeck, deck.banlist]);


  // Handle card addition to active deck with validation and toasts
  const handleCardAdd = useCallback((card: Card) => {
    try {
      // Check TCG Genesys restrictions
      if (deck.banlist === 'TCG Genesys') {
        const isLinkCard = card.frameType === 'link' || card.type.includes('Link');
        const isPendulumCard = card.frameType === 'pendulum' || card.type.includes('Pendulum');

        if (isLinkCard || isPendulumCard) {
          showToast('error', `${card.name} cannot be added: Link and Pendulum cards are not allowed in TCG Genesys format`);
          return;
        }

        // Check points limit for Genesys
        const cardPoints = getCardGenesysPoints(card.name);
        if (totalGenesysPoints + cardPoints > genesysPointsCap) {
          showToast('warning', `Cannot add ${card.name}: Would exceed points limit (${totalGenesysPoints + cardPoints}/${genesysPointsCap})`);
          return;
        }
      }

      // Add card to deck
      addCardToDeck(card, activeDeckTab === 'side');

      const deckName = activeDeckTab === 'main' ? 'Main' : activeDeckTab === 'extra' ? 'Extra' : 'Side';
      showToast('success', `${card.name} added to ${deckName} deck`);
    } catch (error) {
      showToast('error', `Error adding card: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [deck.banlist, totalGenesysPoints, genesysPointsCap, activeDeckTab, addCardToDeck, showToast]);

  // Handle card removal from deck
  const handleCardRemove = useCallback((card: Card, fromDeck: 'main' | 'extra' | 'side', doNotShowToast?: boolean) => {
    try {
      // Actually remove the card from the deck
      removeCardFromDeck(card.id, fromDeck);

      // Show toast notification (unless suppressed)
      if (!doNotShowToast) {
        const deckName = fromDeck === 'main' ? 'Main' : fromDeck === 'extra' ? 'Extra' : 'Side';
        showToast('info', `${card.name} removed from ${deckName} deck`);
      }
    } catch (error) {
      if (!doNotShowToast) {
        showToast('error', `Error removing card: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }, [removeCardFromDeck, showToast]);

  // Handle long press for card modal
  const handleCardLongPress = useCallback((card: Card) => {
    setSelectedCardModal(card);
  }, []);

  // Handle clear deck
  const handleClearDeck = useCallback(() => {
    if (deck.mainDeck.length === 0 && deck.extraDeck.length === 0 && deck.sideDeck.length === 0) {
      showToast('info', 'Deck is already empty');
      return;
    }

    if (window.confirm('Are you sure you want to clear the entire deck? This action cannot be undone.')) {
      // Clear all deck sections efficiently
      clearDeck();
      showToast('success', 'Deck cleared successfully');
    }
  }, [deck, clearDeck, showToast]);

  // Parse YDK file content
  const parseYDKFile = useCallback((content: string) => {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    const deck: { main: number[], extra: number[], side: number[] } = { main: [], extra: [], side: [] };
    let currentSection: 'main' | 'extra' | 'side' | '' = '';

    for (const line of lines) {
      if (line.startsWith('#') && !line.includes('main') && !line.includes('extra') && !line.includes('side')) {
        continue; // Skip comments and metadata
      }

      if (line === '#main') {
        currentSection = 'main';
        continue;
      } else if (line === '#extra') {
        currentSection = 'extra';
        continue;
      } else if (line === '!side') {
        currentSection = 'side';
        continue;
      }

      // Parse card ID
      const cardId = parseInt(line);
      if (!isNaN(cardId) && (currentSection === 'main' || currentSection === 'extra' || currentSection === 'side')) {
        deck[currentSection].push(cardId);
      }
    }

    return deck;
  }, []);

  // Handle YDK file upload
  const handleYDKFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        try {
          const parsedDeck = parseYDKFile(content);
          console.log('Parsed YDK deck:', parsedDeck);

          // Clear existing deck before importing
          clearDeck();

          // Load cards directly into deck editor
          let cardsAdded = 0;
          let cardsNotFound = 0;

          // Helper function to add cards to deck
          const addCardsToDeck = (cardIds: number[], deckType: 'main' | 'extra' | 'side') => {
            const cardCounts: { [id: number]: number } = {};

            // Count occurrences of each card
            cardIds.forEach(id => {
              cardCounts[id] = (cardCounts[id] || 0) + 1;
            });

            // Add cards to deck
            Object.entries(cardCounts).forEach(([cardIdStr, quantity]) => {
              const cardId = parseInt(cardIdStr);
              const card = cardLibrary.find(c => c.id === cardId);

              if (card) {
                // Add the card with the correct quantity (suppress toasts during import)
                for (let i = 0; i < quantity; i++) {
                  const forceToSideDeck = deckType === 'side';
                  addCardToDeck(card, forceToSideDeck);
                  cardsAdded++;
                }
              } else {
                cardsNotFound++;
                console.warn(`Card with ID ${cardId} not found in card library`);
              }
            });
          };

          // Add cards from each section
          addCardsToDeck(parsedDeck.main, 'main');
          addCardsToDeck(parsedDeck.extra, 'extra');
          addCardsToDeck(parsedDeck.side, 'side');

          // Show success message with stats
          if (cardsAdded > 0) {
            let message = `YDK file loaded! Added ${cardsAdded} cards to deck.`;
            if (cardsNotFound > 0) {
              message += ` ${cardsNotFound} cards not found in library.`;
            }
            showToast('success', message);
          } else {
            showToast('warning', 'No cards were added. Check if the card IDs exist in the library.');
          }

          // Close the import dialog
          setShowImportDialog(false);
          setImportCode('');
        } catch (error) {
          showToast('error', 'Failed to parse YDK file');
        }
      }
    };
    reader.readAsText(file);

    // Reset file input
    event.target.value = '';
  }, [parseYDKFile, showToast, cardLibrary, addCardToDeck]);

  // Handle deck import
  const handleImportDeck = useCallback(async () => {
    if (!importCode.trim()) {
      showToast('error', 'Please enter a deck code or load a YDK file');
      return;
    }

    setIsImporting(true);
    try {
      const response = await api.main.decodeDeck(importCode.trim());

      if (response.ok && response.success) {
        const deckData = response.data;

        // Clear existing deck before importing
        clearDeck();

        let cardsAdded = 0;
        let cardsNotFound = 0;

        // Helper function to add cards from deck sections
        const addCardsFromSection = (cards: any[], deckType: 'main' | 'extra' | 'side') => {
          cards.forEach((cardData: any) => {
            const card = cardLibrary.find(c => c.id === cardData.id);

            if (card) {
              // Add the card with the correct quantity
              for (let i = 0; i < cardData.qtd; i++) {
                const forceToSideDeck = deckType === 'side';
                addCardToDeck(card, forceToSideDeck);
                cardsAdded++;
              }
            } else {
              cardsNotFound += cardData.qtd;
              console.warn(`Card with ID ${cardData.id} (${cardData.name}) not found in card library`);
            }
          });
        };

        // Add cards from each section
        if (deckData.mainDeck) {
          addCardsFromSection(deckData.mainDeck, 'main');
        }
        if (deckData.extraDeck) {
          addCardsFromSection(deckData.extraDeck, 'extra');
        }
        if (deckData.sideDeck) {
          addCardsFromSection(deckData.sideDeck, 'side');
        }

        // Show success message with stats
        if (cardsAdded > 0) {
          let message = `Deck imported successfully! Added ${cardsAdded} cards to deck.`;
          if (cardsNotFound > 0) {
            message += ` ${cardsNotFound} cards not found in library.`;
          }
          showToast('success', message);
        } else {
          showToast('warning', 'No cards were added. Check if the card IDs exist in the library.');
        }

        console.log('Imported deck data:', response.data);
        setShowImportDialog(false);
        setImportCode('');
      } else {
        showToast('error', response.message || response.data?.message || 'Failed to import deck');
      }
    } catch (error) {
      showToast('error', `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsImporting(false);
    }
  }, [importCode, showToast, cardLibrary, addCardToDeck]);

  if (isLoading) {
    return <DeckEditorSkeleton />;
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-400 text-xl">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-20 min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900">
      <div className="bg-zinc-900 border-b border-zinc-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <input
            type="text"
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            className="bg-zinc-800 my-2 w-full border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Deck Name"
          />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <button 
                onClick={exportToYDK}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Export YDK
              </button>
              <button
                onClick={generateCodes}
                disabled={isGeneratingCodes}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                {isGeneratingCodes ? (
                  <Icon icon="mdi:loading" className="text-sm animate-spin" />
                ) : (
                  <Icon icon="mdi:code-tags" className="text-sm" />
                )}
                Generate Codes
              </button>
              <button
                onClick={exportToOmega}
                disabled={isExportingToOmega}
                className="px-3 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                {isExportingToOmega ? (
                  <Icon icon="mdi:loading" className="text-sm animate-spin" />
                ) : (
                  <Icon icon="mdi:upload" className="text-sm" />
                )}
                Export to Omega
              </button>
              <button
                onClick={() => setShowImportDialog(true)}
                className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Icon icon="mdi:import" className="text-sm" />
                Import
              </button>
              <button
                onClick={handleClearDeck}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Icon icon="mdi:delete" className="text-sm" />
                Clear
              </button>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={deck.banlist}
                onChange={async (e) => await changeBanlist(e.target.value as any)}
                className="bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="TCG">TCG</option>
                <option value="OCG">OCG</option>
                <option value="TCG Genesys">TCG Genesys</option>
              </select>

              {deck.banlist === 'TCG Genesys' && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={genesysPointsCap}
                    onChange={(e) => setGenesysPointsCap(parseInt(e.target.value) || 100)}
                    className="bg-zinc-800 border border-zinc-600 rounded-lg px-2 py-2 text-white text-sm w-16 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="999"
                  />
                  <span className="text-zinc-300 text-sm font-medium">
                    {totalGenesysPoints}/{genesysPointsCap}
                  </span>
                </div>
              )}

              <button
                onClick={() => setShowInfoModal(true)}
                className="p-2 text-zinc-400 hover:text-white transition-colors"
                title="Help"
              >
                <Icon icon="mdi:help-circle" className="text-lg" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-40 bg-zinc-900 border-b border-zinc-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex border-b border-zinc-700">
            <button
              onClick={() => setActiveDeckTab('main')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeDeckTab === 'main'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-300'
                }`}
            >
              Main ({deckStats.cardTypes.main})
            </button>
            <button
              onClick={() => setActiveDeckTab('extra')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeDeckTab === 'extra'
                ? 'border-green-400 text-green-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-300'
                }`}
            >
              Extra ({deckStats.cardTypes.extra})
            </button>
            <button
              onClick={() => setActiveDeckTab('side')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeDeckTab === 'side'
                ? 'border-orange-400 text-orange-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-300'
                }`}
            >
              Side ({deckStats.cardTypes.side})
            </button>
          </div>

          <div className="py-4">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-deck">
              {activeDeckTab === 'main' && getSortedExpandedCards(deck.mainDeck).map((card, index) => (
                <div
                  key={`${card.id}-${index}`}
                  className="flex-shrink-0 relative group cursor-pointer"
                  onClick={() => handleCardRemove(card, 'main')}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleCardLongPress(card);
                  }}
                >
                  <img
                    src={card.card_images[0]?.image_url_small}
                    alt={card.name}
                    className="w-16 h-24 object-cover rounded border-2 border-cyan-400/50 hover:border-cyan-400 transition-colors"
                  />
                  
                  {/* Genesys Points Badge */}
                  {deck.banlist === 'TCG Genesys' && getCardGenesysPoints(card.name) > 0 && (
                    <div className="absolute top-1 left-1 bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shadow-lg border border-white">
                      {getCardGenesysPoints(card.name)}
                    </div>
                  )}
                </div>
              ))}

              {activeDeckTab === 'extra' && getSortedExpandedCards(deck.extraDeck).map((card, index) => (
                <div
                  key={`${card.id}-${index}`}
                  className="flex-shrink-0 relative group cursor-pointer"
                  onClick={() => handleCardRemove(card, 'extra')}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleCardLongPress(card);
                  }}
                >
                  <img
                    src={card.card_images[0]?.image_url_small}
                    alt={card.name}
                    className="w-16 h-24 object-cover rounded border-2 border-green-400/50 hover:border-green-400 transition-colors"
                  />
                  
                  {/* Genesys Points Badge */}
                  {deck.banlist === 'TCG Genesys' && getCardGenesysPoints(card.name) > 0 && (
                    <div className="absolute top-1 left-1 bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shadow-lg border border-white">
                      {getCardGenesysPoints(card.name)}
                    </div>
                  )}
                </div>
              ))}

              {activeDeckTab === 'side' && getSortedExpandedCards(deck.sideDeck).map((card, index) => (
                <div
                  key={`${card.id}-${index}`}
                  className="flex-shrink-0 relative group cursor-pointer"
                  onClick={() => handleCardRemove(card, 'side')}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleCardLongPress(card);
                  }}
                >
                  <img
                    src={card.card_images[0]?.image_url_small}
                    alt={card.name}
                    className="w-16 h-24 object-cover rounded border-2 border-orange-400/50 hover:border-orange-400 transition-colors"
                  />
                  
                  {/* Genesys Points Badge */}
                  {deck.banlist === 'TCG Genesys' && getCardGenesysPoints(card.name) > 0 && (
                    <div className="absolute top-1 left-1 bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shadow-lg border border-white">
                      {getCardGenesysPoints(card.name)}
                    </div>
                  )}
                </div>
              ))}

              {((activeDeckTab === 'main' && deck.mainDeck.length === 0) ||
                (activeDeckTab === 'extra' && deck.extraDeck.length === 0) ||
                (activeDeckTab === 'side' && deck.sideDeck.length === 0)) && (
                  <div className="flex-shrink-0 w-16 h-24 border-2 border-dashed border-zinc-600 rounded flex items-center justify-center">
                    <Icon icon="mdi:plus" className="text-zinc-500 text-xl" />
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-zinc-800 border-b border-zinc-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search with Card Name & Conditions"
                className="w-full bg-zinc-700 border border-zinc-600 rounded-lg pl-10 pr-12 py-2 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
              {isSearching && (
                <Icon icon="mdi:loading" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 animate-spin" />
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 relative ${hasActiveFilters
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-zinc-700 hover:bg-zinc-600 text-white'
                  }`}
              >
                <Icon icon="mdi:filter" />
                Filters
                {hasActiveFilters && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-zinc-800" />
                )}
              </button>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">Name</option>
                <option value="type">Type</option>
                <option value="level">Level</option>
                <option value="atk">ATK</option>
                <option value="def">DEF</option>
                {deck.banlist === 'TCG Genesys' && <option value="points">Points</option>}
              </select>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="asc">A-Z</option>
                <option value="desc">Z-A</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {filteredCards.length === 0 && allFilteredCards.length === 0 && !isSearching ? (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
              <Icon icon="mdi:magnify" className="text-6xl mb-4" />
              <h3 className="text-xl font-medium mb-2">Search for Cards</h3>
              <p className="text-zinc-400">Enter a card name or use filters to see results</p>
            </div>
          ) : isSearching ? (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
              <Icon icon="mdi:loading" className="text-6xl mb-4 animate-spin" />
              <h3 className="text-xl font-medium mb-2">Searching...</h3>
              <p className="text-zinc-400">Finding cards matching your query</p>
            </div>
          ) : (
            <>
              {filteredCards.length > 0 && allFilteredCards.length > 0 && <div className="mb-4">
                <h3 className="text-lg font-medium text-white">
                  Search Results ({allFilteredCards.length} results)
                </h3>
                <p className="text-sm text-zinc-400">
                  Click cards to add them to the {activeDeckTab} deck • Right-click for details
                </p>
              </div>}

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                {filteredCards.map((card) => (
                  <CardItem
                    key={card.id}
                    card={card}
                    banlist={deck.banlist}
                    onAdd={handleCardAdd}
                    onHover={handleCardHover}
                    onLongPress={handleCardLongPress}
                    getCardGenesysPoints={getCardGenesysPoints}
                  />
                ))}
              </div>

              {filteredCards.length === 0 && allFilteredCards.length === 0 && (
                <div className="flex flex-col items-center justify-center h-32 text-zinc-500">
                  <Icon icon="mdi:card-search" className="text-4xl mb-2" />
                  <p>No cards found matching your search and filters</p>
                  <p className="text-xs text-zinc-600 mt-1">Try adjusting your search terms or clearing some filters</p>
                </div>
              )}

              {allFilteredCards.length > displayLimit && (debouncedSearchQuery.trim() || hasActiveFilters) && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => setDisplayLimit(prev => prev + 50)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <Icon icon="mdi:plus" />
                    Load More Cards ({filteredCards.length} of {allFilteredCards.length} shown)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <DeckBuilderInfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
      />

      {selectedCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="p-6">
              <div className="flex items-start gap-6">
                <img
                  src={selectedCardModal.card_images[0]?.image_url}
                  alt={selectedCardModal.name}
                  className="w-64 h-auto object-cover rounded-lg border border-zinc-600"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <h2 className="text-2xl font-bold text-white">{selectedCardModal.name}</h2>
                    <button
                      onClick={() => setSelectedCardModal(null)}
                      className="p-2 text-zinc-400 hover:text-white transition-colors"
                    >
                      <Icon icon="mdi:close" className="text-xl" />
                    </button>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-zinc-400">Type:</span>
                      <span className="text-white ml-2">{selectedCardModal.humanReadableCardType}</span>
                    </div>

                    {selectedCardModal.atk !== undefined && (
                      <div>
                        <span className="text-zinc-400">ATK/DEF:</span>
                        <span className="text-white ml-2">{selectedCardModal.atk}/{selectedCardModal.def}</span>
                      </div>
                    )}

                    {selectedCardModal.level && (
                      <div>
                        <span className="text-zinc-400">Level:</span>
                        <span className="text-white ml-2">{selectedCardModal.level}</span>
                      </div>
                    )}

                    {deck.banlist === 'TCG Genesys' && (
                      <div>
                        <span className="text-zinc-400">Genesys Points:</span>
                        <span className="text-blue-400 ml-2 font-bold">{getCardGenesysPoints(selectedCardModal.name)}</span>
                      </div>
                    )}

                    <div>
                      <span className="text-zinc-400">Description:</span>
                      <p className="text-white mt-2 leading-relaxed">{selectedCardModal.desc}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showFilters && (
        <>
          {/* Backdrop with blur effect */}
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowFilters(false)}
          />

          {/* Blur overlay for main content */}
          <div className="fixed inset-0 z-30 pointer-events-none">
            <div className="absolute inset-0 backdrop-blur-sm bg-black/10" />
          </div>

          <div className={`
            fixed z-50 bg-zinc-900 border border-purple-500/30
            
            /* Mobile: Fullscreen */
            inset-0 lg:inset-auto
            
            /* Desktop: Side Panel */
            lg:fixed lg:top-0 lg:right-0 lg:h-full lg:w-96 lg:max-w-[90vw]
            
            /* Animations */
            transform transition-transform duration-300 ease-in-out
            ${showFilters ? 'translate-x-0' : 'translate-x-full lg:translate-x-full'}
            
            /* Styling */
            shadow-2xl overflow-y-auto scrollbar-thin scrollbar-purple
          `}>
            <div className="lg:hidden sticky top-0 z-10 bg-zinc-900 border-b border-zinc-700 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Advanced Filters</h2>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 text-zinc-400 hover:text-white transition-colors"
                >
                  <Icon icon="mdi:close" className="text-xl" />
                </button>
              </div>
            </div>

            {/* Desktop Header with X button */}
            <div className="hidden lg:block sticky top-0 z-10 bg-zinc-900 border-b border-zinc-700 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Advanced Filters</h2>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-zinc-800"
                >
                  <Icon icon="mdi:close" className="text-xl" />
                </button>
              </div>
            </div>

            <div className="p-4 lg:p-6">
              <CardFiltersComponent
                filters={filters}
                filterOptions={filterOptions}
                currentBanlist={deck.banlist}
                onFilterChange={updateFilter}
                onClearFilters={clearFilters}
                onQuickFilter={applyQuickFilter}
                onToggleMonsterType={toggleMonsterType}
                changeBanlistComponent={
                  <select
                    value={deck.banlist}
                    onChange={async (e) => await changeBanlist(e.target.value as any)}
                    className="bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="TCG">TCG</option>
                    <option value="OCG">OCG</option>
                    <option value="TCG Genesys">TCG Genesys</option>
                  </select>
                }
              />
            </div>

            <div className="lg:hidden sticky bottom-0 z-10 bg-zinc-900 border-t border-zinc-700 p-4">
              <button
                onClick={() => setShowFilters(false)}
                className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </>
      )}

      {showImportDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowImportDialog(false)}
          />

          <div className="relative bg-zinc-900 border border-zinc-700 rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Import Deck</h2>
              <button
                onClick={() => setShowImportDialog(false)}
                className="p-2 text-zinc-400 hover:text-white transition-colors"
              >
                <Icon icon="mdi:close" className="text-xl" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Deck Code
                </label>
                <textarea
                  value={importCode}
                  onChange={(e) => setImportCode(e.target.value)}
                  placeholder="Paste your deck code here..."
                  className="w-full h-32 px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex items-center justify-center">
                <div className="flex items-center gap-2 text-zinc-400 text-sm">
                  <div className="h-px bg-zinc-600 flex-1"></div>
                  <span>OR</span>
                  <div className="h-px bg-zinc-600 flex-1"></div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Load YDK File
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept=".ydk"
                    onChange={handleYDKFileUpload}
                    className="hidden"
                    id="ydk-file-input"
                  />
                  <label
                    htmlFor="ydk-file-input"
                    className="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 border border-zinc-600 rounded-lg text-white cursor-pointer transition-colors flex items-center justify-center gap-2"
                  >
                    <Icon icon="mdi:file-upload" />
                    Choose YDK File
                  </label>
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  Select a .ydk file to directly load cards into your deck
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowImportDialog(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportDeck}
                  disabled={isImporting || !importCode.trim()}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  {isImporting && <Icon icon="mdi:loading" className="animate-spin" />}
                  {isImporting ? 'Importing...' : 'Import'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Generate Codes Dialog */}
      {showCodesDialog && generatedCodes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCodesDialog(false)}
          />

          <div className="relative bg-zinc-900 border border-zinc-700 rounded-lg p-6 w-full max-w-2xl mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Generated Deck Codes</h2>
              <button
                onClick={() => setShowCodesDialog(false)}
                className="p-2 text-zinc-400 hover:text-white transition-colors"
              >
                <Icon icon="mdi:close" className="text-xl" />
              </button>
            </div>

            <div className="space-y-4">
              {/* YDKE Code */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  YDKE Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={generatedCodes.ydke}
                    readOnly
                    className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedCodes.ydke);
                      showToast('success', 'YDKE code copied to clipboard!');
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-zinc-400 hover:text-white transition-colors"
                    title="Copy to clipboard"
                  >
                    <Icon icon="mdi:content-copy" className="text-lg" />
                  </button>
                </div>
              </div>

              {/* Omega Code */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Omega Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={generatedCodes.omega}
                    readOnly
                    className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedCodes.omega);
                      showToast('success', 'Omega code copied to clipboard!');
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-zinc-400 hover:text-white transition-colors"
                    title="Copy to clipboard"
                  >
                    <Icon icon="mdi:content-copy" className="text-lg" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowCodesDialog(false)}
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};
export default DeckEditor;
