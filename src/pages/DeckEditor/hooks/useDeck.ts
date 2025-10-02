import { useState, useCallback, useMemo } from 'react';
import type { Card, Deck, CardTypeStats } from '../types';
import { useGenesys } from '@/contexts/GenesysContext';

export const useDeck = () => {
  const { ensureData } = useGenesys();
  const [deck, setDeck] = useState<Deck>({
    name: 'New Deck',
    format: 'TCG 15.09.2025',
    banlist: 'TCG',
    mainDeck: [],
    extraDeck: [],
    sideDeck: []
  });

  // Calculate deck statistics
  const deckStats = useMemo(() => {
    const totalCards = deck.mainDeck.reduce((sum, card) => sum + card.quantity, 0) +
                      deck.extraDeck.reduce((sum, card) => sum + card.quantity, 0) +
                      deck.sideDeck.reduce((sum, card) => sum + card.quantity, 0);

    const cardTypes: CardTypeStats = {
      monsters: 0,
      spells: 0,
      traps: 0,
      main: deck.mainDeck.reduce((sum, card) => sum + card.quantity, 0),
      extra: deck.extraDeck.reduce((sum, card) => sum + card.quantity, 0),
      side: deck.sideDeck.reduce((sum, card) => sum + card.quantity, 0)
    };

    [...deck.mainDeck, ...deck.extraDeck, ...deck.sideDeck].forEach(deckCard => {
      if (deckCard.card.humanReadableCardType.includes('Monster')) cardTypes.monsters += deckCard.quantity;
      else if (deckCard.card.humanReadableCardType.includes('Spell')) cardTypes.spells += deckCard.quantity;
      else if (deckCard.card.humanReadableCardType.includes('Trap')) cardTypes.traps += deckCard.quantity;
    });

    const totalValue = [...deck.mainDeck, ...deck.extraDeck, ...deck.sideDeck]
      .reduce((sum, deckCard) => {
        const price = parseFloat(deckCard.card.card_prices[0]?.cardmarket_price || '0');
        return sum + (price * deckCard.quantity);
      }, 0);

    return { totalCards, cardTypes, totalValue };
  }, [deck]);

  // Get max allowed copies for a card based on banlist
  const getMaxAllowedCopies = (card: Card) => {
    if (deck.banlist === 'TCG Genesys') return 3;

    const banlistInfo = card.banlist_info;
    if (!banlistInfo) return 3; // Default unlimited

    const statusKey = `ban_${deck.banlist.toLowerCase()}` as keyof typeof banlistInfo;
    const status = banlistInfo[statusKey];

    switch (status) {
      case 'Forbidden': return 0;
      case 'Limited': return 1;
      case 'Semi-Limited': return 2;
      default: return 3;
    }
  };

  // Determine if card belongs to extra deck
  const isExtraDeckCard = (card: Card): boolean => {
    return card.type.includes('Fusion') ||
           card.type.includes('Synchro') ||
           card.type.includes('Xyz') ||
           card.type.includes('Link') ||
           card.type.includes('XYZ') ||
           card.type.includes('Xyz Monster') ||
           card.type.includes('Fusion Monster') ||
           card.type.includes('Synchro Monster') ||
           card.type.includes('Link Monster') ||
           card.race === 'Xyz' ||
           card.race === 'Fusion' ||
           card.race === 'Synchro' ||
           card.race === 'Link' ||
           (card.type.includes('Monster') && card.level === undefined);
  };

  // Helper function to get total quantity of a card across all deck sections
  const getTotalCardQuantity = (cardId: number) => {
    const mainQuantity = deck.mainDeck.find(c => c.card.id === cardId)?.quantity || 0;
    const extraQuantity = deck.extraDeck.find(c => c.card.id === cardId)?.quantity || 0;
    const sideQuantity = deck.sideDeck.find(c => c.card.id === cardId)?.quantity || 0;
    return mainQuantity + extraQuantity + sideQuantity;
  };

  // Add card to deck
  const addCardToDeck = (card: Card, forceToSideDeck = false) => {
    // Check if card is allowed in TCG Genesys format
    if (deck.banlist === 'TCG Genesys') {
      const isLinkCard = card.frameType === 'link' || card.type.includes('Link');
      const isPendulumCard = card.frameType === 'pendulum' || card.type.includes('Pendulum');
      
      if (isLinkCard || isPendulumCard) {
        console.warn(`${card.name} cannot be added: Link and Pendulum cards are not allowed in TCG Genesys format`);
        return; // Don't add the card
      }
    }

    // Check total card limit across all deck sections
    const totalQuantity = getTotalCardQuantity(card.id);
    const maxAllowed = getMaxAllowedCopies(card);
    
    if (totalQuantity >= maxAllowed) {
      console.warn(`${card.name} cannot be added: Maximum ${maxAllowed} copies allowed across all deck sections (currently have ${totalQuantity})`);
      return; // Don't add the card
    }

    const canAdd = (deckType: string) => {
      if (deckType === 'main') return deck.mainDeck.length < 60;
      if (deckType === 'extra') return deck.extraDeck.length < 15;
      if (deckType === 'side') return deck.sideDeck.length < 15;
      return false;
    };

    const addToDeck = (deckType: 'main' | 'extra' | 'side') => {
      if (!canAdd(deckType)) return;

      setDeck(prevDeck => {
        const deckArray = prevDeck[deckType === 'main' ? 'mainDeck' : deckType === 'extra' ? 'extraDeck' : 'sideDeck'];
        const existingIndex = deckArray.findIndex(c => c.card.id === card.id);

        if (existingIndex >= 0) {
          // Card already exists, increase quantity
          const newDeckArray = [...deckArray];
          newDeckArray[existingIndex] = {
            ...newDeckArray[existingIndex],
            quantity: newDeckArray[existingIndex].quantity + 1
          };
          return {
            ...prevDeck,
            [deckType === 'main' ? 'mainDeck' : deckType === 'extra' ? 'extraDeck' : 'sideDeck']: newDeckArray
          };
        } else {
          // Add new card
          const newDeckArray = [...deckArray, { card, quantity: 1 }];
          return {
            ...prevDeck,
            [deckType === 'main' ? 'mainDeck' : deckType === 'extra' ? 'extraDeck' : 'sideDeck']: newDeckArray
          };
        }

        return prevDeck;
      });
    };

    if (forceToSideDeck) {
      addToDeck('side');
    } else if (isExtraDeckCard(card)) {
      addToDeck('extra');
    } else {
      addToDeck('main');
    }
  };

  // Remove card from deck
  const removeCardFromDeck = (cardId: number, deckType: 'main' | 'extra' | 'side') => {
    setDeck(prevDeck => {
      const deckArray = prevDeck[deckType === 'main' ? 'mainDeck' : deckType === 'extra' ? 'extraDeck' : 'sideDeck'];
      const existingIndex = deckArray.findIndex(c => c.card.id === cardId);

      if (existingIndex >= 0) {
        const newDeckArray = [...deckArray];
        if (newDeckArray[existingIndex].quantity > 1) {
          newDeckArray[existingIndex] = {
            ...newDeckArray[existingIndex],
            quantity: newDeckArray[existingIndex].quantity - 1
          };
        } else {
          newDeckArray.splice(existingIndex, 1);
        }

        return {
          ...prevDeck,
          [deckType === 'main' ? 'mainDeck' : deckType === 'extra' ? 'extraDeck' : 'sideDeck']: newDeckArray
        };
      }

      return prevDeck;
    });
  };

  // Handle banlist change
  const changeBanlist = useCallback(async (banlist: 'TCG' | 'OCG' | 'TCG Genesys') => {
    // If switching to TCG Genesys, ensure Genesys data is loaded
    if (banlist === 'TCG Genesys') {
      await ensureData();
    }
    
    setDeck(prevDeck => ({
      ...prevDeck,
      banlist
    }));
  }, [ensureData]);

  // Change deck name
  const changeDeckName = (name: string) => {
    setDeck(prevDeck => ({
      ...prevDeck,
      name
    }));
  };

  // Create new deck
  const createNewDeck = () => {
    setDeck({
      name: 'New Deck',
      format: 'TCG 15.09.2025',
      banlist: 'TCG',
      mainDeck: [],
      extraDeck: [],
      sideDeck: []
    });
  };

  // Load deck from data
  const loadDeck = (deckData: Deck) => {
    setDeck(deckData);
  };

  // Clear deck (keep metadata)
  const clearDeck = () => {
    setDeck(prevDeck => ({
      ...prevDeck,
      mainDeck: [],
      extraDeck: [],
      sideDeck: []
    }));
  };

  return {
    deck,
    deckStats,
    addCardToDeck,
    removeCardFromDeck,
    changeBanlist,
    changeDeckName,
    createNewDeck,
    loadDeck,
    clearDeck,
    getMaxAllowedCopies,
    isExtraDeckCard
  };
};
