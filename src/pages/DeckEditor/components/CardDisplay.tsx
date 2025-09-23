import React from 'react';
import type { Card } from '../types';

interface CardDisplayProps {
  card: Card | null;
}

const CardDisplay: React.FC<CardDisplayProps> = ({ card }) => {
  if (!card) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-xl border border-purple-500/30 p-8">
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-xl border border-purple-500/30 p-4 mb-4 flex-shrink-0">
        <img
          src={card.card_images[0]?.image_url || '/placeholder-card.png'}
          alt={card.name}
          className="w-full h-full object-contain rounded-lg"
          loading="lazy"
        />
      </div>
    </div>
  );
};

export default CardDisplay;
