import React from 'react';
import type { Card, DeckCard } from '../types';
import { useGenesys } from '@/contexts/GenesysContext';

interface DeckGridProps {
  mainDeck: DeckCard[];
  extraDeck: DeckCard[];
  sideDeck: DeckCard[];
  onCardClick: (card: Card) => void;
  onCardHover: (card: Card | null) => void;
  onCardRemove: (cardId: number, deckType: 'main' | 'extra' | 'side') => void;
  currentBanlist: 'TCG' | 'OCG' | 'TCG Genesys';
}

const DeckGrid: React.FC<DeckGridProps> = ({
  mainDeck,
  extraDeck,
  sideDeck,
  onCardClick,
  onCardHover,
  onCardRemove,
  currentBanlist
}) => {
  const { genesysData } = useGenesys();
  
  // Helper function to get Genesys points for a card
  const getCardGenesysPoints = (cardName: string): number => {
    // Find card by name to get ID, then look up points
    const allCards = [...mainDeck, ...extraDeck, ...sideDeck];
    const deckCard = allCards.find(dc => dc.card.name.toLowerCase() === cardName.toLowerCase());
    if (!deckCard) return 0;
    return genesysData[deckCard.card.id] || 0;
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Main Deck Section */}
      <div>
        <h3 className="text-base lg:text-lg font-semibold text-purple-100 mb-2 lg:mb-3 flex items-center justify-between">
          <span>Main Deck</span>
          <span className="text-xs lg:text-sm text-purple-300">
            {mainDeck.length}/{mainDeck.reduce((sum, card) => sum + card.quantity, 0)} cards
          </span>
        </h3>
        {mainDeck.length === 0 ? (
          <div className="flex items-center justify-center h-24 lg:h-32 bg-purple-900/20 rounded-lg border border-purple-500/20">
            <p className="text-purple-300 text-sm lg:text-base">No cards in main deck</p>
          </div>
        ) : (
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-10 gap-1 lg:gap-2">
            {mainDeck.flatMap((deckCard) =>
              Array.from({ length: deckCard.quantity }, (_, index) => (
                <div
                  key={`${deckCard.card.id}-${index}`}
                  className="relative group cursor-pointer transition-all duration-200 hover:scale-105 touch-manipulation"
                  onClick={() => onCardClick(deckCard.card)}
                  onMouseEnter={() => onCardHover(deckCard.card)}
                  onMouseLeave={() => onCardHover(null)}
                >
                  <div className="aspect-[59/86] overflow-hidden rounded-sm lg:rounded">
                    <img
                      src={deckCard.card.card_images[0]?.image_url_small || '/placeholder-card.png'}
                      alt={deckCard.card.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />

                    {/* Genesys Points Badge */}
                    {currentBanlist === 'TCG Genesys' && getCardGenesysPoints(deckCard.card.name) > 0 && (
                      <div className="absolute top-0.5 right-0.5 lg:top-1 lg:right-1 bg-blue-600 text-white w-5 h-5 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-xs lg:text-sm font-bold shadow-lg border border-white">
                        {getCardGenesysPoints(deckCard.card.name)}
                      </div>
                    )}

                    {/* Remove Button - Touch Friendly */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCardRemove(deckCard.card.id, 'main');
                      }}
                      className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 lg:group-hover:opacity-100 active:opacity-100 transition-opacity duration-200 flex items-center justify-center touch-manipulation"
                    >
                      <span className="text-white font-bold text-sm lg:text-lg">×</span>
                    </button>
                  </div>

                  <div className="mt-0.5 lg:mt-1 text-xs text-purple-200 text-center truncate hidden lg:block">
                    {deckCard.card.name}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Extra Deck Section */}
      <div>
        <h3 className="text-base lg:text-lg font-semibold text-purple-100 mb-2 lg:mb-3 flex items-center justify-between">
          <span>Extra Deck</span>
          <span className="text-xs lg:text-sm text-purple-300">
            {extraDeck.length}/{extraDeck.reduce((sum, card) => sum + card.quantity, 0)} cards
          </span>
        </h3>
        {extraDeck.length === 0 ? (
          <div className="flex items-center justify-center h-20 lg:h-32 bg-purple-900/20 rounded-lg border border-purple-500/20">
            <p className="text-purple-300 text-sm lg:text-base">No cards in extra deck</p>
          </div>
        ) : (
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-15 gap-2 lg:gap-3">
            {extraDeck.flatMap((deckCard) =>
              Array.from({ length: deckCard.quantity }, (_, index) => (
                <div
                  key={`${deckCard.card.id}-${index}`}
                  className="relative group cursor-pointer transition-all duration-200 hover:scale-105 touch-manipulation"
                  onClick={() => onCardClick(deckCard.card)}
                  onMouseEnter={() => onCardHover(deckCard.card)}
                  onMouseLeave={() => onCardHover(null)}
                >
                  <div className="aspect-[59/86] bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-lg border border-purple-500/30 overflow-hidden">
                    <img
                      src={deckCard.card.card_images[0]?.image_url_small || '/placeholder-card.png'}
                      alt={deckCard.card.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />

                    {/* Genesys Points Badge */}
                    {currentBanlist === 'TCG Genesys' && getCardGenesysPoints(deckCard.card.name) > 0 && (
                      <div className="absolute top-0.5 right-0.5 lg:top-1 lg:right-1 bg-blue-600 text-white w-5 h-5 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-xs lg:text-sm font-bold shadow-lg border border-white">
                        {getCardGenesysPoints(deckCard.card.name)}
                      </div>
                    )}

                    {/* Remove Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCardRemove(deckCard.card.id, 'extra');
                      }}
                      className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity duration-200 flex items-center justify-center touch-manipulation"
                    >
                      <span className="text-white font-bold text-sm lg:text-lg">×</span>
                    </button>
                  </div>

                  <div className="mt-0.5 lg:mt-1 text-xs text-purple-200 text-center truncate hidden lg:block">
                    {deckCard.card.name}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Side Deck Section */}
      <div>
        <h3 className="text-base lg:text-lg font-semibold text-purple-100 mb-2 lg:mb-3 flex items-center justify-between">
          <span>Side Deck</span>
          <span className="text-xs lg:text-sm text-purple-300">
            {sideDeck.length}/{sideDeck.reduce((sum, card) => sum + card.quantity, 0)} cards
          </span>
        </h3>
        {sideDeck.length === 0 ? (
          <div className="flex items-center justify-center h-20 lg:h-32 bg-purple-900/20 rounded-lg border border-purple-500/20">
            <p className="text-purple-300 text-sm lg:text-base">No cards in side deck</p>
          </div>
        ) : (
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-15 gap-2 lg:gap-3">
            {sideDeck.flatMap((deckCard) =>
              Array.from({ length: deckCard.quantity }, (_, index) => (
                <div
                  key={`${deckCard.card.id}-${index}`}
                  className="relative group cursor-pointer transition-all duration-200 hover:scale-105 touch-manipulation"
                  onClick={() => onCardClick(deckCard.card)}
                  onMouseEnter={() => onCardHover(deckCard.card)}
                  onMouseLeave={() => onCardHover(null)}
                >
                  <div className="aspect-[59/86] bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-lg border border-purple-500/30 overflow-hidden">
                    <img
                      src={deckCard.card.card_images[0]?.image_url_small || '/placeholder-card.png'}
                      alt={deckCard.card.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />

                    {/* Genesys Points Badge */}
                    {currentBanlist === 'TCG Genesys' && getCardGenesysPoints(deckCard.card.name) > 0 && (
                      <div className="absolute top-0.5 right-0.5 lg:top-1 lg:right-1 bg-blue-600 text-white w-5 h-5 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-xs lg:text-sm font-bold shadow-lg border border-white">
                        {getCardGenesysPoints(deckCard.card.name)}
                      </div>
                    )}

                    {/* Remove Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCardRemove(deckCard.card.id, 'side');
                      }}
                      className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity duration-200 flex items-center justify-center touch-manipulation"
                    >
                      <span className="text-white font-bold text-sm lg:text-lg">×</span>
                    </button>
                  </div>

                  <div className="mt-0.5 lg:mt-1 text-xs text-purple-200 text-center truncate hidden lg:block">
                    {deckCard.card.name}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeckGrid;
