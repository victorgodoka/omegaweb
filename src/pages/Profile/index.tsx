import React, { useState, useMemo, useEffect, useCallback, lazy, Suspense } from 'react';
import { useParams } from 'react-router';
import { Icon } from '@iconify/react';
import { api } from '@/utils/Api';
import { getTierInfo, tcgHref } from '@/utils/Functions';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import type {
  ProfileData,
  ProfileStatsQueue,
  ProfileCustomizationData,
  MatchHistory,
} from './types';
import { useCache } from '@/contexts/CacheContext';
import { useAuthContext } from '@/contexts/AuthContext';

const ProfileSkeleton = lazy(() => import('./components/ProfileSkeleton'));
const MatchHistoryCard = lazy(() => import('./components/MatchHistoryCard'));

const Profile2: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { cardStats } = useCache();
  const { user } = useAuthContext();
  const [gameMode, setGameMode] = useState<'tcg' | 'genesys'>('tcg');
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [statsData, setStatsData] = useState<ProfileStatsQueue | null>(null);
  const [customizationData, setCustomizationData] = useState<ProfileCustomizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{ tcg: number; genesys: number }>({ tcg: 1, genesys: 1 });

  // Fetch all profile data
  const fetchProfileData = useCallback(async () => {
    if (!id) {
      setError('Profile ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch basic profile data
      const profileResponse = await api.external.duelistsUnite.getPlayer(id);
      if (profileResponse.ok && profileResponse.data) {
        setProfileData(profileResponse.data);
      } else {
        throw new Error('Failed to load profile data');
      }

      // Fetch stats and match history
      const decksResponse = await api.external.duelistsUnite.getPlayerDecks(id, {
        tcgPage: pagination.tcg,
        genesysPage: pagination.genesys
      });
      if (decksResponse.success && decksResponse.data) {
        setStatsData(decksResponse.data);
      }

      // Fetch customization data (optional, won't fail the page)
      try {
        const customResponse = await api.external.duelistsUnite.getPlayerCustomization(id);
        if (customResponse.success && customResponse.data) {
          setCustomizationData(customResponse.data);
        }
      } catch (err) {
        console.log('No customization data available');
        setCustomizationData(null);
      }
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [id, pagination.tcg, pagination.genesys]);

  useEffect(() => {
    fetchProfileData();
  }, [id]);

  // Handle pagination changes
  useEffect(() => {
    if (pagination.tcg > 1 || pagination.genesys > 1) {
      fetchProfileData();
    }
  }, [pagination.tcg, pagination.genesys]);

  const calculateWinRate = (wins: number, losses: number, draws: number = 0): number => {
    const total = wins + losses + draws;
    return total > 0 ? (wins / total) * 100 : 0;
  };

  const getWinRateColor = (winRate: number): string => {
    if (winRate >= 70) return 'text-green-400';
    if (winRate >= 55) return 'text-blue-400';
    if (winRate >= 45) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getTierGradient = (tier: string): string => {
    const tierMap: Record<string, string> = {
      omega: 'from-purple-600 via-pink-600 to-red-600',
      master: 'from-red-600 via-orange-500 to-yellow-500',
      diamond: 'from-cyan-400 via-blue-500 to-purple-600',
      platinum: 'from-teal-400 via-cyan-500 to-blue-600',
      gold: 'from-yellow-400 via-orange-400 to-yellow-600',
      silver: 'from-gray-300 via-gray-400 to-gray-500',
      bronze: 'from-orange-600 via-amber-700 to-orange-800',
      iron: 'from-zinc-600 via-zinc-700 to-zinc-800'
    };
    return tierMap[tier.toLowerCase()] || 'from-zinc-600 via-zinc-700 to-zinc-800';
  };

  const formatLastSeen = (isoDate: string): string => {
    const date = new Date(isoDate);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const formatMatchDuration = (start: string, end: string): string => {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const diff = endTime - startTime;
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m`;
  };

  // Computed values
  const currentStats = useMemo(() => {
    if (!profileData) return { wins: 0, losses: 0, draws: 0, rating: 0 };
    return gameMode === 'tcg'
      ? {
          wins: profileData.tcgwins || 0,
          losses: profileData.tcgloses || 0,
          draws: profileData.tcgdraws || 0,
          rating: profileData.tcgrating || 0
        }
      : {
          wins: profileData.ocgwins || 0,
          losses: profileData.ocgloses || 0,
          draws: profileData.ocgdraws || 0,
          rating: profileData.ocgrating || 0
        };
  }, [profileData, gameMode]);

  const currentTierInfo = useMemo(() => {
    if (!currentStats.rating) return { name: 'Unranked', image: '/tiers/unranked.png' };
    return getTierInfo(currentStats.rating);
  }, [currentStats.rating, gameMode]);

  const winRate = calculateWinRate(currentStats.wins, currentStats.losses, currentStats.draws);

  const currentGameData = useMemo(() => {
    return statsData?.[gameMode];
  }, [statsData, gameMode]);

  // Check if profile is private and if current user is viewing their own profile
  const isOwnProfile = user.id === id;
  const isPrivate = customizationData?.hide_history === 1;
  const canViewPrivateData = isOwnProfile || !isPrivate;

  if (loading) {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
          <div className="text-center">
            <Icon icon="mdi:loading" className="text-6xl text-blue-500 mx-auto mb-4 animate-spin" />
            <p className="text-zinc-300">Loading profile...</p>
          </div>
        </div>
      }>
        <ProfileSkeleton />
      </Suspense>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <Icon icon="mdi:account-off" className="text-6xl text-zinc-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-zinc-300 mb-2">Profile Not Found</h2>
          <p className="text-zinc-500">{error || 'The profile you\'re looking for doesn\'t exist.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100">
      {/* Banner Section */}
      <div
        className="relative h-64 md:h-80 lg:h-96 bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900 overflow-hidden"
        style={{
          backgroundImage: customizationData?.duelist_banner_url
            ? `url(${customizationData.duelist_banner_url})`
            : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-zinc-900/50 to-zinc-900"></div>
        
        {/* Profile Header */}
        <div className="relative h-full flex items-end pb-6 md:pb-8">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 md:gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className={`absolute -inset-1 rounded-full bg-linear-to-r ${getTierGradient(currentTierInfo.name)} opacity-75 blur`}></div>
                <div className="relative">
                  <PlayerAvatar
                    id={profileData.id}
                    avatar={profileData.avatar}
                    displayname={profileData.displayname}
                    username={profileData.username}
                    rounded={true}
                    size="lg"
                    bordered={true}
                  />
                  {/* Rank Badge */}
                  <div className="absolute -bottom-2 -right-2 md:-bottom-3 md:-right-3">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full bg-linear-to-r ${getTierGradient(currentTierInfo.name)} p-0.5 shadow-lg`}>
                      <div className="w-full h-full rounded-full bg-zinc-900 p-1.5 flex items-center justify-center">
                        <img
                          src={`/badges/TCG/${currentTierInfo.name.toLowerCase()}.png`}
                          alt={currentTierInfo.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1">
                  {profileData.displayname}
                </h1>
                <p className="text-zinc-300 text-base md:text-lg mb-2">
                  @{profileData.username}
                </p>
                <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-zinc-400 mb-3">
                  <Icon icon="mdi:clock-outline" className="text-base" />
                  <span>Last seen: {formatLastSeen(profileData.lastlogin)}</span>
                </div>

                {/* Social Links */}
                {customizationData && (
                  <div className="flex gap-3 justify-center sm:justify-start">
                    {customizationData.socialTwitch && (
                      <a
                        href={`https://twitch.tv/${customizationData.socialTwitch}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        <Icon icon="mdi:twitch" className="w-6 h-6" />
                      </a>
                    )}
                    {customizationData.socialYoutube && (
                      <a
                        href={`https://youtube.com/@${customizationData.socialYoutube}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-500 hover:text-red-400 transition-colors"
                      >
                        <Icon icon="mdi:youtube" className="w-6 h-6" />
                      </a>
                    )}
                    {customizationData.socialX && (
                      <a
                        href={`https://twitter.com/${customizationData.socialX}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <Icon icon="mdi:twitter" className="w-6 h-6" />
                      </a>
                    )}
                    {customizationData.socialInstagram && (
                      <a
                        href={`https://instagram.com/${customizationData.socialInstagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-400 hover:text-pink-300 transition-colors"
                      >
                        <Icon icon="mdi:instagram" className="w-6 h-6" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Game Mode Toggle */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-zinc-800/80 backdrop-blur-sm rounded-lg p-1 border border-zinc-700/50">
            <button
              onClick={() => {
                setGameMode('tcg');
                setPagination({ tcg: 1, genesys: 1 });
              }}
              className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${
                gameMode === 'tcg'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-zinc-300 hover:bg-zinc-700/50'
              }`}
            >
              TCG
            </button>
            <button
              onClick={() => {
                setGameMode('genesys');
                setPagination({ tcg: 1, genesys: 1 });
              }}
              className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${
                gameMode === 'genesys'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-zinc-300 hover:bg-zinc-700/50'
              }`}
            >
              Genesys
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Bio & Favorite Card */}
          {customizationData?.duelist_bio && (
            <div className="lg:col-span-2 bg-zinc-800/60 backdrop-blur-sm rounded-xl border border-zinc-700/50 p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Icon icon="mdi:card-account-details" className="text-blue-400" />
                    About
                  </h2>
                  <div
                    className="text-zinc-300 leading-relaxed prose prose-invert prose-sm"
                    dangerouslySetInnerHTML={{ __html: customizationData.duelist_bio }}
                  />
                </div>
                {customizationData.duelist_favorite && (
                  <div className="flex flex-col items-center">
                    <h3 className="text-sm font-medium text-zinc-400 mb-2">Favorite Card</h3>
                    <a
                      href={tcgHref(cardStats.find(card => card.id === customizationData.duelist_favorite)?.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative w-32 h-44 rounded-lg overflow-hidden border-2 border-amber-400/30 shadow-xl transition-all hover:scale-105 hover:border-amber-400/60 hover:shadow-2xl hover:shadow-amber-400/20"
                      title={cardStats.find(card => card.id === customizationData.duelist_favorite)?.name || 'Favorite Card'}
                    >
                      <img
                        src={`https://images.ygoprodeck.com/images/cards_cropped/${customizationData.duelist_favorite}.jpg`}
                        alt={cardStats.find(card => card.id === customizationData.duelist_favorite)?.name || 'Favorite Card'}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Performance Stats */}
          <div className={`bg-zinc-800/60 backdrop-blur-sm rounded-xl border border-zinc-700/50 p-6 ${!customizationData?.duelist_bio ? 'lg:col-span-3' : ''}`}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Icon icon="mdi:chart-line" className="text-green-400" />
              Performance - {gameMode.toUpperCase()}
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-zinc-400">Rating</span>
                  <span className="text-2xl font-bold">{Math.floor(currentStats.rating)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-zinc-400">Rank</span>
                  <span className="text-xl font-bold text-purple-400">{currentTierInfo.name}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-zinc-400">Win Rate</span>
                  <span className={`text-xl font-bold ${getWinRateColor(winRate)}`}>
                    {winRate.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="pt-4 border-t border-zinc-700">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-400">{currentStats.wins}</div>
                    <div className="text-xs text-zinc-500">Wins</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-400">{currentStats.losses}</div>
                    <div className="text-xs text-zinc-500">Losses</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-400">{currentStats.draws}</div>
                    <div className="text-xs text-zinc-500">Draws</div>
                  </div>
                </div>
              </div>
              {currentGameData?.totalGaming && (
                <div className="pt-4 border-t border-zinc-700">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Total Gaming Time</span>
                    <span className="text-lg font-semibold text-blue-400">{currentGameData.totalGaming}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Decks & Opponents */}
        {canViewPrivateData ? (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Top Decks */}
          <div className="bg-zinc-800/60 backdrop-blur-sm rounded-xl border border-zinc-700/50 p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Icon icon="mdi:cards" className="text-purple-400" />
              Top 3 Decks
            </h2>
            <div className="space-y-3">
              {currentGameData?.mostUsedArchetypes && currentGameData.mostUsedArchetypes.length > 0 ? (
                currentGameData.mostUsedArchetypes.slice(0, 3).map((deck, index) => {
                  const deckWinRate = calculateWinRate(deck.wins, deck.loss);
                  return (
                    <div
                      key={index}
                      className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-700/30 hover:border-purple-500/50 transition-all"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-zinc-200">{deck.deck}</h3>
                        <span className="text-xs bg-zinc-700/50 px-2 py-1 rounded-full">
                          {deck.total} games
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span className="text-zinc-400">
                          {deck.wins}W - {deck.loss}L
                        </span>
                        <span className={`font-semibold ${getWinRateColor(deckWinRate)}`}>
                          {deckWinRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-zinc-700/50 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-green-500 to-green-400 transition-all"
                          style={{ width: `${deckWinRate}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-zinc-500">
                  No deck data available for {gameMode.toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Top Opponents */}
          <div className="bg-zinc-800/60 backdrop-blur-sm rounded-xl border border-zinc-700/50 p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Icon icon="mdi:account-group" className="text-red-400" />
              Top 3 Opponent Decks
            </h2>
            <div className="space-y-3">
              {currentGameData?.opponentDecks && currentGameData.opponentDecks.length > 0 ? (
                currentGameData.opponentDecks.slice(0, 3).map((opponent, index) => {
                  const oppWinRate = calculateWinRate(opponent.wins, opponent.loss);
                  return (
                    <div
                      key={index}
                      className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-700/30 hover:border-red-500/50 transition-all"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-zinc-200">{opponent.deck}</h3>
                        <span className="text-xs bg-zinc-700/50 px-2 py-1 rounded-full">
                          {opponent.total} games
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span className="text-zinc-400">
                          {opponent.wins}W - {opponent.loss}L
                        </span>
                        <span className={`font-semibold ${getWinRateColor(oppWinRate)}`}>
                          {oppWinRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-zinc-700/50 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-green-500 to-green-400 transition-all"
                          style={{ width: `${oppWinRate}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-zinc-500">
                  No opponent data available for {gameMode.toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Match History */}
        <div className="bg-zinc-800/60 backdrop-blur-sm rounded-xl border border-zinc-700/50 p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Icon icon="mdi:history" className="text-blue-400" />
            Match History
          </h2>
          
          <div>
            {currentGameData?.matchHistory && currentGameData.matchHistory.length > 0 ? (
              <Suspense fallback={
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-64 bg-zinc-800/30 rounded-xl animate-pulse"></div>
                  ))}
                </div>
              }>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentGameData.matchHistory.map((match: MatchHistory, index: number) => (
                    <MatchHistoryCard
                      key={index}
                      match={match}
                      formatMatchDuration={formatMatchDuration}
                      cardStats={cardStats}
                    />
                  ))}
                </div>
              </Suspense>
            ) : (
              <div className="text-center py-12 text-zinc-500">
                <Icon icon="mdi:history" className="text-5xl mx-auto mb-3 opacity-50" />
                <p>No match history available for {gameMode.toUpperCase()}</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {currentGameData?.pagination && currentGameData.pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => setPagination(prev => ({
                  ...prev,
                  [gameMode]: Math.max(1, prev[gameMode] - 1)
                }))}
                disabled={pagination[gameMode] <= 1}
                className="px-4 py-2 rounded-lg bg-zinc-700/50 border border-zinc-600/50 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors"
              >
                <Icon icon="mdi:chevron-left" className="text-xl" />
              </button>
              <span className="px-4 py-2 text-sm text-zinc-300">
                Page {currentGameData.pagination.currentPage} of {currentGameData.pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination(prev => ({
                  ...prev,
                  [gameMode]: Math.min(currentGameData.pagination.totalPages, prev[gameMode] + 1)
                }))}
                disabled={pagination[gameMode] >= currentGameData.pagination.totalPages}
                className="px-4 py-2 rounded-lg bg-zinc-700/50 border border-zinc-600/50 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors"
              >
                <Icon icon="mdi:chevron-right" className="text-xl" />
              </button>
            </div>
          )}
        </div>
        </>
        ) : (
          <div className="bg-zinc-800/60 backdrop-blur-sm rounded-xl border border-zinc-700/50 p-12 text-center">
            <Icon icon="mdi:lock" className="text-6xl text-zinc-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-zinc-300 mb-2">Private Profile</h2>
            <p className="text-zinc-500">This user has chosen to keep their match history and statistics private.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile2;
