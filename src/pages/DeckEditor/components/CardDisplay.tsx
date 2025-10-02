import React from 'react';
import type { Card } from '../types';
import { useGenesys } from '@/contexts/GenesysContext';

interface CardDisplayProps {
  card: Card | null;
  currentBanlist?: 'TCG' | 'OCG' | 'TCG Genesys';
}

const CardDisplay: React.FC<CardDisplayProps> = ({ card, currentBanlist = 'TCG' }) => {
  const { genesysData } = useGenesys();
  
  // Helper function to get Genesys points for a card
  const getCardGenesysPoints = (): number => {
    if (currentBanlist !== 'TCG Genesys') return 0;
    return genesysData[card?.id || 0] || 0;
  };
  if (!card) {
    return (
      <div className="flex flex-col items-center justify-center h-48 lg:h-full bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-lg lg:rounded-xl border border-purple-500/30 p-4 lg:p-8">
        <div className="text-purple-400 text-center">
          <div className="text-2xl lg:text-4xl mb-2">🃏</div>
          <p className="text-sm lg:text-base">Select a card to preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-lg lg:rounded-xl border border-purple-500/30 p-3 lg:p-4 mb-3 lg:mb-4 relative">
        <div className="aspect-[59/86] lg:aspect-auto lg:h-full">
          <img
            src={card.card_images[0]?.image_url || '/placeholder-card.png'}
            alt={card.name}
            className="w-full h-full object-contain rounded"
            loading="lazy"
          />
          
          {/* Genesys Points Badge */}
          {currentBanlist === 'TCG Genesys' && getCardGenesysPoints() > 0 && (
            <div className="absolute top-2 right-2 bg-blue-600 text-white text-lg font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-lg border-2 border-white">
              {getCardGenesysPoints()}
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile: Card Info Below Image */}
      <div className="lg:hidden bg-zinc-900/50 rounded-lg p-3 space-y-2">
        <h3 className="text-sm font-semibold text-white truncate">{card.name}</h3>
        <p className="text-xs text-zinc-300 line-clamp-3">{card.desc}</p>
        {card.atk !== undefined && (
          <div className="flex gap-3 text-xs">
            <span className="text-orange-400">ATK: {card.atk}</span>
            {card.def !== undefined && (
              <span className="text-blue-400">DEF: {card.def}</span>
            )}
            {card.level && (
              <span className="text-yellow-400">LV: {card.level}</span>
            )}
          </div>
        )}
        {card.type && (
          <div className="text-xs text-purple-300">
            {card.type}
          </div>
        )}
      </div>
    </div>
  );
};

export default CardDisplay;
