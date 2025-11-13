import React, { useState, useEffect, useMemo, useCallback, memo, lazy, Suspense, useRef } from 'react';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import type {
  ProfileData,
  ProfileStatsData,
  ProfileCustomizationData,
  MostUsedArchetype,
  OpponentDeck,
  ProfileStatsQueue,
} from './types';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { Icon } from '@iconify/react';
import { getTierInfo } from '@/utils/Functions';
import { api } from '@/utils/Api';
import { useAuth } from '@/hooks/useAuth';
import History from './components/History';

// Lazy load heavy components
const ProfileSkeleton = lazy(() => import('./components/ProfileSkeleton'));

const Profile: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { userId: currentUserId } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | undefined>(undefined);
  const [statsData, setStatsData] = useState<ProfileStatsQueue | undefined>(undefined);
  const [customizationData, setCustomizationData] = useState<ProfileCustomizationData | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [gameMode, setGameMode] = useState<'tcg' | 'genesys'>('tcg');
  const [pagination, setPagination] = useState<{tcg: number, genesys: number}>({tcg: 1, genesys: 1});
  const initialLoadRef = useRef(true);

  const totalGames = (profileData: ProfileData | undefined) => {
    if (!profileData) return { tcg: 0, ocg: 0 };

    return { tcg: profileData.tcgwins + profileData.tcgloses + profileData.tcgdraws, ocg: profileData.ocgwins + profileData.ocgloses + profileData.ocgdraws }
  };

  // Memoized random card ID calculation for default banner
  const defaultBannerUrl = useMemo(() => {
    const gameData = statsData?.[gameMode];
    if (!gameData?.mostUsedArchetypes?.length || !gameData?.matchHistory?.length) return null;

    const mostUsedArchetype = gameData.mostUsedArchetypes[0];

    // Find matches where the duelist used this archetype
    const matchesWithArchetype = gameData.matchHistory.filter(match =>
      match.duelist.deck.some(deck => deck.archetype === mostUsedArchetype.deck)
    );

    if (!matchesWithArchetype.length) return null;

    // Get all card IDs from decks with this archetype
    const allCardIds: number[] = [];
    matchesWithArchetype.forEach(match => {
      match.duelist.deck.forEach(deck => {
        if (deck.archetype === mostUsedArchetype.deck) {
          allCardIds.push(...deck.ids);
        }
      });
    });

    if (!allCardIds.length) return null;

    // Return a random card ID
    const randomIndex = Math.floor(Math.random() * allCardIds.length);
    const cardId = allCardIds[randomIndex].toString();
    return `https://images.ygoprodeck.com/images/cards_cropped/${cardId}.jpg`;
  }, [statsData, gameMode]);

  // Memoized computed values
  const currentStats = useMemo(() => {
    if (!profileData) return {
      tcg: { wins: 0, losses: 0, draws: 0, rating: 0 },
      ocg: { wins: 0, losses: 0, draws: 0, rating: 0 }
    };

    return {
      tcg: {
        wins: profileData.tcgwins || 0,
        losses: profileData.tcgloses || 0,
        draws: profileData.tcgdraws || 0,
        rating: profileData.tcgrating || 0
      },
      ocg: {
        wins: profileData.ocgwins || 0,
        losses: profileData.ocgloses || 0,
        draws: profileData.ocgdraws || 0,
        rating: profileData.ocgrating || 0
      }
    };
  }, [profileData]);

  // Get current game mode stats
  const currentGameModeStats = useMemo(() => {
    return gameMode === 'tcg' ? currentStats.tcg : currentStats.ocg;
  }, [gameMode, currentStats]);

  const tcgTierInfo = useMemo(() => {
    if (!currentStats.tcg.rating) return { name: 'Unranked', image: '/tiers/unranked.png' };
    return getTierInfo(currentStats.tcg.rating, 'TCG');
  }, [currentStats.tcg.rating]);

  const ocgTierInfo = useMemo(() => {
    if (!currentStats.ocg.rating) return { name: 'Unranked', image: '/tiers/unranked.png' };
    return getTierInfo(currentStats.ocg.rating, 'OCG');
  }, [currentStats.ocg.rating]);

  // Get current tier info based on game mode
  const currentTierInfo = useMemo(() => {
    return gameMode === 'tcg' ? tcgTierInfo : ocgTierInfo;
  }, [gameMode, tcgTierInfo, ocgTierInfo]);

  // Check if the current user is viewing their own profile
  const isOwnProfile = useMemo(() => {
    return currentUserId && id && currentUserId === id;
  }, [currentUserId, id]);

  // Fetch all profile data
  const fetchProfileData = useCallback(async (pageToLoad?: 'tcg' | 'genesys') => {
    if (!id) {
      setError('Profile ID is required');
      setLoading(false);
      return;
    }
    
    // Skip if we already have the data for this page
    if (pageToLoad) {
      const currentPage = pagination[pageToLoad];
      const currentStats = statsData?.[pageToLoad];
      if (currentStats?.pagination?.currentPage === currentPage) {
        return;
      }
    } else if (!initialLoadRef.current) {
      // If not initial load and no page specified, don't refetch
      return;
    }
    
    // Set appropriate loading state
    if (pageToLoad) {
      setHistoryLoading(true);
    } else {
      setLoading(true);
    }

    try {
      setError(undefined);

      // Only reset all state when loading a new profile, not during pagination
      if (!pageToLoad) {
        setProfileData(undefined);
        setStatsData(undefined);
        setCustomizationData(undefined);
      }

      // Fetch player data (basic profile info)
      const playerResponse = await api.external.duelistsUnite.getPlayer(id);
      if (playerResponse.ok && playerResponse.data) {
        setProfileData(playerResponse.data);
      } else {
        throw new Error('Failed to load profile data');
      }

      // Fetch player decks and match history with pagination
      const decksResponse = await api.external.duelistsUnite.getPlayerDecks(id, {
        tcgPage: pagination.tcg,
        genesysPage: pagination.genesys
      });
      if (decksResponse.success && decksResponse.data) {
        setStatsData(decksResponse.data);
      } else {
        console.warn('Could not load deck data, using empty state');
        setStatsData({
          tcg: {
            opponentDecks: [],
            totalGaming: '0',
            mostUsedArchetypes: [],
            matchHistory: [],
            pagination: {
              currentPage: 1,
              pageSize: 10,
              totalMatches: 0,
              totalPages: 1
            }
          },
          genesys: {
            opponentDecks: [],
            totalGaming: '0',
            mostUsedArchetypes: [],
            matchHistory: [],
            pagination: {
              currentPage: 1,
              pageSize: 10,
              totalMatches: 0,
              totalPages: 1
            }
          }
        });
      }

      // Fetch player customization data (banner, bio, etc.)
      const customizationResponse = await api.external.duelistsUnite.getPlayerCustomization(id);
      if (customizationResponse.success) {
        setCustomizationData(customizationResponse.data);
      } else {
        // If 404 or other error, just set to null (optional data)
        setCustomizationData(undefined);
      }
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      if (pageToLoad) {
        setHistoryLoading(false);
      } else {
        setLoading(false);
      }
    }
  }, [id, pagination.tcg, pagination.genesys]);

  useEffect(() => {
    initialLoadRef.current = true;
    setPagination({ tcg: 1, genesys: 1 });
    fetchProfileData().finally(() => {
      initialLoadRef.current = false;
    });
  }, [id]);

  // Handle pagination changes
  useEffect(() => {
    if (pagination.tcg > 1 || pagination.genesys > 1) {
      fetchProfileData(gameMode);
    }
  }, [pagination.tcg, pagination.genesys, gameMode]);

  const calculateWinRate = (wins: number, losses: number, draws: number = 0): number => {
    const totalGames = wins + losses + draws;
    if (totalGames === 0) return 0;
    return (wins / totalGames) * 100;
  };

  const getWinRateColor = (winRate: number): string => {
    if (winRate >= 70) return 'text-green-400';
    if (winRate >= 55) return 'text-blue-400';
    if (winRate >= 45) return 'text-yellow-400';
    return 'text-red-400';
  };

  const WinRateBar = memo(({ wins, losses, draws = 0, showDraws = false, className = '' }: { wins: number; losses: number; draws?: number; showDraws?: boolean; className?: string }) => {
    const totalGames = wins + losses + draws;
    const winRate = calculateWinRate(wins, losses, draws);
    const winRateColor = getWinRateColor(winRate);
    const winPercentage = totalGames > 0 ? (wins / totalGames) * 100 : 0;
    const drawPercentage = totalGames > 0 ? (draws / totalGames) * 100 : 0;
    const lossPercentage = totalGames > 0 ? (losses / totalGames) * 100 : 0;

    return (
      <div className={`w-full ${className}`}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-zinc-300">
            {wins}W - {losses}L{showDraws && draws > 0 ? ` - ${draws}D` : ''}
          </span>
          <span className={`text-sm font-semibold ${winRateColor}`}>
            {winRate.toFixed(1)}%
          </span>
        </div>
        <div
          className="w-full bg-zinc-700/50 rounded-full h-2 overflow-hidden flex"
          role="progressbar"
          aria-valuenow={winRate}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={`${winRate.toFixed(1)}% win rate (${wins} wins, ${draws} draws, ${losses} losses)`}
          title={`${wins} wins, ${draws} draws, ${losses} losses`}
        >
          {/* Wins segment */}
          <div
            className="h-full bg-linear-to-r from-green-500 to-green-400 transition-all duration-500"
            style={{ width: `${winPercentage}%` }}
            title={`${wins} wins (${winPercentage.toFixed(1)}%)`}
          ></div>
          {/* Draws segment */}
          {draws > 0 && (
            <div
              className="h-full bg-yellow-500 transition-all duration-500"
              style={{ width: `${drawPercentage}%` }}
              title={`${draws} draws (${drawPercentage.toFixed(1)}%)`}
            ></div>
          )}
          {/* Losses segment */}
          <div
            className="h-full bg-linear-to-r from-red-500 to-red-400 transition-all duration-500"
            style={{ width: `${lossPercentage}%` }}
            title={`${losses} losses (${lossPercentage.toFixed(1)}%)`}
          ></div>
        </div>
        {totalGames > 0 && (
          <div className="flex justify-between text-xs text-zinc-500 mt-1">
            <span>{totalGames} {totalGames === 1 ? 'game' : 'games'}</span>
            {showDraws && draws > 0 && (
              <span className="text-yellow-400">{draws} draws ({drawPercentage.toFixed(0)}%)</span>
            )}
          </div>
        )}
      </div>
    );
  });

  const ArchetypeCard = memo(({ archetype }: { archetype: MostUsedArchetype }) => (
    <div className="group relative overflow-hidden bg-linear-to-r from-zinc-800/60 to-zinc-800/40 rounded-lg border border-zinc-700/50 p-4 hover:border-purple-500/50 transition-all duration-300">
      <div className="absolute inset-0 bg-linear-to-r from-purple-600/5 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
            <h3 className="font-semibold text-zinc-200 group-hover:text-purple-300 transition-colors duration-300">{archetype.deck}</h3>
          </div>
          <span className="text-xs font-medium text-zinc-400 bg-zinc-700/50 px-2 py-1 rounded-full">{archetype.total} games</span>
        </div>
        <WinRateBar wins={archetype.wins} losses={archetype.loss} />
      </div>
    </div>
  ));

  const OpponentCard = memo(({ opponent }: { opponent: OpponentDeck }) => (
    <div className="group relative overflow-hidden bg-linear-to-r from-zinc-800/60 to-zinc-800/40 rounded-lg border border-zinc-700/50 p-4 hover:border-red-500/50 transition-all duration-300">
      <div className="absolute inset-0 bg-linear-to-r from-red-600/5 to-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
            <h3 className="font-semibold text-zinc-200 group-hover:text-red-300 transition-colors duration-300">{opponent.deck}</h3>
          </div>
          <span className="text-xs font-medium text-zinc-400 bg-zinc-700/50 px-2 py-1 rounded-full">{opponent.total} games</span>
        </div>
        <WinRateBar wins={opponent.wins} losses={opponent.loss} />
      </div>
    </div>
  ));

  // Add display names for memoized components
  WinRateBar.displayName = 'WinRateBar';
  ArchetypeCard.displayName = 'ArchetypeCard';
  OpponentCard.displayName = 'OpponentCard';

  if (loading) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-zinc-300">Loading...</div>
      </div>}>
        <ProfileSkeleton />
      </Suspense>
    );
  }

  if (error || !profileData || !statsData) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">⚠️ Error</div>
          <p className="text-zinc-300">{error || 'Profile data not available'}</p>
        </div>
      </div>
    );
  }

  const getTierGradient = (tierName: string): string => {
    switch (tierName.toLowerCase()) {
      case 'omega': return 'from-purple-600 via-pink-600 to-red-600';
      case 'master': return 'from-red-600 via-orange-500 to-yellow-500';
      case 'diamond': return 'from-cyan-400 via-blue-500 to-purple-600';
      case 'platinum': return 'from-teal-400 via-cyan-500 to-blue-600';
      case 'gold': return 'from-yellow-400 via-orange-400 to-yellow-600';
      case 'silver': return 'from-gray-300 via-gray-400 to-gray-500';
      case 'bronze': return 'from-orange-600 via-amber-700 to-orange-800';
      default: return 'from-zinc-600 via-zinc-700 to-zinc-800';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 relative">
      {/* Enhanced Banner */}
      <div
        className="h-96 bg-linear-to-br from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden"
        style={{
          backgroundImage: customizationData?.duelist_banner_url
            ? `url(${customizationData.duelist_banner_url})`
            : defaultBannerUrl
              ? `url(${defaultBannerUrl})`
              : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-linear-to-b from-black/30 via-black/50 to-black/70"></div>
        <div className="absolute inset-0 bg-linear-to-r from-blue-600/20 via-purple-600/10 to-pink-600/20"></div>

        {/* Animated Background Elements */}
        <div className="absolute top-10 left-10 w-16 h-16 bg-blue-400/20 rounded-full blur-xl animate-pulse -z-10"></div>
        <div className="absolute top-20 right-20 w-12 h-12 bg-purple-400/20 rounded-full blur-lg animate-pulse delay-1000 -z-10"></div>
        <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-pink-400/20 rounded-full blur-2xl animate-pulse delay-500 -z-10"></div>

        {/* Profile Header Overlay */}
        <div className="relative z-20 h-full flex items-end pb-14 bg-linear-to-t from-black/50 to-transparent">
          <div className="w-full pb-6">
            <div className="flex flex-row items-start sm:items-end gap-4 container mx-auto px-6">
              {/* Avatar with tier border */}
              <div className="relative z-10">
                <div className="absolute -inset-1 rounded-full bg-linear-to-r from-purple-600 to-pink-600 opacity-80 blur" style={{ width: 'calc(100% + 0.5rem)', height: 'calc(100% + 0.5rem)' }}></div>
                <div className="relative rounded-full p-0.5 bg-zinc-900">
                  <PlayerAvatar
                    id={profileData.id}
                    avatar={profileData.avatar}
                    displayname={profileData.displayname}
                    username={profileData.username}
                    rounded={true}
                    size="lg"
                    bordered={true}
                  />
                </div>

                {/* Tier Badge - Better mobile positioning */}
                <div className="absolute -bottom-2 -right-1 sm:-right-2">
                  <div className="relative group">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-linear-to-r ${getTierGradient(currentTierInfo.name)} p-0.5 shadow-lg`}>
                      <div className="w-full h-full rounded-full bg-zinc-900 p-1 flex items-center justify-center">
                        <img
                          src={currentTierInfo.image}
                          alt={`${currentTierInfo.name} Tier`}
                          className="w-3/4 h-3/4 object-contain"
                        />
                      </div>
                    </div>
                    <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      {currentTierInfo.name} Tier
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Info - Better mobile layout */}
              <div className="flex-1 px-2 sm:px-0 mt-2 sm:mt-0">
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg wrap-break-word">
                    {profileData.displayname}
                  </h1>
                  <span className="text-zinc-300 text-lg sm:text-xl font-normal">
                    @{profileData.username}
                  </span>
                </div>

                {/* Last Seen - Better mobile text size */}
                <div className="text-zinc-300 text-xs sm:text-sm mt-1">
                  <Icon icon="mdi:clock-outline" className="inline mr-1" />
                  Last seen: {new Date(profileData.lastlogin).toLocaleString()}
                </div>

                {/* Social Links - Better mobile layout */}
                {customizationData && (
                  <div className="flex flex-wrap gap-2 sm:gap-3 mt-2 sm:mt-3 z-40">
                    {customizationData.socialTwitch && (
                      <a
                        href={`https://twitch.tv/${customizationData.socialTwitch}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:text-purple-300 transition-colors"
                        title={`Twitch: ${customizationData.socialTwitch}`}
                      >
                        <Icon icon="mdi:twitch" className="w-4 h-4 sm:w-5 sm:h-5" />
                      </a>
                    )}
                    {customizationData.socialYoutube && (
                      <a
                        href={`https://youtube.com/@${customizationData.socialYoutube}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-500 hover:text-red-400 transition-colors"
                        title={`YouTube: ${customizationData.socialYoutube}`}
                      >
                        <Icon icon="mdi:youtube" className="w-5 h-5 md:w-6 md:h-6" />
                      </a>
                    )}
                    {customizationData.socialX && (
                      <a
                        href={`https://x.com/${customizationData.socialX}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white hover:text-blue-400 transition-colors"
                        title={`X: ${customizationData.socialX}`}
                      >
                        <Icon icon="mdi:twitter" className="w-5 h-5 md:w-6 md:h-6" />
                      </a>
                    )}
                    {customizationData.socialInstagram && (
                      <a
                        href={`https://instagram.com/${customizationData.socialInstagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-400 hover:text-pink-300 transition-colors"
                        title={`Instagram: ${customizationData.socialInstagram}`}
                      >
                        <Icon icon="mdi:instagram" className="w-5 h-5 md:w-6 md:h-6" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 -mt-16 sm:-mt-20 lg:-mt-24 relative z-40">
          {/* Game Mode Toggle */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center bg-zinc-800/80 backdrop-blur-sm rounded-lg p-1 border border-zinc-700/50">
              <button
                onClick={() => setGameMode('tcg')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${gameMode === 'tcg' ? 'bg-blue-600 text-white' : 'text-zinc-300 hover:bg-zinc-700/50'}`}
              >
                TCG
              </button>
              <button
                onClick={() => setGameMode('genesys')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${gameMode === 'genesys' ? 'bg-blue-600 text-white' : 'text-zinc-300 hover:bg-zinc-700/50'}`}
              >
                Genesys
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="flex flex-col gap-4">
              {gameMode === 'tcg' && totalGames(profileData).tcg > 0 && (
                <div className="bg-zinc-800/80 backdrop-blur-sm rounded-xl border border-zinc-700/50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-zinc-300">TCG Ranked</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getTierGradient(tcgTierInfo.name).replace('from-', 'bg-').replace('to-', 'bg-')} bg-opacity-20`}>
                      {tcgTierInfo.name}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 text-sm">Rating</span>
                      <span className="font-medium">{Math.floor(currentStats.tcg.rating)}</span>
                    </div>
                    <WinRateBar
                      wins={currentStats.tcg.wins}
                      losses={currentStats.tcg.losses}
                      draws={currentStats.tcg.draws}
                      showDraws={true}
                      className="mb-4"
                    />
                  </div>
                </div>
              )}

              {gameMode === 'genesys' && totalGames(profileData).ocg > 0 && (
                <div className="bg-zinc-800/80 backdrop-blur-sm rounded-xl border border-zinc-700/50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-zinc-300">Genesys Ranked</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getTierGradient(ocgTierInfo.name).replace('from-', 'bg-').replace('to-', 'bg-')} bg-opacity-20`}>
                      {ocgTierInfo.name}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 text-sm">Rating</span>
                      <span className="font-medium">{Math.floor(currentStats.ocg.rating)}</span>
                    </div>
                    <WinRateBar
                      wins={currentStats.ocg.wins}
                      losses={currentStats.ocg.losses}
                      draws={currentStats.ocg.draws}
                      showDraws={true}
                      className="mb-4"
                    />
                  </div>
                </div>
              )}
            </div>


          {/* Bio Section with Favorite Card */}
          {customizationData?.duelist_bio && (
            <div className="bg-zinc-800/80 w-full backdrop-blur-sm rounded-xl border border-zinc-700/50 p-4 md:col-span-2 flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                  <Icon icon="mdi:card-account-details" className="text-blue-400" />
                  Duelist Bio
                </h3>
                <div
                  className="text-zinc-300 text-sm prose prose-invert prose-sm overflow-y-auto pr-2"
                  dangerouslySetInnerHTML={{ __html: customizationData.duelist_bio }}
                />
              </div>
              {customizationData?.duelist_favorite && (
                <div className="mt-4 md:mt-0 md:ml-4 shrink-0">
                  <h4 className="text-xs font-medium text-zinc-400 mb-2 text-center">Favorite Card</h4>
                  <div className="relative w-28 h-40 rounded-lg overflow-hidden border border-amber-400/30 shadow-lg">
                    <img
                      src={`https://images.ygoprodeck.com/images/cards_cropped/${customizationData.duelist_favorite}.jpg`}
                      alt="Favorite Card"
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column - Match History */}
          <div className="lg:col-span-2">
            <div className="bg-zinc-800/80 backdrop-blur-sm rounded-xl border border-zinc-700/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Icon icon="mdi:history" className="text-blue-400" />
                  {t('profile.match_history_title')}
                </h2>
                {customizationData?.hide_history !== 0 && isOwnProfile && (
                  <span className="text-xs bg-yellow-900/30 text-yellow-400 px-2 py-1 rounded-full border border-yellow-500/30">
                    {t('profile.match_history_warning')}
                  </span>
                )}
              </div>

              <div className="space-y-4">
<History 
                  customizationData={customizationData} 
                  isOwnProfile={!!isOwnProfile} 
                  statsData={gameMode === 'tcg' ? statsData?.tcg : statsData?.genesys}
                  isLoading={historyLoading}
                />
                {statsData?.[gameMode]?.pagination?.totalPages > 1 && (
                  <div className="flex justify-center mt-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const newPage = Math.max(1, pagination[gameMode] - 1);
                          setPagination(prev => ({
                            ...prev,
                            [gameMode]: newPage
                          }));
                        }}
                        disabled={pagination[gameMode] <= 1}
                        className="px-3 py-1 rounded-md bg-zinc-800/80 border border-zinc-700/50 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700/50 transition-colors"
                      >
                        Previous
                      </button>
                      <span className="px-4 py-1 text-sm text-zinc-300">
                        Page {pagination[gameMode]} of {statsData[gameMode]?.pagination?.totalPages || 1}
                      </span>
                      <button
                        onClick={() => {
                          const newPage = pagination[gameMode] + 1;
                          setPagination(prev => ({
                            ...prev,
                            [gameMode]: newPage
                          }));
                        }}
                        disabled={!statsData?.[gameMode]?.pagination || pagination[gameMode] >= statsData[gameMode].pagination.totalPages}
                        className="px-3 py-1 rounded-md bg-zinc-800/80 border border-zinc-700/50 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700/50 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Stats and Decks */}
          <div className="space-y-6">
            {/* Most Used Archetypes */}
            <div className="bg-zinc-800/80 backdrop-blur-sm rounded-xl border border-zinc-700/50 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Icon icon="mdi:cards" className="text-purple-400" />
                Favorite Decks
              </h2>
              <div className="space-y-3">
                {statsData?.[gameMode]?.mostUsedArchetypes?.length > 0 ? (
                  statsData[gameMode]!.mostUsedArchetypes.slice(0, 3).map((archetype, index) => (
                    <ArchetypeCard key={index} archetype={archetype} />
                  ))
                ) : (
                  <div className="text-center py-6 text-zinc-500 text-sm">
                    No {gameMode === 'tcg' ? 'TCG' : 'Genesys'} deck data available
                  </div>
                )}
              </div>
            </div>

            {/* Frequent Opponents */}
            <div className="bg-zinc-800/80 backdrop-blur-sm rounded-xl border border-zinc-700/50 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Icon icon="mdi:account-group" className="text-red-400" />
                Common Opponents
              </h2>
              <div className="space-y-3">
                {statsData?.[gameMode]?.opponentDecks?.length > 0 ? (
                  statsData[gameMode]!.opponentDecks.slice(0, 3).map((opponent, index) => (
                    <OpponentCard key={index} opponent={opponent} />
                  ))
                ) : (
                  <div className="text-center py-6 text-zinc-500 text-sm">
                    No {gameMode === 'tcg' ? 'TCG' : 'Genesys'} opponent data available
                  </div>
                )}
              </div>
            </div>

            {/* Performance Stats */}
            <div className="bg-zinc-800/80 backdrop-blur-sm rounded-xl border border-zinc-700/50 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Icon icon="mdi:chart-line" className="text-green-400" />
                Performance
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-zinc-300">TCG Win Rate</span>
                    <span className={`text-sm font-medium ${getWinRateColor(calculateWinRate(currentStats.tcg.wins, currentStats.tcg.losses))}`}>
                      {calculateWinRate(currentStats.tcg.wins, currentStats.tcg.losses).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-zinc-700/50 rounded-full h-2">
                    <div
                      className="h-full bg-linear-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                      style={{ width: `${calculateWinRate(currentStats.tcg.wins, currentStats.tcg.losses)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-zinc-500 mt-1">
                    <span>{currentStats.tcg.wins}W - {currentStats.tcg.losses}L</span>
                    <span>{currentStats.tcg.wins + currentStats.tcg.losses} games</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-zinc-300">Genesys Win Rate</span>
                    <span className={`text-sm font-medium ${getWinRateColor(calculateWinRate(currentStats.ocg.wins, currentStats.ocg.losses))}`}>
                      {calculateWinRate(currentStats.ocg.wins, currentStats.ocg.losses).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-zinc-700/50 rounded-full h-2">
                    <div
                      className="h-full bg-linear-to-r from-purple-500 to-pink-400 rounded-full transition-all duration-500"
                      style={{ width: `${calculateWinRate(currentStats.ocg.wins, currentStats.ocg.losses)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-zinc-500 mt-1">
                    <span>{currentStats.ocg.wins}W - {currentStats.ocg.losses}L</span>
                    <span>{currentStats.ocg.wins + currentStats.ocg.losses} games</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;