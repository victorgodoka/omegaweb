import { useState } from 'react';
import type { Card } from '../types';

export const useCardSelection = () => {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  // Handle card hover for display
  const handleCardHover = (card: Card | null) => {
    if (card) {
      setSelectedCard(card);
    }
    // Don't set to null on mouse leave - keep the last hovered card
  };

  // Handle card click from library
  const handleCardClick = (card: Card) => {
    setSelectedCard(card);
  };

  return {
    selectedCard,
    handleCardHover,
    handleCardClick
  };
};
