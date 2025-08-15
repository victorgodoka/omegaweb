import React, { memo } from 'react';
import { Link } from 'react-router';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { cn } from "@sglara/cn";
import type { MatchHistory, Deck } from '../types';

interface MatchHistoryCardProps {
  match: MatchHistory;
  formatDate: (dateString: string) => string;
}

const MatchHistoryCard: React.FC<MatchHistoryCardProps> = memo(({ match, formatDate }) => {
  const getResultGradient = (isWinner: boolean, isDraw: boolean) => {
    if (isWinner) return 'from-green-500 to-zinc-600 border-green-500';
    if (isDraw) return 'from-yellow-500 to-zinc-600 border-yellow-500';
    return 'from-red-500 to-zinc-600 border-red-500';
  };

  const getCardImages = (decks: Deck[]) => {
    const cardIds: number[] = [];

    if (decks.length === 1) {
      // Get all ids from the single deck
      cardIds.push(...decks[0].ids);
    } else if (decks.length === 2) {
      // Get first 2 from first deck and first id from second deck
      cardIds.push(...decks[0].ids.slice(0, 2));
      cardIds.push(decks[1].ids[0]);
    } else if (decks.length >= 3) {
      // Get first id from each of the first 3 decks
      cardIds.push(decks[0].ids[0]);
      cardIds.push(decks[1].ids[0]);
      cardIds.push(decks[2].ids[0]);
    }

    return cardIds.map(id => `https://images.ygoprodeck.com/images/cards_cropped/${id}.jpg`);
  };

  const yourDeckCards = getCardImages(match.duelist.deck);
  const opponentDeckCards = getCardImages(match.opponent.deck);
  const yourDeckName = match.duelist.deck.map(deck => deck.archetype).slice(0, 3).join(' ') || 'Unknown';
  const opponentDeckName = match.opponent.deck.map(deck => deck.archetype).slice(0, 3).join(' ') || 'Unknown';

  return (
    <div className={cn(
      "w-full z-10 my-2 rounded-lg border-b-4 overflow-hidden transition-all relative bg-gradient-to-b",
      getResultGradient(match.isWinner, match.isDraw)
    )}>
      <div className="w-full overflow-hidden relative h-40 flex items-center justify-center z-0">
        {/* Time and Format Info */}
        <div className="absolute bottom-2 left-2 flex items-center space-x-2 rounded-full bg-zinc-900 px-2 py-1.5">
          <div className="text-xs bg-white text-black px-2 py-0.5 rounded-full">
            TCG
          </div>
          <div className="text-xs text-zinc-200 [text-shadow:1px_2px_1px_#000]">
            {formatDate(match.start)}
          </div>
        </div>

        {/* Your Deck Cards */}
        <div className="w-full h-full" title={yourDeckName}>
          {yourDeckCards.map((cardUrl, index) => (
            <div
              key={`your-${index}`}
              className="w-1/6 -z-10 [mask-image:linear-gradient(360deg,rgba(39,39,42,0),rgba(39,39,42,1))] opacity-85 bg-cover bg-center h-full [clip-path:polygon(25%_0%,_100%_0%,_75%_100%,_0%_100%)] absolute top-0"
              style={{
                left: `${33 - (index * 12.5)}%`,
                backgroundImage: `url("${cardUrl}"), url("/back.webp")`
              }}
            />
          ))}
        </div>

        {/* VS Image */}
        <img src="/vs.png" alt="vs" className="w-16 z-10" loading="lazy" />

        {/* Opponent Deck Cards */}
        <div className="w-full h-full" title={opponentDeckName}>
          {opponentDeckCards.map((cardUrl, index) => (
            <div
              key={`opponent-${index}`}
              className="w-1/6 -z-10 [mask-image:linear-gradient(360deg,rgba(39,39,42,0),rgba(39,39,42,1))] opacity-85 bg-cover bg-center h-full [clip-path:polygon(25%_0%,_100%_0%,_75%_100%,_0%_100%)] absolute top-0"
              style={{
                right: `${33 - (index * 12.5)}%`,
                backgroundImage: `url("${cardUrl}"), url("/back.webp")`
              }}
            />
          ))}
        </div>

        {/* Opponent Info */}
        <Link to={`/profile/${match.opponent.id}`} className="rounded-full gap-2 items-center flex bg-zinc-900 px-3 py-2 text-zinc-200 absolute bottom-2 right-2 text-right text-xs">
          <PlayerAvatar
            id={match.opponent.id}
            avatar={match.opponent.discord.avatar}
            displayname={match.opponent.discord.displayname}
            username={match.opponent.discord.username}
            rounded={true}
            bordered={true}
            color={match.isWinner ? 'gray' : match.isDraw ? 'yellow' : 'success'}
            size="sm"
          />
          <p
            className="cursor-pointer nunito-sans underline-offset-2 transition-colors hover:text-white hover:underline"
          >
            {match.opponent.discord.displayname}
          </p>
        </Link>
      </div>
    </div>
  );
});

MatchHistoryCard.displayName = 'MatchHistoryCard';

export default MatchHistoryCard;
