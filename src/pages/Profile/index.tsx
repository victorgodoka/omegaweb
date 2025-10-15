import React, { useState, useEffect, useMemo, useCallback, memo, lazy, Suspense } from 'react';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import type {
  ProfileData,
  ProfileStatsData,
  ProfileCustomizationData,
  MostUsedArchetype,
  OpponentDeck
} from './types';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { Icon } from '@iconify/react';
import { getTierInfo } from '@/utils/Functions';
import { api } from '@/utils/Api';
import { useAuth } from '@/hooks/useAuth';

// Lazy load heavy components
const ProfileSkeleton = lazy(() => import('./components/ProfileSkeleton'));
const MatchHistoryCard = lazy(() => import('./components/MatchHistoryCard'));

const Profile: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { userId: currentUserId } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [statsData, setStatsData] = useState<ProfileStatsData | null>(null);
  const [customizationData, setCustomizationData] = useState<ProfileCustomizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoized random card ID calculation for default banner
  const defaultBannerUrl = useMemo(() => {
    if (!statsData?.mostUsedArchetypes?.length || !statsData?.matchHistory?.length) return null;

    const mostUsedArchetype = statsData.mostUsedArchetypes[0];

    // Find matches where the duelist used this archetype
    const matchesWithArchetype = statsData.matchHistory.filter(match =>
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
  }, [statsData?.mostUsedArchetypes, statsData?.matchHistory]);

  // Memoized computed values
  const currentStats = useMemo(() => {
    if (!profileData) return { wins: 0, losses: 0, draws: 0, rating: 0 };
    return {
      wins: profileData.tcgwins || 0,
      losses: profileData.tcgloses || 0,
      draws: profileData.tcgdraws || 0,
      rating: profileData.tcgrating || 0
    };
  }, [profileData]);

  const tierInfo = useMemo(() => {
    if (!currentStats.rating) return { name: 'Unranked', image: '/tiers/unranked.png' };
    return getTierInfo(currentStats.rating, 'TCG');
  }, [currentStats.rating]);

  // Check if the current user is viewing their own profile
  const isOwnProfile = useMemo(() => {
    return currentUserId && id && currentUserId === id;
  }, [currentUserId, id]);

  // Optimized parallel API fetching
  const fetchProfileData = useCallback(async () => {
    if (!id) {
      setError('Profile ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Reset all state when navigating to a new profile
      setProfileData(null);
      setStatsData(null);
      setCustomizationData(null);

      // Fetch all data in parallel for better performance
      const results = await Promise.allSettled([
        api.main.get(`profile?id=${id}`),
        api.main.get(`decks?id=${id}`),
        api.main.get(`duelist?id=${id}`)
      ]);

      const [profileRes, decksRes, customizationRes] = results;

      // Handle profile data
      if (profileRes.status === 'fulfilled' && profileRes.value.ok) {
        if (profileRes.value.success) {
          setProfileData(profileRes.value.data);
        }
      }

      // Handle decks data
      if (decksRes.status === 'fulfilled' && decksRes.value.ok) {
        if (decksRes.value.success) {
          setStatsData(decksRes.value.data);
        }
      }

      // Handle customization data (optional) - reset to null if request fails or returns 404
      if (customizationRes.status === 'fulfilled' && customizationRes.value.ok) {
        if (customizationRes.value.success) {
          setCustomizationData(customizationRes.value.data);
        } else {
          // API returned non-success response (like 404) - ensure customization data is null
          setCustomizationData(null);
        }
      } else {
        // Request failed or was rejected - ensure customization data is null
        setCustomizationData(null);
      }
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const calculateWinRate = (wins: number, losses: number): number => {
    const totalGames = wins + losses;
    if (totalGames === 0) return 0;
    return (wins / totalGames) * 100;
  };

  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const WinRateBar = memo(({ wins, losses }: { wins: number; losses: number }) => {
    const winRate = calculateWinRate(wins, losses);
    const totalGames = wins + losses;

    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-1">
          <span className="text-green-200 text-xs">{wins}W - {losses}L</span>
          <span className="text-cyan-200 text-sm font-semibold">{winRate.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-zinc-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${totalGames > 0 ? winRate : 0}%` }}
          ></div>
        </div>
      </div>
    );
  });

  const ArchetypeCard = memo(({ archetype }: { archetype: MostUsedArchetype }) => (
    <div className="group relative overflow-hidden bg-gradient-to-r from-zinc-800/60 to-zinc-800/40 rounded-lg border border-zinc-700/50 p-4 hover:border-purple-500/50 transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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
    <div className="group relative overflow-hidden bg-gradient-to-r from-zinc-800/60 to-zinc-800/40 rounded-lg border border-zinc-700/50 p-4 hover:border-red-500/50 transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-r from-red-600/5 to-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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
    <div className="min-h-screen bg-zinc-900 text-zinc-100">
      {/* Enhanced Banner */}
      <div
        className="h-98 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden"
        style={{
          backgroundImage: customizationData?.duelist_banner_url
            ? `url(${customizationData.duelist_banner_url})`
            : defaultBannerUrl
              ? `url(${defaultBannerUrl})`
              : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/80"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 via-purple-600/20 to-pink-600/30"></div>

        {/* Animated Background Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-400/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-20 right-20 w-16 h-16 bg-purple-400/20 rounded-full blur-lg animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-pink-400/20 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      <div className="container mx-auto px-4 -mt-20 relative z-10">
        {/* Compact Profile Header */}
        <div className="bg-zinc-800/95 flex backdrop-blur-sm rounded-xl border border-zinc-700/50 shadow-2xl overflow-hidden mb-8">
          <div className="flex w-full max-w-xl flex-col md:flex-row items-center md:items-start p-6 space-y-4 md:space-y-0 md:space-x-6">
            {/* Avatar Section */}
            <div className="relative flex-shrink-0">
              <div className={`absolute -inset-2 bg-gradient-to-r ${getTierGradient(tierInfo.name)} rounded-full blur-sm opacity-60`}></div>
              <div className={`absolute -inset-1 bg-gradient-to-r ${getTierGradient(tierInfo.name)} rounded-full opacity-30`}></div>
              <div className="relative rounded-full overflow-hidden ring-4 ring-white/20 shadow-2xl">
                <PlayerAvatar
                  id={profileData.id}
                  avatar={profileData.avatar}
                  displayname={profileData.displayname}
                  username={profileData.username}
                  className="w-full h-full object-cover"
                  rounded={true}
                  size="lg"
                />
              </div>
              {/* Tier Badge Overlay */}
              <div className="absolute -bottom-2 -right-2">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${getTierGradient(tierInfo.name)} p-0.5 shadow-lg`}>
                  <img
                    src={tierInfo.image}
                    alt={`${tierInfo.name} Tier`}
                    className="w-full h-full rounded-full bg-zinc-900 p-0.5"
                  />
                </div>
              </div>
            </div>

            {/* Main Info Section */}
            <div className="flex-1 text-center md:text-left">
              <div className="mb-3">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent mb-1">
                  {profileData.displayname}
                </h1>
                <p className="text-zinc-400 text-lg">@{profileData.username}</p>
              </div>

              {/* Tier and Stats Pills */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-3">
                <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${getTierGradient(tierInfo.name)} bg-opacity-20 border border-white/10`}>
                  <span className="text-white/80 font-medium">{Math.floor(currentStats.rating)} Rating</span>
                </div>

                <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-900/30 rounded-full border border-green-500/30">
                  <span className="text-green-300 font-medium text-sm">{currentStats.wins}W</span>
                </div>

                <div className="flex items-center space-x-2 px-3 py-1.5 bg-red-900/30 rounded-full border border-red-500/30">
                  <span className="text-red-300 font-medium text-sm">{currentStats.losses}L</span>
                </div>

                {currentStats.draws > 0 && (
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-yellow-900/30 rounded-full border border-yellow-500/30">
                    <span className="text-yellow-300 font-medium text-sm">{currentStats.draws}D</span>
                  </div>
                )}
              </div>

              <div className="text-xs text-zinc-500">
                Last seen: {formatDate(profileData.lastlogin)}
              </div>

              {/* Social Media Links */}
              {customizationData && (customizationData.socialTwitch || customizationData.socialYoutube || customizationData.socialX || customizationData.socialInstagram) && (
                <div className="flex gap-3 mt-3 justify-center md:justify-start">
                  {customizationData.socialTwitch && (
                    <a
                      href={`https://twitch.tv/${customizationData.socialTwitch}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 transition-colors"
                      title={`Twitch: ${customizationData.socialTwitch}`}
                    >
                      <Icon icon="mdi:twitch" className="w-6 h-6" />
                    </a>
                  )}
                  {customizationData.socialYoutube && (
                    <a
                      href={`https://youtube.com/@${customizationData.socialYoutube}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-400 hover:text-red-300 transition-colors"
                      title={`YouTube: ${customizationData.socialYoutube}`}
                    >
                      <Icon icon="mdi:youtube" className="w-6 h-6" />
                    </a>
                  )}
                  {customizationData.socialX && (
                    <a
                      href={`https://x.com/${customizationData.socialX}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                      title={`X: ${customizationData.socialX}`}
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
                      title={`Instagram: ${customizationData.socialInstagram}`}
                    >
                      <Icon icon="mdi:instagram" className="w-6 h-6" />
                    </a>
                  )}
                </div>
              )}
              {/* Favorite Card Section */}
              {customizationData?.duelist_favorite && (
                <div className="p-4 bg-zinc-800/30">
                  <h5 className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                    <Icon icon="mdi:cards" className="text-orange-500" />
                    {t('profile.favorite_card')}
                  </h5>
                  <img
                    src={`https://images.ygoprodeck.com/images/cards_cropped/${customizationData.duelist_favorite}.jpg`}
                    alt="Favorite Card"
                    className="w-32 h-auto border border-zinc-600 rounded-lg bg-zinc-700 p-1"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Separate Bio Section */}
          {customizationData?.duelist_bio && (
            <div className="border-t border-zinc-700/50 p-4 bg-zinc-800/30">
              <div
                className="text-zinc-300 text-sm prose prose-invert prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: customizationData.duelist_bio }}
              />
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[.5fr_1fr] gap-8 mb-8">
          {/* Left Column - Analytics, Favorite Decks, Rival Decks */}
          <div className="space-y-8">
            {/* Performance Overview */}
            <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-4">
              <h2 className="text-lg font-semibold text-zinc-200 mb-4">Performance</h2>
              <WinRateBar wins={currentStats.wins} losses={currentStats.losses} />
            </div>

            {/* Most Used Archetypes */}
            <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-4">
              <h2 className="text-lg font-semibold text-zinc-200 mb-4">Favorite Decks</h2>
              <div className="space-y-3">
                {statsData.mostUsedArchetypes.slice(0, 5).map((archetype, index) => (
                  <ArchetypeCard key={index} archetype={archetype} />
                ))}
              </div>
            </div>

            {/* Frequent Opponents */}
            <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-4">
              <h2 className="text-lg font-semibold text-zinc-200 mb-4">Rival Decks</h2>
              <div className="space-y-3">
                {statsData.opponentDecks.slice(0, 5).map((opponent, index) => (
                  <OpponentCard key={index} opponent={opponent} />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Match History */}
          <div>
            <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-4">
              <h2 className="text-lg font-semibold text-zinc-200 mb-4">Match History</h2>
              <div className="space-y-3">
                {customizationData?.hide_history !== 0 && !isOwnProfile ? (
                  <div className="text-center py-8 text-zinc-500">
                    <Icon icon="mdi:lock" className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{t('profile.match_history_private')}</p>
                  </div>
                ) : (
                  statsData.matchHistory.slice(0, 10).map((match, index) => (
                    <Suspense key={index} fallback={<div className="p-4 bg-zinc-700/30 rounded border border-zinc-600/30 animate-pulse h-20"></div>}>
                      <MatchHistoryCard match={match} formatDate={formatDate} />
                    </Suspense>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;