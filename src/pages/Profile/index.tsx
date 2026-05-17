import React, { useState, useMemo, useEffect, useCallback, lazy, Suspense } from 'react';
import { useParams } from 'react-router';
import { Icon } from '@iconify/react';
import { api, type SavedDeck } from '@/utils/Api';
import { unwrapApiPayload } from '@/utils/unwrapApiPayload';
import { getTierInfo, tcgHref } from '@/utils/Functions';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { useTranslation } from 'react-i18next';
import type {
  ProfileData,
  ProfileStatsQueue,
  ProfileCustomizationData,
  MatchHistory,
} from './types';
import { useCardsSearch } from '@/contexts/CardsSearchContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { AuthManager } from '@/utils/auth';
import DeckCard from '@/pages/SavedDecks/components/DeckCard';

const ProfileSkeleton = lazy(() => import('./components/ProfileSkeleton'));
const MatchHistoryCard = lazy(() => import('./components/MatchHistoryCard'));

const Profile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const { cards, searchCards } = useCardsSearch();
  const { user } = useAuthContext();

  // Transform cards to match the expected format (id, name)
  const cardStats = useMemo(() => {
    return cards.map(card => ({
      id: card.id,
      name: card.name_en || card.name_pt || `Card ${card.id}`
    }));
  }, [cards]);
  const [viewMode, setViewMode] = useState<'tcg' | 'genesys' | 'myDecks'>('tcg');
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [statsData, setStatsData] = useState<ProfileStatsQueue | null>(null);
  const [customizationData, setCustomizationData] = useState<ProfileCustomizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{ tcg: number; genesys: number }>({ tcg: 1, genesys: 1 });
  const [userDecks, setUserDecks] = useState<SavedDeck[]>([]);
  const [loadingDecks, setLoadingDecks] = useState(false);
  const [deckError, setDeckError] = useState<string | null>(null);

  const gameMode: 'tcg' | 'genesys' = viewMode === 'myDecks' ? 'tcg' : viewMode;

  // Fetch stats and match history only
  const fetchStats = useCallback(async () => {
    
    if (!id) {
      return;
    }

    try {
      setLoadingStats(true);
      const decksResponse = await api.external.duelistsUnite.getPlayerDecks(id, {
        tcgPage: pagination.tcg,
        genesysPage: pagination.genesys
      });
      
      if (decksResponse.ok && decksResponse.data) {
        const actualData = unwrapApiPayload<ProfileStatsQueue>(decksResponse.data);
        if (actualData) setStatsData(actualData);
      } else {
        console.warn('[Profile/fetchStats] Failed to fetch stats:', decksResponse.message);
      }
    } catch (err) {
      console.error('[Profile/fetchStats] Error fetching stats data:', err);
    } finally {
      setLoadingStats(false);
    }
  }, [id, pagination.tcg, pagination.genesys]);

  // Fetch user decks for My Decks view
  const fetchUserDecks = useCallback(async () => {
    if (!id) return;

    try {
      setLoadingDecks(true);
      setDeckError(null);

      const token = AuthManager.getToken();
      const isOwnProfile = user?.id === id;
      const response = await api.main.getUserDecks(id, isOwnProfile && token ? token : undefined);

      if (response.ok && response.data) {
        const raw = response.data;
        const list: SavedDeck[] = Array.isArray(raw)
          ? raw
          : unwrapApiPayload<SavedDeck[]>(raw) ?? [];
        setUserDecks(list);
      } else {
        setDeckError(response.message || i18n.t('saved_decks.create_error'));
      }
    } catch (err) {
      console.error('[Profile/fetchUserDecks] Error fetching user decks:', err);
      setDeckError(i18n.t('common.network_error'));
    } finally {
      setLoadingDecks(false);
    }
  }, [id, user?.id, i18n]);

  // Fetch all profile data (only depends on profile id, not language)
  const fetchProfileData = useCallback(async () => {
    if (!id) {
      setError(i18n.t('profile_page.error_profile_id_required'));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch basic profile data
      const profileResponse = await api.external.duelistsUnite.getPlayer(id);
      
      if (profileResponse.ok && profileResponse.data) {
        const data = unwrapApiPayload<ProfileData>(profileResponse.data);
        if (data) setProfileData(data);
      } else {
        throw new Error(i18n.t('profile_page.error_failed_load_profile'));
      }

      // Fetch stats and match history
      const decksResponse = await api.external.duelistsUnite.getPlayerDecks(id, {
        tcgPage: 1,
        genesysPage: 1
      });
      
      if (decksResponse.ok && decksResponse.data) {
        const actualData = unwrapApiPayload<ProfileStatsQueue>(decksResponse.data);
        if (actualData) setStatsData(actualData);
      } else {
        console.warn('[Profile/fetchProfileData] Failed to fetch decks data');
      }

      try {
        const customResponse = await api.external.duelistsUnite.getPlayerCustomization(id);
        
        if (customResponse.ok && customResponse.data) {
          const customData = unwrapApiPayload<ProfileCustomizationData>(customResponse.data);
          if (customData) {
            searchCards({ id: customData.duelist_favorite });
            setCustomizationData(customData);
          }
        }
      } catch (err) {
        console.warn('[Profile/fetchProfileData] Failed to fetch customization:', err);
        setCustomizationData(null);
      }
    } catch (err) {
      console.error('[Profile/fetchProfileData] Error fetching profile data:', err);
      setError(err instanceof Error ? err.message : i18n.t('profile_page.error_generic'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Reset state immediately when id changes
  useEffect(() => {
    setProfileData(null);
    setStatsData(null);
    setCustomizationData(null);
    setPagination({ tcg: 1, genesys: 1 });
    setViewMode('tcg');
    setError(null);
    setUserDecks([]);
    setLoadingDecks(false);
    setDeckError(null);
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  // Handle pagination changes - only reload stats
  useEffect(() => {
    if (pagination.tcg > 1 || pagination.genesys > 1) {
      fetchStats();
    }
  }, [pagination.tcg, pagination.genesys, fetchStats]);

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
    const data = statsData?.[gameMode];
    return data;
  }, [statsData, gameMode]);

  // Check if profile is private and if current user is viewing their own profile
  const isOwnProfile = user?.id === id;
  const isPrivate = customizationData?.hide_history === 1;
  const canViewPrivateData = isOwnProfile || !isPrivate;

  if (loading) {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-linear-to-b to-black from-zinc-900 flex items-center justify-center">
          <div className="text-center">
            <Icon icon="mdi:loading" className="text-6xl text-blue-500 mx-auto mb-4 animate-spin" />
            <p className="text-zinc-300">{t('profile_page.loading')}</p>
          </div>
        </div>
      }>
        <ProfileSkeleton />
      </Suspense>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-linear-to-b to-black from-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <Icon icon="mdi:account-off" className="text-6xl text-zinc-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-zinc-300 mb-2">{t('profile_page.not_found_title')}</h2>
          <p className="text-zinc-500">{error || t('profile_page.not_found_message')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-t to-black from-zinc-900 text-zinc-100">
      {/* Banner Section */}
      <div
        className="relative h-64 md:h-80 lg:h-96 overflow-hidden bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900"
        style={{
          backgroundImage: customizationData?.duelist_banner_url
            ? `url(${customizationData.duelist_banner_url})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 z-40 bg-linear-to-b from-transparent via-black/50 to-black"></div>

        {/* Profile Header */}
        <div className="relative h-full flex items-end pb-6 md:pb-8 z-40">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 md:gap-6">
              {/* Avatar */}
              <div className="relative">
                <div
                  className={`absolute -inset-1 rounded-full bg-linear-to-r ${getTierGradient(
                    currentTierInfo.name
                  )} opacity-75 blur`}
                ></div>
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
                    <div
                      className={`w-10 h-10 md:w-12 md:h-12 rounded-full bg-linear-to-r ${getTierGradient(
                        currentTierInfo.name
                      )} p-0.5 shadow-lg`}
                    >
                      <div className="w-full h-full rounded-full bg-zinc-900 p-1.5 flex items-center justify-center">
                        <img
                          src={`/badges/TCG/${currentTierInfo.name.toLowerCase()}.png`}
                          alt={currentTierInfo.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
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
                  <span>
                    {t("profile_page.last_seen_label")}:{" "}
                    {formatLastSeen(profileData.lastlogin)}
                  </span>
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
          <div className="inline-flex bg-zinc-900 rounded-md p-1 border border-zinc-800">
            <button
              onClick={() => {
                setViewMode("tcg");
                setPagination({ tcg: 1, genesys: 1 });
              }}
              className={`px-6 py-2 text-sm font-medium rounded transition-all ${
                viewMode === "tcg"
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {t("statistics.tcg")}
            </button>
            <button
              onClick={() => {
                setViewMode("genesys");
                setPagination({ tcg: 1, genesys: 1 });
              }}
              className={`px-6 py-2 text-sm font-medium rounded transition-all ${
                viewMode === "genesys"
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {t("statistics.genesys")}
            </button>
            <button
              onClick={() => {
                setViewMode("myDecks");
                if (!userDecks.length && !loadingDecks) {
                  fetchUserDecks();
                }
              }}
              className={`px-6 py-2 text-sm font-medium rounded transition-all ${
                viewMode === "myDecks"
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {isOwnProfile ? t('saved_decks.my_decks') : t('saved_decks.profile_decks')}
            </button>
          </div>
        </div>

        {viewMode === 'myDecks' ? (
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {isOwnProfile
                    ? t('saved_decks.my_decks')
                    : t('saved_decks.user_decks', { username: profileData.username })}
                </h2>
                <p className="text-sm text-zinc-500">
                  {isOwnProfile
                    ? t('saved_decks.no_decks_subtitle')
                    : t('saved_decks.public') + ' ' + t('saved_decks.decks')}
                </p>
              </div>
              {!loadingDecks && userDecks.length > 0 && (
                <span className="text-sm text-zinc-500">
                  {userDecks.length} {t('saved_decks.decks')}
                </span>
              )}
            </div>

            {loadingDecks ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {new Array(8).fill(0).map((_, i) => (
                  <div
                    key={`deck-skeleton-${i}`}
                    className="h-64 bg-zinc-900/60 border border-zinc-800 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : deckError ? (
              <div className="text-center py-12">
                <Icon icon="mdi:alert-circle" className="text-5xl text-red-400 mx-auto mb-3" />
                <p className="text-zinc-400 text-sm">{deckError}</p>
              </div>
            ) : userDecks.length === 0 ? (
              <div className="text-center py-12">
                <Icon icon="mdi:cards-outline" className="text-5xl text-zinc-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-zinc-300 mb-1">
                  {t('saved_decks.no_decks')}
                </h3>
                <p className="text-zinc-500 text-sm">
                  {t('saved_decks.no_decks_subtitle')}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {userDecks.map((deck) => (
                  <DeckCard
                    key={deck.id}
                    deck={deck}
                    showActions={isOwnProfile}
                  />
                ))}
              </div>
            )}
          </div>
        ) : canViewPrivateData ? (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Sidebar - Stats */}
            <div className="lg:w-80 xl:w-96 shrink-0 space-y-4">
              {/* Performance Stats Card */}
              <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
                    {t("profile.performance_title")}
                  </h2>
                  <span className="text-xs text-zinc-500">{gameMode.toUpperCase()}</span>
                </div>
                
                {/* Rating & Rank */}
                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-zinc-800">
                  <div className="w-14 h-14 rounded-lg bg-zinc-800 p-2 flex items-center justify-center">
                    <img
                      src={`/badges/TCG/${currentTierInfo.name.toLowerCase()}.png`}
                      alt={currentTierInfo.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                      }}
                    />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{Math.floor(currentStats.rating)}</div>
                    <div className="text-sm text-zinc-500">{currentTierInfo.name}</div>
                  </div>
                </div>

                {/* Win Rate */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-zinc-500">{t("statistics.win_rate")}</span>
                    <span className={`text-lg font-bold ${getWinRateColor(winRate)}`}>
                      {winRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-white transition-all"
                      style={{ width: `${winRate}%` }}
                    ></div>
                  </div>
                </div>

                {/* W/L/D Stats */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-zinc-800/50 rounded-md py-2">
                    <div className="text-lg font-bold text-green-400">{currentStats.wins}</div>
                    <div className="text-xs text-zinc-500">{t("statistics.wins")}</div>
                  </div>
                  <div className="bg-zinc-800/50 rounded-md py-2">
                    <div className="text-lg font-bold text-red-400">{currentStats.losses}</div>
                    <div className="text-xs text-zinc-500">{t("statistics.losses")}</div>
                  </div>
                  <div className="bg-zinc-800/50 rounded-md py-2">
                    <div className="text-lg font-bold text-zinc-400">{currentStats.draws}</div>
                    <div className="text-xs text-zinc-500">{t("profile_page.draws")}</div>
                  </div>
                </div>

                {currentGameData?.totalGaming && (
                  <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between items-center">
                    <span className="text-sm text-zinc-500">{t("profile_page.total_gaming_time")}</span>
                    <span className="text-sm font-medium text-white">{currentGameData.totalGaming}</span>
                  </div>
                )}
              </div>

              {/* Top Decks */}
              <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-5">
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">
                  {t("profile_page.top_decks")}
                </h2>
                <div className="space-y-2">
                  {currentGameData?.mostUsedArchetypes &&
                  currentGameData.mostUsedArchetypes.length > 0 ? (
                    currentGameData.mostUsedArchetypes.slice(0, 5).map((deck, index) => {
                      const deckWinRate = calculateWinRate(deck.wins, deck.loss);
                      return (
                        <div key={index} className="flex items-center gap-3 py-2 border-b border-zinc-800/50 last:border-0">
                          <span className="text-xs text-zinc-600 w-4">{index + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">{deck.deck}</div>
                            <div className="text-xs text-zinc-500">{deck.total} games</div>
                          </div>
                          <span className={`text-sm font-semibold ${getWinRateColor(deckWinRate)}`}>
                            {deckWinRate.toFixed(0)}%
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-4 text-zinc-600 text-sm">
                      {t("profile_page.no_deck_data", { mode: gameMode.toUpperCase() })}
                    </div>
                  )}
                </div>
              </div>

              {/* Top Opponents */}
              <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-5">
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">
                  {t("profile_page.top_opponent_decks")}
                </h2>
                <div className="space-y-2">
                  {currentGameData?.opponentDecks &&
                  currentGameData.opponentDecks.length > 0 ? (
                    currentGameData.opponentDecks.slice(0, 5).map((opponent, index) => {
                      const oppWinRate = calculateWinRate(opponent.wins, opponent.loss);
                      return (
                        <div key={index} className="flex items-center gap-3 py-2 border-b border-zinc-800/50 last:border-0">
                          <span className="text-xs text-zinc-600 w-4">{index + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">{opponent.deck}</div>
                            <div className="text-xs text-zinc-500">{opponent.total} games</div>
                          </div>
                          <span className={`text-sm font-semibold ${getWinRateColor(oppWinRate)}`}>
                            {oppWinRate.toFixed(0)}%
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-4 text-zinc-600 text-sm">
                      {t("profile_page.no_opponent_data", { mode: gameMode.toUpperCase() })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0 space-y-6">
              {/* Bio & Favorite Card */}
              {(customizationData?.duelist_bio || customizationData?.duelist_favorite) && (
                <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-5">
                  <div className="flex flex-col md:flex-row gap-6">
                    {customizationData.duelist_bio && (
                      <div className="flex-1">
                        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">
                          {t("profile_page.about")}
                        </h2>
                        <div
                          className="text-zinc-300 text-sm leading-relaxed prose prose-invert prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: customizationData.duelist_bio }}
                        />
                      </div>
                    )}
                    {customizationData.duelist_favorite && (
                      <div className="shrink-0">
                        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3 text-center md:text-left">
                          {t("profile.favorite_card")}
                        </h3>
                        <a
                          href={tcgHref(cardStats[0]?.name || `Card ${customizationData.duelist_favorite}`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-40 rounded-lg overflow-hidden border border-zinc-700 hover:border-zinc-600 transition-colors"
                          title={cardStats[0]?.name || t("profile.favorite_card")}
                        >
                          <img
                            src={`https://ygopro.online/assets/card-arts/${customizationData.duelist_favorite}.jpg`}
                            alt={cardStats[0]?.name || t("profile.favorite_card")}
                            className="w-full h-auto"
                            loading="lazy"
                          />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Match History */}
              <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
                    {t("profile.match_history_title")}
                  </h2>
                  {currentGameData?.pagination && currentGameData.pagination.totalPages > 0 && (
                    <span className="text-xs text-zinc-500">
                      {t("profile_page.pagination", {
                        current: currentGameData.pagination.currentPage,
                        total: currentGameData.pagination.totalPages,
                      })}
                    </span>
                  )}
                </div>

                {/* Scrollable container for mobile/tablet */}
                <div className="lg:max-h-none max-h-[600px] overflow-y-auto scrollbar-thin pr-2 -mr-2">
                  {loadingStats ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                      {new Array(12).fill(0).map((_, i) => (
                        <div key={`skeleton-${i}`} className="h-48 bg-zinc-800/50 rounded-lg animate-pulse"></div>
                      ))}
                    </div>
                  ) : currentGameData?.matchHistory && currentGameData.matchHistory.length > 0 ? (
                    <Suspense
                      fallback={
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                          {new Array(12).fill(0).map((_, i) => (
                            <div key={`skeleton-${i}`} className="h-48 bg-zinc-800/50 rounded-lg animate-pulse"></div>
                          ))}
                        </div>
                      }
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
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
                    <div className="text-center py-12 text-zinc-600">
                      <Icon icon="mdi:history" className="text-4xl mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{t("profile_page.no_match_history", { mode: gameMode.toUpperCase() })}</p>
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {currentGameData?.pagination && currentGameData.pagination.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-4 pt-4 border-t border-zinc-800">
                    <button
                      onClick={() => setPagination((prev) => ({ ...prev, [gameMode]: Math.max(1, prev[gameMode] - 1) }))}
                      disabled={pagination[gameMode] <= 1}
                      className="p-2 rounded-md bg-zinc-800 border border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors"
                    >
                      <Icon icon="mdi:chevron-left" className="text-lg" />
                    </button>
                    <span className="px-4 text-sm text-zinc-400">
                      {pagination[gameMode]} / {currentGameData.pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setPagination((prev) => ({ ...prev, [gameMode]: Math.min(currentGameData.pagination.totalPages, prev[gameMode] + 1) }))}
                      disabled={pagination[gameMode] >= currentGameData.pagination.totalPages}
                      className="p-2 rounded-md bg-zinc-800 border border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors"
                    >
                      <Icon icon="mdi:chevron-right" className="text-lg" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-800/60 backdrop-blur-sm rounded-xl border border-zinc-700/50 p-12 text-center">
            <Icon
              icon="mdi:lock"
              className="text-6xl text-zinc-600 mx-auto mb-4"
            />
            <h2 className="text-2xl font-bold text-zinc-300 mb-2">
              {t("profile_page.private_title")}
            </h2>
            <p className="text-zinc-500">{t("profile_page.private_message")}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
