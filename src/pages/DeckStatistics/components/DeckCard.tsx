import React from 'react';
import { useTranslation } from 'react-i18next';
import type { DeckStat } from '../types';
import { useCache } from '@/contexts/CacheContext';
import { tcgHref } from '@/utils/Functions';
import { findWithImagesId } from '@/utils/Cards';

interface DeckCardProps {
  deckStat: DeckStat;
  rank: number;
}

const DeckCard: React.FC<DeckCardProps> = ({ deckStat, rank }) => {
  const { t } = useTranslation();
  const { cardStats } = useCache();

  const winRate = deckStat.totalMatches > 0 
    ? ((deckStat.wins / deckStat.totalMatches) * 100).toFixed(1)
    : '0.0';

  const getWinRateColor = (rate: number) => {
    if (rate >= 60) return 'text-green-400';
    if (rate >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500 text-yellow-900';
    if (rank === 2) return 'bg-gray-400 text-gray-900';
    if (rank === 3) return 'bg-orange-600 text-orange-100';
    return 'bg-zinc-600 text-zinc-200';
  };

  // Generate card images based on archetype IDs
  const getCardImages = () => {
    console.log('Archetype:', deckStat.archetype.name, 'IDs structure:', deckStat.archetype.ids);
    
    if (!deckStat.archetype.ids || deckStat.archetype.ids.length === 0) {
      return [];
    }

    const images = [];
    
    // Get main archetype cards (first array)
    const mainArchetypeCards = deckStat.archetype.ids[0] || [];
    // Get second archetype cards (second array, if exists)
    const secondArchetypeCards = deckStat.archetype.ids[1] || [];
    
    console.log('Main archetype cards:', mainArchetypeCards);
    console.log('Second archetype cards:', secondArchetypeCards);
    
    // Add 2 images from main archetype
    for (let i = 0; i < Math.min(2, mainArchetypeCards.length); i++) {
      const cardId = mainArchetypeCards[i];
      if (cardId) {
        const imageUrl = `https://ygopro.online/assets/card-images/common/${cardId}.jpg`;
        
        images.push({
          id: cardId,
          url: imageUrl,
          alt: `${deckStat.archetype.name} main card ${i + 1}`,
          isMain: true
        });
      }
    }
    // Add 1 image from second archetype if available, otherwise add 1 more from main
    if (secondArchetypeCards.length > 0) {
      const cardId = secondArchetypeCards[0];
      if (cardId) {
        const imageUrl = `https://ygopro.online/assets/card-images/common/${cardId}.jpg`;
        
        images.push({
          id: cardId,
          url: imageUrl,
          alt: `${deckStat.archetype.name} secondary card`,
          isMain: false,
          cardName: cardStats.find(card => card.id === cardId || findWithImagesId(card.card_images, cardId))!.name
        });
      }
    } else if (images.length < 3 && mainArchetypeCards.length > 2) {
      const cardId = mainArchetypeCards[2];
      if (cardId) {
        const imageUrl = `https://ygopro.online/assets/card-images/common/${cardId}.jpg`;
        console.log(cardStats.find(card => card.id === cardId))
        
        images.push({
          id: cardId,
          url: imageUrl,
          alt: `${deckStat.archetype.name} main card 3`,
          isMain: true,
          cardName: cardStats.find(card => card.id === cardId || findWithImagesId(card.card_images, cardId))!.name
        });
      }
    }

    return images;
  };

  const cardImages = getCardImages();

  return (
    <div className="bg-zinc-800 rounded-lg p-4 hover:bg-zinc-750 transition-colors border border-zinc-700 hover:border-zinc-600">
      {/* Rank Badge */}
      <div className="flex justify-between items-start mb-3">
        <div className={`px-2 py-1 rounded-full text-xs font-bold ${getRankBadgeColor(rank)}`}>
          #{rank}
        </div>
        <div className="text-right">
          <div className="text-xs text-zinc-400">
            {t('deck_statistics.matches')}
          </div>
          <div className="text-lg font-bold text-blue-400">
            {deckStat.totalMatches.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Archetype Name */}
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2">
          {deckStat.archetype.name}
        </h3>
        <div className="text-xs text-zinc-400">
          {deckStat.archetype.qty} {t('deck_statistics.cards_in_archetype')}
        </div>
      </div>

      {/* Card Images */}
      {cardImages.length > 0 && (
        <div className="mb-4">
          <div className="flex gap-1 justify-center">
            {cardImages.map((image, index) => (
              <a
                key={`${image.id}-${index}`}
                href={tcgHref(image.cardName)}
                target="_blank"
                title={image.cardName}
                className="relative group w-24 min-h-34"
              >
                <img
                  src={image.url}
                  alt={image.alt}
                  className="w-full h-full object-cover rounded border border-zinc-600 group-hover:border-zinc-400 transition-colors"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iODciIHZpZXdCb3g9IjAgMCA2MCA4NyIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9Ijg3IiByeD0iNCIgZmlsbD0iIzM5NDA0YSIvPgo8cGF0aCBkPSJNMjAgMzBIMjVWMzVIMzBWNDBIMzVWNDVIMzBWNTBIMjVWNDVIMjBWNDBIMTVWMzVIMjBWMzBaIiBmaWxsPSIjNmI3MjgwIi8+Cjx0ZXh0IHg9IjMwIiB5PSI2NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzZiNzI4MCIgZm9udC1zaXplPSI4Ij5DYXJkPC90ZXh0Pgo8L3N2Zz4K';
                    target.onerror = null;
                  }}
                />
                {image.isMain && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border border-zinc-800" />
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Win Rate */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-zinc-400">{t('deck_statistics.win_rate')}</span>
          <span className={`text-sm font-bold ${getWinRateColor(parseFloat(winRate))}`}>
            {winRate}%
          </span>
        </div>
        <div className="w-full bg-zinc-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              parseFloat(winRate) >= 60 
                ? 'bg-green-500' 
                : parseFloat(winRate) >= 50 
                ? 'bg-yellow-500' 
                : 'bg-red-500'
            }`}
            style={{ width: `${winRate}%` }}
          />
        </div>
      </div>

      {/* Win/Loss Stats */}
      <div className="grid grid-cols-2 gap-4 text-center">
        <div>
          <div className="text-lg font-bold text-green-400">
            {deckStat.wins.toLocaleString()}
          </div>
          <div className="text-xs text-zinc-400">
            {t('deck_statistics.wins')}
          </div>
        </div>
        <div>
          <div className="text-lg font-bold text-red-400">
            {deckStat.losses.toLocaleString()}
          </div>
          <div className="text-xs text-zinc-400">
            {t('deck_statistics.losses')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeckCard;
