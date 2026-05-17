import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { api } from '@/utils/Api';
import { unwrapApiPayload } from '@/utils/unwrapApiPayload';
import { tcgHref } from '@/utils/Functions';
import UniqueLoginsStats from '@/components/UniqueLoginsStats';
import TopPlayersWrapper from './TopPlayersWrapper';
import type {
  StatsSummaryResponse,
  StatsDecksResponse,
  StatsCardsResponse,
  DeckStat,
  CardStat,
  LoginData,
  TopPlayersData,
  RankDistributionData
} from '@/utils/ApiTypes';

// Lazy load components
const DiscordBanner = lazy(() => import("@/components/DiscordBanner"));

// Skeleton Components
const SummarySkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="w-8 h-8 bg-zinc-700 rounded animate-pulse"></div>
          <div className="w-20 h-8 bg-zinc-700 rounded animate-pulse"></div>
        </div>
        <div className="w-32 h-5 bg-zinc-700 rounded animate-pulse mb-2"></div>
        <div className="w-24 h-4 bg-zinc-700 rounded animate-pulse"></div>
      </div>
    ))}
  </div>
);

const DecksSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="bg-zinc-800/70 border border-zinc-700 rounded-lg p-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-zinc-700 rounded-lg animate-pulse"></div>
          <div className="flex-1">
            <div className="w-48 h-5 bg-zinc-700 rounded animate-pulse mb-2"></div>
            <div className="flex gap-2 mb-2">
              <div className="w-20 h-6 bg-zinc-700 rounded animate-pulse"></div>
              <div className="w-20 h-6 bg-zinc-700 rounded animate-pulse"></div>
            </div>
            <div className="flex gap-4">
              <div className="w-16 h-4 bg-zinc-700 rounded animate-pulse"></div>
              <div className="w-16 h-4 bg-zinc-700 rounded animate-pulse"></div>
              <div className="w-16 h-4 bg-zinc-700 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="w-24 h-12 bg-zinc-700 rounded animate-pulse"></div>
        </div>
      </div>
    ))}
  </div>
);

const CardsSkeleton = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div key={i} className="bg-zinc-800/70 border border-zinc-700 rounded-lg p-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-24 bg-zinc-700 rounded animate-pulse"></div>
          <div className="flex-1">
            <div className="w-32 h-4 bg-zinc-700 rounded animate-pulse mb-2"></div>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="h-10 bg-zinc-700 rounded animate-pulse"></div>
              <div className="h-10 bg-zinc-700 rounded animate-pulse"></div>
              <div className="h-10 bg-zinc-700 rounded animate-pulse"></div>
            </div>
            <div className="flex gap-1 mb-2">
              <div className="flex-1 h-8 bg-zinc-700 rounded animate-pulse"></div>
              <div className="flex-1 h-8 bg-zinc-700 rounded animate-pulse"></div>
              <div className="flex-1 h-8 bg-zinc-700 rounded animate-pulse"></div>
            </div>
            <div className="flex justify-between">
              <div className="w-20 h-4 bg-zinc-700 rounded animate-pulse"></div>
              <div className="w-16 h-4 bg-zinc-700 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const Statistics = () => {
  const { t, i18n } = useTranslation();

  const [region, setRegion] = useState<number>(33);
  const [activeTab, setActiveTab] = useState<'decks' | 'cards-main' | 'cards-side'>('decks');
  const [minGames, setMinGames] = useState(100);
  const [limit, setLimit] = useState(50);
  const [rating, setRating] = useState<string | undefined>(undefined);

  const [cache, setCache] = useState<{
    [key: number]: {
      summary: StatsSummaryResponse | null;
      decks: StatsDecksResponse | null;
      cardsMain: StatsCardsResponse | null;
      cardsSide: StatsCardsResponse | null;
    };
  }>({
    33: { summary: null, decks: null, cardsMain: null, cardsSide: null },
    17: { summary: null, decks: null, cardsMain: null, cardsSide: null },
  });

  const [isLoading, setIsLoading] = useState<{ [key: number]: boolean }>({
    33: true,
    17: true,
  });

  const [loginsData, setLoginsData] = useState<LoginData[]>([]);

  const [topPlayersCache, setTopPlayersCache] = useState<{
    [key: number]: TopPlayersData | null;
  }>({
    33: null,
    17: null,
  });

  const [rankDistributionData, setRankDistributionData] = useState<RankDistributionData | null>(null);

  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const filtersChanged = useRef(false);

  useEffect(() => {
    const fetchAllInitialData = async () => {
      try {
        const response = await api.statistics.getInitialStatistics({
          lastlogins: [],
          summary: [{ region: 33 }, { region: 17 }],
          decks: [
            { region: 33, limit, minGames },
            { region: 17, limit, minGames }
          ],
          cards: [
            { region: 33, limit, minGames, zone: 'main' },
            { region: 33, limit, minGames, zone: 'side' },
            { region: 17, limit, minGames, zone: 'main' },
            { region: 17, limit, minGames, zone: 'side' }
          ],
          'top-players': [
            { region: 33, limit: 64 },
            { region: 17, limit: 64 }
          ],
          'rank-distribution': []
        });

        if (response.ok && response.data?.data) {
          const data = response.data.data;

          // Process lastlogins
          if (data.lastlogins?.[0]?.success && data.lastlogins[0].data?.logins) {
            setLoginsData(data.lastlogins[0].data.logins);
          }

          // Process summary, decks, cards for each region
          const newCache: typeof cache = {
            33: { summary: null, decks: null, cardsMain: null, cardsSide: null },
            17: { summary: null, decks: null, cardsMain: null, cardsSide: null }
          };

          // Process summary
          data.summary?.forEach(item => {
            if (item.success && item.data) {
              const regionKey = Number(item.data.region) as 33 | 17;
              if (regionKey === 33 || regionKey === 17) {
                newCache[regionKey].summary = item.data;
              }
            }
          });

          // Process decks
          data.decks?.forEach(item => {
            if (item.success && item.data) {
              const regionKey = item.data.filters?.region as 33 | 17;
              if (regionKey === 33 || regionKey === 17) {
                newCache[regionKey].decks = item.data;
              }
            }
          });

          // Process cards (main and side)
          data.cards?.forEach(item => {
            if (item.success && item.data) {
              const regionKey = item.data.filters?.region as 33 | 17;
              const zone = item.data.filters?.zone;
              if ((regionKey === 33 || regionKey === 17) && zone) {
                if (zone === 'main') {
                  newCache[regionKey].cardsMain = item.data;
                } else if (zone === 'side') {
                  newCache[regionKey].cardsSide = item.data;
                }
              }
            }
          });

          setCache(newCache);

          // Process top-players
          const newTopPlayersCache: typeof topPlayersCache = { 33: null, 17: null };
          data['top-players']?.forEach(item => {
            if (item.success && item.data) {
              const regionKey = item.data.region as 33 | 17;
              if (regionKey === 33 || regionKey === 17) {
                newTopPlayersCache[regionKey] = item.data;
              }
            }
          });
          setTopPlayersCache(newTopPlayersCache);

          // Process rank-distribution
          if (data['rank-distribution']?.[0]?.success && data['rank-distribution'][0].data) {
            setRankDistributionData(data['rank-distribution'][0].data);
          }

          // Save lastSaved timestamp
          if (response.data.lastSaved) {
            setLastSaved(response.data.lastSaved);
          }

          setIsLoading({ 33: false, 17: false });
        } else {
          console.error('Failed to fetch initial statistics:', response.message);
          setIsLoading({ 33: false, 17: false });
        }
      } catch (err) {
        console.error('Error fetching initial statistics:', err);
        setIsLoading({ 33: false, 17: false });
      } finally {
        setInitialLoadComplete(true);
      }
    };

    fetchAllInitialData();
  }, []);

  // Force refresh data (bypasses cache)
  const handleForceRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await api.statistics.getInitialStatistics({
        forceCache: true,
        lastlogins: [],
        summary: [{ region: 33 }, { region: 17 }],
        decks: [
          { region: 33, limit, minGames },
          { region: 17, limit, minGames }
        ],
        cards: [
          { region: 33, limit, minGames, zone: 'main' },
          { region: 33, limit, minGames, zone: 'side' },
          { region: 17, limit, minGames, zone: 'main' },
          { region: 17, limit, minGames, zone: 'side' }
        ],
        'top-players': [
          { region: 33, limit: 64 },
          { region: 17, limit: 64 }
        ],
        'rank-distribution': []
      });

      if (response.ok && response.data?.data) {
        const data = response.data.data;

        if (data.lastlogins?.[0]?.success && data.lastlogins[0].data?.logins) {
          setLoginsData(data.lastlogins[0].data.logins);
        }

        const newCache: typeof cache = {
          33: { summary: null, decks: null, cardsMain: null, cardsSide: null },
          17: { summary: null, decks: null, cardsMain: null, cardsSide: null }
        };

        data.summary?.forEach(item => {
          if (item.success && item.data) {
            const regionKey = Number(item.data.region) as 33 | 17;
            if (regionKey === 33 || regionKey === 17) {
              newCache[regionKey].summary = item.data;
            }
          }
        });

        data.decks?.forEach(item => {
          if (item.success && item.data) {
            const regionKey = item.data.filters?.region as 33 | 17;
            if (regionKey === 33 || regionKey === 17) {
              newCache[regionKey].decks = item.data;
            }
          }
        });

        data.cards?.forEach(item => {
          if (item.success && item.data) {
            const regionKey = item.data.filters?.region as 33 | 17;
            const zone = item.data.filters?.zone;
            if ((regionKey === 33 || regionKey === 17) && zone) {
              if (zone === 'main') {
                newCache[regionKey].cardsMain = item.data;
              } else if (zone === 'side') {
                newCache[regionKey].cardsSide = item.data;
              }
            }
          }
        });

        setCache(newCache);

        const newTopPlayersCache: typeof topPlayersCache = { 33: null, 17: null };
        data['top-players']?.forEach(item => {
          if (item.success && item.data) {
            const regionKey = item.data.region as 33 | 17;
            if (regionKey === 33 || regionKey === 17) {
              newTopPlayersCache[regionKey] = item.data;
            }
          }
        });
        setTopPlayersCache(newTopPlayersCache);

        if (data['rank-distribution']?.[0]?.success && data['rank-distribution'][0].data) {
          setRankDistributionData(data['rank-distribution'][0].data);
        }

        if (response.data.lastSaved) {
          setLastSaved(response.data.lastSaved);
        }
      }
    } catch (err) {
      console.error('Error refreshing statistics:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculate time since last update
  const getTimeSinceUpdate = () => {
    if (!lastSaved) return null;
    const now = new Date();
    const saved = new Date(lastSaved);
    const diffMs = now.getTime() - saved.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 60) {
      return { minutes: diffMins, hours: 0, canRefresh: diffMins >= 30 };
    }
    return { minutes: diffMins % 60, hours: diffHours, canRefresh: true };
  };

  const fetchStatsForRegion = async (targetRegion: number, params: { limit: number; minGames: number; rating?: string }) => {
    try {
      setIsLoading(prev => ({ ...prev, [targetRegion]: true }));

      const summaryResponse = await api.main.getStatsSummary(targetRegion);
      const summaryData = unwrapApiPayload<StatsSummaryResponse>(summaryResponse.data);
      if (!summaryResponse.ok || !summaryData) {
        throw new Error(`Failed to fetch summary for region ${targetRegion}`);
      }

      let elo: string | undefined;
      let tier: string | undefined;

      if (params.rating) {
        if (params.rating.startsWith('elo_')) {
          elo = params.rating.substring(4); // Remove 'elo_' prefix
        } else if (params.rating.startsWith('tier_')) {
          tier = params.rating.substring(5); // Remove 'tier_' prefix
        }
      }

      const decksResponse = await api.main.getStatsDecks({
        region: targetRegion,
        limit: params.limit,
        minGames: params.minGames,
        elo,
        tier
      });
      const decksData = unwrapApiPayload<StatsDecksResponse>(decksResponse.data);
      if (!decksResponse.ok || !decksData) {
        throw new Error(`Failed to fetch decks for region ${targetRegion}`);
      }

      const cardsMainResponse = await api.main.getStatsCards({
        region: targetRegion,
        limit: params.limit,
        minGames: params.minGames,
        zone: 'main',
        elo,
        tier
      });
      const cardsMainData = unwrapApiPayload<StatsCardsResponse>(cardsMainResponse.data);
      if (!cardsMainResponse.ok || !cardsMainData) {
        throw new Error(`Failed to fetch cards main for region ${targetRegion}`);
      }

      const cardsSideResponse = await api.main.getStatsCards({
        region: targetRegion,
        limit: params.limit,
        minGames: params.minGames,
        zone: 'side',
        elo,
        tier
      });
      const cardsSideData = unwrapApiPayload<StatsCardsResponse>(cardsSideResponse.data);
      if (!cardsSideResponse.ok || !cardsSideData) {
        throw new Error(`Failed to fetch cards side for region ${targetRegion}`);
      }

      setCache(prev => ({
        ...prev,
        [targetRegion]: {
          summary: summaryData ?? null,
          decks: decksData ?? null,
          cardsMain: cardsMainData ?? null,
          cardsSide: cardsSideData ?? null,
        },
      }));

      setIsLoading(prev => ({ ...prev, [targetRegion]: false }));
    } catch (err) {
      console.error(`Error fetching stats for region ${targetRegion}:`, err);
      setIsLoading(prev => ({ ...prev, [targetRegion]: false }));
    }
  };

  useEffect(() => {
    if (!initialLoadComplete) return; // Skip on initial mount
    
    // Skip if filters haven't actually changed (first time initialLoadComplete becomes true)
    if (!filtersChanged.current) {
      filtersChanged.current = true;
      return;
    }
    
    const effectiveMinGames = rating !== undefined ? 1 : minGames;
    const params = { limit, minGames: effectiveMinGames, rating };
    fetchStatsForRegion(33, params);
    fetchStatsForRegion(17, params);
  }, [minGames, limit, rating, initialLoadComplete]);

  const summary = cache[region]?.summary;
  const decks = cache[region]?.decks;
  const cardsMain = cache[region]?.cardsMain;
  const cardsSide = cache[region]?.cardsSide;
  const currentLoading = isLoading[region];

  const formatDate = (dateString: string) => {
    const lang = i18n.language || 'en-US';
    const locale = lang.startsWith('pt') ? 'pt-BR' : 'en-US';
    return new Date(dateString).toLocaleString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  // Global loading screen
  if (!initialLoadComplete) {
    return (
      <div className="w-full flex flex-col items-center px-4 mt-12 space-y-8 pb-12">
        <div className="h-32 w-full max-w-7xl bg-zinc-800 rounded-lg animate-pulse"></div>
        <div className="w-full max-w-7xl">
          {/* Header skeleton */}
          <div className="mb-6">
            <div className="w-64 h-10 bg-zinc-800 rounded animate-pulse mb-2"></div>
            <div className="w-48 h-5 bg-zinc-800 rounded animate-pulse"></div>
          </div>
          
          {/* Logins skeleton */}
          <div className="mb-8 w-full h-32 bg-zinc-800/50 border border-zinc-700 rounded-lg animate-pulse"></div>
          
          {/* Region selector skeleton */}
          <div className="flex gap-3 mb-6">
            <div className="w-32 h-12 bg-zinc-800 rounded-lg animate-pulse"></div>
            <div className="w-32 h-12 bg-zinc-800 rounded-lg animate-pulse"></div>
          </div>
          
          {/* Summary skeleton */}
          <SummarySkeleton />
          
          {/* Top players skeleton */}
          <div className="mb-8 h-96 bg-zinc-800/50 border border-zinc-700 rounded-lg animate-pulse"></div>
          
          {/* Filters skeleton */}
          <div className="h-16 bg-zinc-800/50 border border-zinc-700 rounded-lg animate-pulse mb-6"></div>
          
          {/* Tabs skeleton */}
          <div className="flex gap-2 mb-6">
            <div className="flex-1 h-12 bg-zinc-800 rounded-lg animate-pulse"></div>
            <div className="flex-1 h-12 bg-zinc-800 rounded-lg animate-pulse"></div>
            <div className="flex-1 h-12 bg-zinc-800 rounded-lg animate-pulse"></div>
          </div>
          
          {/* Content skeleton */}
          <DecksSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center px-4 mt-12 space-y-8 pb-12">
      <Suspense
        fallback={
          <div className="h-32 bg-zinc-800 rounded-lg animate-pulse"></div>
        }
      >
        <DiscordBanner />
      </Suspense>

      {/* Header */}
      <div className="w-full max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              <Icon
                icon="mdi:chart-box"
                className="inline w-8 h-8 mr-2 text-orange-500"
              />
              {t("statistics.title")}
            </h1>
            <p className="text-zinc-400">{t("statistics.subtitle")}</p>
          </div>
          
          {/* Refresh Button */}
          <div className="flex flex-col items-end gap-1">
            {(() => {
              const timeInfo = getTimeSinceUpdate();
              const canRefresh = timeInfo?.canRefresh ?? true;
              return (
                <>
                  <button
                    onClick={handleForceRefresh}
                    disabled={!canRefresh || isRefreshing}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      canRefresh && !isRefreshing
                        ? 'bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700'
                        : 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
                    }`}
                  >
                    <Icon 
                      icon={isRefreshing ? "mdi:loading" : "mdi:refresh"} 
                      className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} 
                    />
                    {t("statistics.refresh_data")}
                  </button>
                  {timeInfo && (
                    <p className="text-xs text-zinc-500">
                      {timeInfo.hours > 0 
                        ? t("statistics.updated_hours_ago", { hours: timeInfo.hours, minutes: timeInfo.minutes })
                        : t("statistics.updated_minutes_ago", { minutes: timeInfo.minutes })
                      }
                      {!canRefresh && (
                        <span className="text-zinc-600 ml-1">
                          ({t("statistics.refresh_cooldown")})
                        </span>
                      )}
                    </p>
                  )}
                </>
              );
            })()}
          </div>
        </div>

        {/* Logins Analytics */}
        {loginsData.length > 0 && (
          <div className="mb-8 w-full">
            <UniqueLoginsStats
              logins={loginsData}
              total={loginsData.reduce((sum, login) => sum + login.LogCount, 0)}
              initialRankData={rankDistributionData}
            />
          </div>
        )}

        {/* Region Selector */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setRegion(33)}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${region === 33
                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/50"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
          >
            <Icon icon="mdi:earth" className="inline w-5 h-5 mr-2" />
            {t("statistics.tcg")}
          </button>
          <button
            onClick={() => setRegion(17)}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${region === 17
                ? "bg-purple-500 text-white shadow-lg shadow-purple-500/50"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
          >
            <Icon icon="mdi:star" className="inline w-5 h-5 mr-2" />
            {t("statistics.genesys")}
          </button>
        </div>

        {/* Summary Cards */}
        {currentLoading ? (
          <SummarySkeleton />
        ) : summary && summary.summary ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-linear-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/30 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <Icon
                  icon="mdi:cards-variant"
                  className="w-8 h-8 text-blue-400"
                />
                <span className="text-3xl font-bold text-blue-400">
                  {summary.summary.total_unique_decks || 0}
                </span>
              </div>
              <p className="text-zinc-300 font-medium">
                {t("statistics.total_unique_decks")}
              </p>
              <p className="text-zinc-500 text-sm">
                {summary.summary.total_deck_variants || 0}{" "}
                {t("statistics.total_deck_variants").toLowerCase()}
              </p>
            </div>

            <div className="bg-linear-to-br from-green-500/10 to-green-600/5 border border-green-500/30 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <Icon
                  icon="mdi:sword-cross"
                  className="w-8 h-8 text-green-400"
                />
                <span className="text-3xl font-bold text-green-400">
                  {(summary.summary.total_games || 0).toLocaleString()}
                </span>
              </div>
              <p className="text-zinc-300 font-medium">
                {t("statistics.total_games")}
              </p>
              <p className="text-zinc-500 text-sm">{t("statistics.games")}</p>
            </div>

            <div className="bg-linear-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/30 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <Icon
                  icon="mdi:clock-outline"
                  className="w-8 h-8 text-purple-400"
                />
                <span className="text-sm font-medium text-purple-400">
                  {summary.lastProcessed?.[0]?.last_processed_at
                    ? formatDate(summary.lastProcessed[0].last_processed_at)
                    : t("common.not_available")}
                </span>
              </div>
              <p className="text-zinc-300 font-medium">
                {t("statistics.last_processed")}
              </p>
              <p className="text-zinc-500 text-sm">
                {summary.lastProcessed?.[0]?.last_duel_id
                  ? `${t(
                    "statistics.last_duel_id"
                  )} #${summary.lastProcessed[0].last_duel_id.toLocaleString()}`
                  : t("statistics.last_duel_id")}
              </p>
            </div>
          </div>
        ) : null}

        {/* Top Players (Table/Chart) */}
        <div className="mb-8">
          <TopPlayersWrapper region={region} limit={64} initialData={topPlayersCache[region]} />
        </div>

        {/* Filters */}
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label
                className={`text-sm ${rating !== undefined ? "text-zinc-600" : "text-zinc-400"
                  }`}
              >
                {t("statistics.min_games")}:
              </label>
              <select
                value={minGames}
                onChange={(e) => setMinGames(Number(e.target.value))}
                disabled={rating !== undefined}
                className={`px-3 py-2 rounded border focus:outline-none ${rating !== undefined
                    ? "bg-zinc-800 text-zinc-600 border-zinc-700 cursor-not-allowed"
                    : "bg-zinc-700 text-white border-zinc-600 focus:border-orange-500"
                  }`}
              >
                <option value={5}>5+</option>
                <option value={10}>10+</option>
                <option value={20}>20+</option>
                <option value={50}>50+</option>
                <option value={100}>100+</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-zinc-400 text-sm">
                {t("statistics.limit")}:
              </label>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="bg-zinc-700 text-white px-3 py-2 rounded border border-zinc-600 focus:border-orange-500 focus:outline-none"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-zinc-400 text-sm">
                {t("statistics.rating_filter")}:
              </label>
              <select
                value={rating ?? ""}
                onChange={(e) =>
                  setRating(
                    e.target.value === "" ? undefined : e.target.value
                  )
                }
                className="bg-zinc-700 text-white px-3 py-2 rounded border border-zinc-600 focus:border-orange-500 focus:outline-none"
              >
                <option value="">{t("statistics.all_ratings")}</option>
                <optgroup label="Filter by Tier">
                  <option value="tier_low">Low Tier (0-349)</option>
                  <option value="tier_mid">Mid Tier (350-1449)</option>
                  <option value="tier_high">High Tier (1450+)</option>
                </optgroup>
                <optgroup label="Low Tier">
                  <option value="elo_Iron">Iron (0-49)</option>
                  <option value="elo_Bronze">Bronze (50-199)</option>
                  <option value="elo_Silver">Silver (200-349)</option>
                </optgroup>
                <optgroup label="Mid Tier">
                  <option value="elo_Gold">Gold (350-599)</option>
                  <option value="elo_Platinum">Platinum (600-999)</option>
                  <option value="elo_Diamond">Diamond (1000-1449)</option>
                </optgroup>
                <optgroup label="High Tier">
                  <option value="elo_Master">Master (1450-1999)</option>
                  <option value="elo_Omega">Omega (2000+)</option>
                </optgroup>
              </select>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("decks")}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === "decks"
                ? "bg-linear-to-r from-orange-500 to-orange-600 text-white shadow-lg"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
          >
            <Icon icon="mdi:cards-variant" className="inline w-5 h-5 mr-2" />
            {t("statistics.top_decks")} ({decks?.count || 0})
          </button>
          <button
            onClick={() => setActiveTab("cards-main")}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === "cards-main"
                ? "bg-linear-to-r from-orange-500 to-orange-600 text-white shadow-lg"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
          >
            <Icon icon="mdi:cards" className="inline w-5 h-5 mr-2" />
            {t("statistics.top_cards_main")} ({cardsMain?.count || 0})
          </button>
          <button
            onClick={() => setActiveTab("cards-side")}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === "cards-side"
                ? "bg-linear-to-r from-orange-500 to-orange-600 text-white shadow-lg"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
          >
            <Icon icon="mdi:card-multiple" className="inline w-5 h-5 mr-2" />
            {t("statistics.top_cards_side")} ({cardsSide?.count || 0})
          </button>
        </div>

        {/* Content */}
        {activeTab === "decks" &&
          (currentLoading ? (
            <DecksSkeleton />
          ) : (
            decks && <DecksList decks={decks.decks} />
          ))}

        {activeTab === "cards-main" &&
          (currentLoading ? (
            <CardsSkeleton />
          ) : (
            cardsMain && <CardsList cards={cardsMain.cards} />
          ))}

        {activeTab === "cards-side" &&
          (currentLoading ? (
            <CardsSkeleton />
          ) : (
            cardsSide && <CardsList cards={cardsSide.cards} />
          ))}
      </div>
    </div>
  );
};

// Decks List Component
const DecksList = ({ decks }: { decks: DeckStat[] }) => {
  const { t } = useTranslation();
  const top3 = decks.slice(0, 3);
  const rest = decks.slice(3);

  return (
    <div className="space-y-6">
      {/* Top - Destaque especial */}
      {top3.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Icon icon="mdi:trophy" className="w-6 h-6 text-yellow-400" />
            <h3 className="text-xl font-bold text-white">{t('statistics.top_3_decks')}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {top3.map((deck, index) => (
              <div
                key={`${deck.deck_name}-${index}`}
                className={`relative bg-linear-to-br rounded-xl p-6 border-2 hover:scale-105 transition-all duration-300 shadow-xl ${index === 0
                  ? 'from-yellow-500/20 to-yellow-600/10 border-yellow-400/50 shadow-yellow-500/20'
                  : index === 1
                    ? 'from-gray-400/20 to-gray-500/10 border-gray-400/50 shadow-gray-500/20'
                    : 'from-orange-500/20 to-orange-600/10 border-orange-400/50 shadow-orange-500/20'
                  }`}
              >
                {/* Badge de posição */}
                <div className="absolute -top-3 -right-3">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-2xl shadow-lg ${index === 0 ? 'bg-linear-to-br from-yellow-400 to-yellow-600 text-white' :
                    index === 1 ? 'bg-linear-to-br from-gray-300 to-gray-500 text-white' :
                      'bg-linear-to-br from-orange-400 to-orange-600 text-white'
                    }`}>
                    {index + 1}
                  </div>
                </div>

                {/* Nome do deck */}
                <h4 className="text-white font-bold text-xl mb-3 pr-8">
                  {deck.deck_name}
                </h4>

                {/* Archetypes */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {deck.top_archetypes.map((archetype, i) => (
                    <a
                      key={i}
                      href={tcgHref(archetype.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-2 py-1 bg-orange-500/30 text-orange-300 text-xs rounded-lg border border-orange-400/50 font-semibold hover:bg-orange-500/40 transition-colors"
                    >
                      {archetype.ids && archetype.ids.length > 0 && (
                        <img
                          src={`https://ygopro.online/assets/card-arts/${archetype.ids[0]}.jpg`}
                          alt={archetype.name}
                          className="w-4 h-6 object-cover rounded border border-orange-400/50"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      )}
                      <span>{archetype.name}</span>
                    </a>
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                  <div className="bg-black/20 rounded-lg p-2 text-center">
                    <div className="text-green-400 font-bold">{deck.total_wins}W</div>
                    <div className="text-zinc-400 text-xs">{t('wins')}</div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-2 text-center">
                    <div className="text-red-400 font-bold">{deck.total_losses}L</div>
                    <div className="text-zinc-400 text-xs">{t('losses')}</div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-2 text-center">
                    <div className="text-blue-400 font-bold">{deck.total_games}</div>
                    <div className="text-zinc-400 text-xs">{t('statistics.games')}</div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-2 text-center">
                    <div className="text-purple-400 font-bold">{deck.unique_deck_variants}</div>
                    <div className="text-zinc-400 text-xs">{t('statistics.total_deck_variants')}</div>
                  </div>
                </div>

                {/* Win Rate */}
                <div className="text-center">
                  <div className={`text-4xl font-black mb-2 ${Number(deck.win_rate) >= 55 ? 'text-green-400' :
                    Number(deck.win_rate) >= 50 ? 'text-yellow-400' :
                      Number(deck.win_rate) >= 45 ? 'text-orange-400' : 'text-red-400'
                    }`}>
                    {Number(deck.win_rate).toFixed(1)}%
                  </div>
                  <div className="w-full bg-black/30 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${Number(deck.win_rate) >= 55 ? 'bg-linear-to-r from-green-400 to-green-600' :
                        Number(deck.win_rate) >= 50 ? 'bg-linear-to-r from-yellow-400 to-yellow-600' :
                          Number(deck.win_rate) >= 45 ? 'bg-linear-to-r from-orange-400 to-orange-600' :
                            'bg-linear-to-r from-red-400 to-red-600'
                        }`}
                      style={{ width: `${Number(deck.win_rate)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resto dos decks - Layout compacto */}
      {rest.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-zinc-300 mb-3">{t('statistics.other_decks')}</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {rest.map((deck, index) => {
              const actualIndex = index + 3;
              return (
                <div
                  key={`${deck.deck_name}-${actualIndex}`}
                  className="bg-zinc-800/70 border border-zinc-700 rounded-lg p-4 hover:border-orange-500/50 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="shrink-0">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${actualIndex < 10 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                        'bg-zinc-700 text-zinc-300'
                        }`}>
                        {actualIndex + 1}
                      </div>
                    </div>

                    {/* Deck Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-semibold mb-1 group-hover:text-orange-400 transition-colors">
                        {deck.deck_name}
                      </h4>

                      {/* Archetypes */}
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {deck.top_archetypes.map((archetype, i) => (
                          <a
                            key={i}
                            href={tcgHref(archetype.name)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded border border-orange-500/30 hover:bg-orange-500/30 transition-colors"
                          >
                            {archetype.ids && archetype.ids.length > 0 && (
                              <img
                                src={`https://ygopro.online/assets/card-arts/${archetype.ids[0]}.jpg`}
                                alt={archetype.name}
                                className="w-3 h-5 object-cover rounded border border-orange-500/50"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            )}
                            <span className="font-medium">{archetype.name}</span>
                          </a>
                        ))}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-3 text-xs text-zinc-400">
                        <span className="text-green-400">{deck.total_wins}W</span>
                        <span className="text-red-400">{deck.total_losses}L</span>
                        <span className="text-blue-400">{deck.total_games} {t('statistics.games')}</span>
                        <span className="text-purple-400">{deck.unique_deck_variants} {t('statistics.variants')}</span>
                      </div>
                    </div>

                    {/* Win Rate */}
                    <div className="shrink-0 text-right">
                      <div className={`text-2xl font-bold mb-1 ${Number(deck.win_rate) >= 55 ? 'text-green-400' :
                        Number(deck.win_rate) >= 50 ? 'text-yellow-400' :
                          Number(deck.win_rate) >= 45 ? 'text-orange-400' : 'text-red-400'
                        }`}>
                        {Number(deck.win_rate).toFixed(1)}%
                      </div>
                      <div className="w-24 bg-zinc-700 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${Number(deck.win_rate) >= 55 ? 'bg-green-500' :
                            Number(deck.win_rate) >= 50 ? 'bg-yellow-500' :
                              Number(deck.win_rate) >= 45 ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                          style={{ width: `${Number(deck.win_rate)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Cards List Component
const CardsList = ({ cards }: { cards: CardStat[] }) => {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {cards.map((card, index) => (
        <div
          key={`${card.card_id}-${index}`}
          className="bg-zinc-800/70 border border-zinc-700 rounded-lg p-4 hover:border-orange-500/50 transition-all duration-200 group"
        >
          <div className="flex items-center gap-4">
            {/* Rank & Image */}
            <div className="shrink-0">
              <div className="relative">
                <a
                  href={tcgHref(card.card_name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block hover:opacity-80 transition-opacity"
                >
                  <img
                    src={`https://ygopro.online/assets/card-arts/${card.card_id}.jpg`}
                    alt={card.card_name}
                    className="w-16 h-24 object-cover rounded border-2 border-zinc-600 group-hover:border-orange-500 transition-colors"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/card-placeholder.png';
                    }}
                  />
                </a>
                <div className={`absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${index < 3 ? 'bg-linear-to-br from-yellow-400 to-yellow-600 text-white' :
                  index < 10 ? 'bg-linear-to-br from-orange-400 to-orange-600 text-white' :
                    'bg-zinc-700 text-zinc-300'
                  }`}>
                  {index + 1}
                </div>
              </div>
            </div>

            {/* Card Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <a
                  href={tcgHref(card.card_name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                >
                  <h3 className="text-white font-semibold text-sm group-hover:text-orange-400 transition-colors truncate">
                    {card.card_name}
                  </h3>
                </a>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${card.zone === 'main' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                  card.zone === 'extra' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                    'bg-green-500/20 text-green-400 border border-green-500/30'
                  }`}>
                  {card.zone.toUpperCase()}
                </span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                <div className="text-center bg-zinc-900/50 rounded p-1">
                  <div className="text-zinc-400">{t('statistics.decks')}</div>
                  <div className="text-white font-semibold">{card.decks_used_in}</div>
                </div>
                <div className="text-center bg-zinc-900/50 rounded p-1">
                  <div className="text-zinc-400">{t('statistics.copies')}</div>
                  <div className="text-white font-semibold">{card.total_copies}</div>
                </div>
                <div className="text-center bg-zinc-900/50 rounded p-1">
                  <div className="text-zinc-400">{t('statistics.average')}</div>
                  <div className="text-white font-semibold">{Number(card.avg_copies).toFixed(1)}</div>
                </div>
              </div>

              {/* Copy Distribution */}
              <div className="flex gap-1 text-xs mb-2">
                <div className="flex-1 bg-zinc-700 rounded px-2 py-1 text-center">
                  <span className="text-zinc-400">1x:</span>
                  <span className="text-white ml-1">{card.decks_1_copy}</span>
                </div>
                <div className="flex-1 bg-zinc-700 rounded px-2 py-1 text-center">
                  <span className="text-zinc-400">2x:</span>
                  <span className="text-white ml-1">{card.decks_2_copies}</span>
                </div>
                <div className="flex-1 bg-zinc-700 rounded px-2 py-1 text-center">
                  <span className="text-zinc-400">3x:</span>
                  <span className="text-white ml-1">{card.decks_3_copies}</span>
                </div>
              </div>

              {/* Win Rate */}
              <div className="flex items-center justify-between">
                <div className="text-xs text-zinc-400">
                  {card.total_wins}W • {card.total_losses}L
                </div>
                <div className="flex items-center gap-2">
                  <div className={`text-sm font-bold ${Number(card.win_rate) >= 55 ? 'text-green-400' :
                    Number(card.win_rate) >= 50 ? 'text-yellow-400' :
                      Number(card.win_rate) >= 45 ? 'text-orange-400' : 'text-red-400'
                    }`}>
                    {Number(card.win_rate).toFixed(1)}%
                  </div>
                  <div className="w-20 bg-zinc-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${Number(card.win_rate) >= 55 ? 'bg-green-500' :
                        Number(card.win_rate) >= 50 ? 'bg-yellow-500' :
                          Number(card.win_rate) >= 45 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                      style={{ width: `${Number(card.win_rate)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Statistics;
