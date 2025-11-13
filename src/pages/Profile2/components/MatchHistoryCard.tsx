import React from 'react';
import { Icon } from '@iconify/react';
import { Link } from 'react-router';
import { tcgHref } from '@/utils/Functions';
import type { MatchHistory } from '@/pages/Profile/types';

interface MatchHistoryCardProps {
  match: MatchHistory;
  formatMatchDuration: (start: string, end: string) => string;
  cardStats: Array<{ id: number; name: string }>;
}

const MatchHistoryCard: React.FC<MatchHistoryCardProps> = ({ match, formatMatchDuration, cardStats }) => {
  const isWin = match.isWinner;
  const isDraw = match.isDraw;

  // Get cards based on qtd from each deck
  const getMyDeckCards = () => {
    const cards: Array<{ id: number; name: string }> = [];
    match.duelist.deck.forEach(deck => {
      const cardsToAdd = deck.ids.slice(0, deck.qtd);
      cardsToAdd.forEach(id => {
        const cardData = cardStats.find(card => card.id === id);
        const cardName = cardData?.name || 'Unknown Card';
        cards.push({ id, name: cardName });
      });
    });
    return cards;
  };

  const getOpponentDeckCards = () => {
    const cards: Array<{ id: number; name: string }> = [];
    match.opponent.deck.forEach(deck => {
      const cardsToAdd = deck.ids.slice(0, deck.qtd);
      cardsToAdd.forEach(id => {
        const cardData = cardStats.find(card => card.id === id);
        const cardName = cardData?.name || 'Unknown Card';
        cards.push({ id, name: cardName });
      });
    });
    return cards;
  };

  const myDeckCards = getMyDeckCards();
  const opponentDeckCards = getOpponentDeckCards();
  const myDeckNames = match.duelist.deck.map(d => d.archetype).join(' / ');
  const opponentDeckNames = match.opponent.deck.map(d => d.archetype).join(' / ');

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border transition-all duration-300 ${
        isWin
          ? 'bg-linear-to-br from-green-900/20 via-green-900/10 to-transparent border-green-500/30 hover:border-green-500/60 hover:shadow-lg hover:shadow-green-500/20'
          : isDraw
          ? 'bg-linear-to-br from-yellow-900/20 via-yellow-900/10 to-transparent border-yellow-500/30 hover:border-yellow-500/60 hover:shadow-lg hover:shadow-yellow-500/20'
          : 'bg-linear-to-br from-red-900/20 via-red-900/10 to-transparent border-red-500/30 hover:border-red-500/60 hover:shadow-lg hover:shadow-red-500/20'
      }`}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
      </div>

      <div className="relative p-4 md:p-5">
        {/* Header */}
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex items-center justify-between">
            {/* Result Badge */}
            <div
              className={`px-3 py-1.5 rounded-lg font-bold text-sm shadow-lg ${
                isWin
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : isDraw
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}
            >
              {isWin ? 'WIN' : isDraw ? 'DRAW' : 'LOSS'}
            </div>

            {/* Duration */}
            <div className="flex items-center gap-1.5 text-zinc-400 text-sm">
              <Icon icon="mdi:clock-outline" className="text-base" />
              <span>{formatMatchDuration(match.start, match.end)}</span>
            </div>
          </div>

          {/* Date */}
          <div className="text-xs text-zinc-500">
            {new Date(match.start).toLocaleDateString()} • {new Date(match.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Duel Section */}
        <div className="space-y-3">
          {/* My Deck */}
          <div className="flex items-center gap-3">
            {/* Card Images */}
            <div className="flex -space-x-3">
              {myDeckCards.map((card, idx) => (
                <a
                  key={idx}
                  href={tcgHref(card.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative w-12 h-16 rounded-md overflow-hidden border-2 border-zinc-700 shadow-lg transform transition-transform hover:scale-125 hover:z-10 hover:border-blue-500"
                  style={{ zIndex: myDeckCards.length - idx }}
                  title={card.name}
                >
                  <img
                    src={`https://images.ygoprodeck.com/images/cards_cropped/${card.id}.jpg`}
                    alt={card.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23374151" width="100" height="100"/%3E%3C/svg%3E';
                    }}
                  />
                </a>
              ))}
            </div>

            {/* Deck Info */}
            <div className="flex-1 min-w-0">
              <div className="text-xs text-zinc-500 mb-0.5">You</div>
              <div className="font-semibold text-zinc-200 truncate">{myDeckNames}</div>
            </div>
          </div>

          {/* VS Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-linear-to-r from-transparent via-zinc-700 to-transparent"></div>
            <div className="px-3 py-1 bg-zinc-800/50 rounded-full text-xs font-bold text-zinc-400 border border-zinc-700/50">
              VS
            </div>
            <div className="flex-1 h-px bg-linear-to-r from-transparent via-zinc-700 to-transparent"></div>
          </div>

          {/* Opponent Deck */}
          <div className="flex items-center gap-3">
            {/* Card Images */}
            <div className="flex -space-x-3">
              {opponentDeckCards.map((card, idx) => (
                <a
                  key={idx}
                  href={tcgHref(card.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative w-12 h-16 rounded-md overflow-hidden border-2 border-zinc-700 shadow-lg transform transition-transform hover:scale-125 hover:z-10 hover:border-blue-500"
                  style={{ zIndex: opponentDeckCards.length - idx }}
                  title={card.name}
                >
                  <img
                    src={`https://images.ygoprodeck.com/images/cards_cropped/${card.id}.jpg`}
                    alt={card.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23374151" width="100" height="100"/%3E%3C/svg%3E';
                    }}
                  />
                </a>
              ))}
            </div>

            {/* Opponent Info */}
            <div className="flex-1 min-w-0">
              <div className="text-xs text-zinc-500 mb-0.5">Opponent</div>
              <Link
                to={`/profile2/${match.opponent.id}`}
                className="font-semibold text-zinc-200 truncate hover:text-blue-400 transition-colors block"
              >
                {match.opponent.discord.displayname}
              </Link>
              <div className="text-xs text-zinc-400 truncate">{opponentDeckNames}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className={`absolute inset-0 ${
          isWin
            ? 'bg-linear-to-br from-green-500/5 to-transparent'
            : isDraw
            ? 'bg-linear-to-br from-yellow-500/5 to-transparent'
            : 'bg-linear-to-br from-red-500/5 to-transparent'
        }`}></div>
      </div>
    </div>
  );
};

export default MatchHistoryCard;
