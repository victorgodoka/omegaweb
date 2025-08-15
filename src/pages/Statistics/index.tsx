import { useState, useEffect, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { tcgHref } from '@/utils/Functions';
import { api } from '@/utils/Api';

// Lazy load heavy components
const UniqueLoginsStats = lazy(() => import("@/components/UniqueLoginsStats"));
const DiscordBanner = lazy(() => import("@/components/DiscordBanner"));

interface CardStat {
  n: string;  // card name
  r: number;  // rating
  w: number;  // wins
  l: number;  // losses
  id: number; // card id
}

interface DeckStat {
  n: string;  // deck name
  r: number;  // rating
  w: number;  // wins
  l: number;  // losses
  c: number;  // card id that represents the deck
}

const Statistics = () => {
  const { t } = useTranslation();
  const [cardStats, setCardStats] = useState<CardStat[]>([]);
  const [deckStats, setDeckStats] = useState<DeckStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        
        // Fetch card stats
        const cardResponse = await api.external.duelistsUnite.getDatabase('card_stats', 'tcg_ranked');
        if (!cardResponse.ok) {
          throw new Error('Failed to fetch card statistics');
        }
        if (!cardResponse.data?.Success) {
          throw new Error('Card API returned unsuccessful response');
        }
        const parsedCardStats: CardStat[] = JSON.parse(cardResponse.data.Value);
        setCardStats(parsedCardStats);
        
        // Fetch deck stats
        const deckResponse = await api.external.duelistsUnite.getDatabase('deck_stats', 'tcg_ranked');
        if (!deckResponse.ok) {
          throw new Error('Failed to fetch deck statistics');
        }
        if (!deckResponse.data?.Success) {
          throw new Error('Deck API returned unsuccessful response');
        }
        const parsedDeckStats: DeckStat[] = JSON.parse(deckResponse.data.Value);
        setDeckStats(parsedDeckStats);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const getTier = (index: number): { name: string; color: string; gradient: string } => {
    if (index < 3) return { name: 'SS', color: 'text-yellow-400', gradient: 'from-yellow-400 to-yellow-600' };
    if (index < 8) return { name: 'S', color: 'text-red-400', gradient: 'from-red-400 to-red-600' };
    if (index < 18) return { name: 'A', color: 'text-blue-400', gradient: 'from-blue-400 to-blue-600' };
    return { name: 'B', color: 'text-green-400', gradient: 'from-green-400 to-green-600' };
  };

  const calculateWinRate = (wins: number, losses: number): number => {
    const total = wins + losses;
    return total > 0 ? (wins / total) * 100 : 0;
  };

  const calculateUsage = (wins: number, losses: number): number => {
    return wins + losses;
  };

  // Sort by usage (total games) for most used cards
  const mostUsedCards = [...cardStats]
    .sort((a, b) => calculateUsage(b.w, b.l) - calculateUsage(a.w, a.l))
    .slice(0, 25);

  // Sort by rating first, then by win rate for top rated cards
  const topRatedCards = [...cardStats]
    .sort((a, b) => b.r - a.r)
    .slice(0, 25)
    .sort((a, b) => calculateWinRate(b.w, b.l) - calculateWinRate(a.w, a.l));

  // Sort by rating first, then by win rate for top rated decks
  const topRatedDecks = [...deckStats]
    .sort((a, b) => b.r - a.r)
    .slice(0, 15)
    .sort((a, b) => calculateWinRate(b.w, b.l) - calculateWinRate(a.w, a.l));

  const CardTierItem = ({ card, index }: { card: CardStat; index: number }) => {
    const tier = getTier(index);
    const winRate = calculateWinRate(card.w, card.l);
    const usage = calculateUsage(card.w, card.l);

    return (
      <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 hover:border-zinc-600 transition-all">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <img
              src={`https://images.ygoprodeck.com/images/cards_cropped/${card.id}.jpg`}
              alt={card.n}
              className="w-16 h-22 object-cover rounded border border-zinc-600"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/card-placeholder.png';
              }}
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-1 rounded text-xs font-bold bg-gradient-to-r ${tier.gradient} text-white`}>
                {tier.name}
              </span>
              <span className="text-zinc-400 text-sm">#{index + 1}</span>
            </div>
            
            <a 
              href={tcgHref(card.n)} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white font-medium text-sm truncate mb-2 hover:text-orange-400 transition-colors block"
            >
              {card.n}
            </a>
            
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="text-zinc-400">{t('statistics.usage')}</div>
                <div className="text-white font-semibold">{usage}</div>
              </div>
              <div className="text-center">
                <div className="text-zinc-400">{t('statistics.win_rate')}</div>
                <div className={`font-semibold ${
                  winRate >= 60 ? 'text-green-400' : 
                  winRate >= 50 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {winRate.toFixed(1)}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-zinc-400">{t('statistics.rating')}</div>
                <div className="text-blue-400 font-semibold">{card.r}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const WinRateChart = ({ cards }: { cards: CardStat[] }) => {
    return (
      <div className="space-y-3">
        {cards.map((card, index) => {
          const winRate = calculateWinRate(card.w, card.l);
          const usage = calculateUsage(card.w, card.l);
          
          return (
            <div key={card.id} className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 hover:bg-zinc-800/80 transition-all duration-200">
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div className="w-8 h-8 bg-zinc-700 rounded-lg flex items-center justify-center text-zinc-300 text-sm font-semibold">
                  {index + 1}
                </div>
                
                {/* Card Image */}
                <img
                  src={`https://images.ygoprodeck.com/images/cards_cropped/${card.id}.jpg`}
                  alt={card.n}
                  className="w-10 h-14 object-cover rounded border border-zinc-600"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/card-placeholder.png';
                  }}
                />
                
                {/* Card Info */}
                <div className="flex-1 min-w-0">
                  <a 
                    href={tcgHref(card.n)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-white font-medium hover:text-orange-400 transition-colors block mb-1"
                  >
                    {card.n}
                  </a>
                  <div className="text-zinc-400 text-sm">
                    {card.w}W • {card.l}L • {usage} {t('statistics.games')}
                  </div>
                </div>
                
                {/* Win Rate */}
                <div className="text-right">
                  <div className={`text-lg font-semibold mb-1 ${
                    winRate >= 65 ? 'text-green-400' : 
                    winRate >= 55 ? 'text-blue-400' : 
                    winRate >= 45 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {winRate.toFixed(1)}%
                  </div>
                  <div className="w-24 bg-zinc-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        winRate >= 65 ? 'bg-green-500' : 
                        winRate >= 55 ? 'bg-blue-500' : 
                        winRate >= 45 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${winRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const DeckChart = ({ decks }: { decks: DeckStat[] }) => {
    return (
      <div className="space-y-3">
        {decks.map((deck, index) => {
          const winRate = calculateWinRate(deck.w, deck.l);
          const usage = calculateUsage(deck.w, deck.l);
          
          return (
            <div key={`${deck.c}-${deck.n}`} className="bg-zinc-800/70 border border-zinc-600 rounded-lg p-4 hover:bg-zinc-700/70 transition-colors duration-200">
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div className="w-8 h-8 bg-zinc-700 rounded flex items-center justify-center text-zinc-300 text-sm font-medium">
                  {index + 1}
                </div>
                
                {/* Deck Representative Card */}
                <img
                  src={`https://images.ygoprodeck.com/images/cards_cropped/${deck.c}.jpg`}
                  alt={deck.n}
                  className="w-12 h-16 object-cover rounded border border-zinc-600"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/card-placeholder.png';
                  }}
                />
                
                {/* Deck Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-base mb-1">
                    {deck.n}
                  </h3>
                  <div className="text-zinc-400 text-sm">
                    {deck.w}W • {deck.l}L • {usage} {t('statistics.games')}
                  </div>
                </div>
                
                {/* Win Rate */}
                <div className="text-right flex items-center gap-3">
                  <div className={`text-xl font-semibold ${
                    winRate >= 65 ? 'text-green-400' : 
                    winRate >= 55 ? 'text-blue-400' : 
                    winRate >= 45 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {winRate.toFixed(1)}%
                  </div>
                  <div className="w-24 bg-zinc-700 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${
                        winRate >= 65 ? 'bg-green-500' : 
                        winRate >= 55 ? 'bg-blue-500' : 
                        winRate >= 45 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${winRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center px-4 mt-12">
        <Suspense fallback={<div className="h-32 bg-zinc-800 rounded-lg animate-pulse"></div>}>
          <DiscordBanner />
        </Suspense>
        <div className="flex items-center justify-center py-12">
          <Icon icon="mdi:loading" className="animate-spin w-8 h-8 text-orange-500" />
          <span className="ml-2 text-zinc-400">{t('statistics.loading')}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex flex-col items-center px-4 mt-12">
        <Suspense fallback={<div className="h-32 bg-zinc-800 rounded-lg animate-pulse"></div>}>
          <DiscordBanner />
        </Suspense>
        <div className="text-center py-12">
          <Icon icon="mdi:alert-circle" className="w-12 h-12 text-red-500 mx-auto mb-2" />
          <p className="text-red-400">{error || t('statistics.error')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center px-4 mt-12 space-y-8">
      <Suspense fallback={<div className="h-32 bg-zinc-800 rounded-lg animate-pulse"></div>}>
        <DiscordBanner />
      </Suspense>
      <Suspense fallback={<div className="h-64 bg-zinc-800 rounded-lg animate-pulse"></div>}>
        <UniqueLoginsStats />
      </Suspense>
      
      {/* Card Statistics */}
      <div className="w-full max-w-7xl space-y-8">
        {/* Most Used Cards */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Icon icon="mdi:trending-up" className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl font-bold text-white">{t('statistics.most_used_cards')}</h2>
            <div className="text-zinc-400 text-sm">{t('statistics.most_used_cards_desc')}</div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {mostUsedCards.map((card, index) => (
              <CardTierItem key={card.id} card={card} index={index} />
            ))}
          </div>
        </div>

        {/* Top Rated Cards */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Icon icon="mdi:cards" className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl font-bold text-white">{t('statistics.top_rated_cards')}</h2>
            <div className="text-zinc-400 text-sm">{t('statistics.top_rated_cards_desc')}</div>
          </div>
          
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
            <WinRateChart cards={topRatedCards} />
          </div>
        </div>

        {/* Top Rated Decks */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Icon icon="mdi:cards-variant" className="w-6 h-6 text-purple-500" />
            <h2 className="text-2xl font-bold text-white">{t('statistics.top_rated_decks')}</h2>
            <div className="text-zinc-400 text-sm">{t('statistics.top_rated_decks_desc')}</div>
          </div>
          
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
            <DeckChart decks={topRatedDecks} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
