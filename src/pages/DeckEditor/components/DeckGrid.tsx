import React from 'react';
import type { Card, DeckCard } from '../types';
import { getCardGenesysPoints } from '@/utils/Genesys';

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
  return (
    <div className="space-y-6">
      {/* Main Deck Section */}
      <div>
        <h3 className="text-lg font-semibold text-purple-100 mb-3 flex items-center justify-between">
          <span>Main Deck</span>
          <span className="text-sm text-purple-300">
            {mainDeck.length}/60 cards
          </span>
        </h3>
        {mainDeck.length === 0 ? (
          <div className="flex items-center justify-center h-32 bg-purple-900/20 rounded-lg border border-purple-500/20">
            <p className="text-purple-300">No cards in main deck</p>
          </div>
        ) : (
          <div className="grid grid-cols-10 gap-2">
            {mainDeck.flatMap((deckCard) =>
              Array.from({ length: deckCard.quantity }, (_, index) => (
                <div
                  key={`${deckCard.card.id}-${index}`}
                  className="relative group cursor-pointer transition-all duration-200 hover:scale-105"
                  onClick={() => onCardClick(deckCard.card)}
                  onMouseEnter={() => onCardHover(deckCard.card)}
                  onMouseLeave={() => onCardHover(null)}
                >
                  <div className="overflow-hidden">
                    <img
                      src={deckCard.card.card_images[0]?.image_url_small || '/placeholder-card.png'}
                      alt={deckCard.card.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />

                    {/* Genesys Points Badge */}
                    {currentBanlist === 'TCG Genesys' && getCardGenesysPoints(deckCard.card.name) > 0 && (
                      <div className="absolute top-1 right-1 bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                        {getCardGenesysPoints(deckCard.card.name)}
                      </div>
                    )}

                    {/* Remove Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCardRemove(deckCard.card.id, 'main');
                      }}
                      className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
                    >
                      <span className="text-white font-bold text-lg">×</span>
                    </button>
                  </div>

                  <div className="mt-1 text-xs text-purple-200 text-center truncate">
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
        <h3 className="text-lg font-semibold text-purple-100 mb-3 flex items-center justify-between">
          <span>Extra Deck</span>
          <span className="text-sm text-purple-300">
            {extraDeck.length}/15 cards
          </span>
        </h3>
        {extraDeck.length === 0 ? (
          <div className="flex items-center justify-center h-32 bg-purple-900/20 rounded-lg border border-purple-500/20">
            <p className="text-purple-300">No cards in extra deck</p>
          </div>
        ) : (
          <div className="grid grid-cols-15 gap-2">
            {extraDeck.flatMap((deckCard) =>
              Array.from({ length: deckCard.quantity }, (_, index) => (
                <div
                  key={`${deckCard.card.id}-${index}`}
                  className="relative group cursor-pointer transition-all duration-200 hover:scale-105"
                  onClick={() => onCardClick(deckCard.card)}
                  onMouseEnter={() => onCardHover(deckCard.card)}
                  onMouseLeave={() => onCardHover(null)}
                >
                  <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-lg border border-purple-500/30 overflow-hidden">
                    <img
                      src={deckCard.card.card_images[0]?.image_url_small || '/placeholder-card.png'}
                      alt={deckCard.card.name}
                      className="w-full h-24 object-cover"
                      loading="lazy"
                    />

                    {/* Genesys Points Badge */}
                    {currentBanlist === 'TCG Genesys' && getCardGenesysPoints(deckCard.card.name) > 0 && (
                      <div className="absolute top-1 right-1 bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                        {getCardGenesysPoints(deckCard.card.name)}
                      </div>
                    )}

                    {/* Remove Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCardRemove(deckCard.card.id, 'extra');
                      }}
                      className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
                    >
                      <span className="text-white font-bold text-lg">×</span>
                    </button>
                  </div>

                  <div className="mt-1 text-xs text-purple-200 text-center truncate">
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
        <h3 className="text-lg font-semibold text-purple-100 mb-3 flex items-center justify-between">
          <span>Side Deck</span>
          <span className="text-sm text-purple-300">
            {sideDeck.length}/15 cards
          </span>
        </h3>
        {sideDeck.length === 0 ? (
          <div className="flex items-center justify-center h-32 bg-purple-900/20 rounded-lg border border-purple-500/20">
            <p className="text-purple-300">No cards in side deck</p>
          </div>
        ) : (
          <div className="grid grid-cols-15 gap-2">
            {sideDeck.flatMap((deckCard) =>
              Array.from({ length: deckCard.quantity }, (_, index) => (
                <div
                  key={`${deckCard.card.id}-${index}`}
                  className="relative group cursor-pointer transition-all duration-200 hover:scale-105"
                  onClick={() => onCardClick(deckCard.card)}
                  onMouseEnter={() => onCardHover(deckCard.card)}
                  onMouseLeave={() => onCardHover(null)}
                >
                  <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-lg border border-purple-500/30 overflow-hidden">
                    <img
                      src={deckCard.card.card_images[0]?.image_url_small || '/placeholder-card.png'}
                      alt={deckCard.card.name}
                      className="w-full h-24 object-cover"
                      loading="lazy"
                    />

                    {/* Genesys Points Badge */}
                    {currentBanlist === 'TCG Genesys' && getCardGenesysPoints(deckCard.card.name) > 0 && (
                      <div className="absolute top-1 right-1 bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                        {getCardGenesysPoints(deckCard.card.name)}
                      </div>
                    )}

                    {/* Remove Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCardRemove(deckCard.card.id, 'side');
                      }}
                      className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
                    >
                      <span className="text-white font-bold text-lg">×</span>
                    </button>
                  </div>

                  <div className="mt-1 text-xs text-purple-200 text-center truncate">
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
