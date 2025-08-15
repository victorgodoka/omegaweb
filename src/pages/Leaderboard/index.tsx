import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { LeaderboardResponse, LeaderboardPlayer } from './types';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { Link } from 'react-router';
import { getTierInfo } from '@/utils/Functions';

const Leaderboard: React.FC = () => {
  const { t } = useTranslation();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<'TCG' | 'OCG'>('TCG');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(import.meta.env.VITE_API_URL + '/leaderboard');
        if (!response.ok) {
          setError(t('leaderboard_page.error_loading'));
          return;
        }

        const data: LeaderboardResponse = await response.json();
        if (!data.success) {
          setError(t('leaderboard_page.api_unsuccessful'));
          return;
        }

        setLeaderboardData(data);
      } catch (err) {
        setError(t('common.network_error'));
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const calculateWinRate = (wins: number, losses: number): number => {
    const totalGames = wins + losses;
    if (totalGames === 0) return 0;
    return (wins / totalGames) * 100;
  };

  const WinRateBar = ({ player }: { player: LeaderboardPlayer }) => {
    const winRate = calculateWinRate(player.wins, player.loses);
    const totalGames = player.wins + player.loses;

    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-1">
          <span className="text-green-200 text-xs">{t('leaderboard_page.win_loss', { wins: player.wins, losses: player.loses })}</span>
          <span className="text-cyan-200 text-lg font-semibold">{winRate.toFixed(2)}%</span>
        </div>
        <div className="w-full bg-zinc-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${totalGames > 0 ? winRate : 0}%` }}
          ></div>
        </div>
      </div>
    );
  };

  const TopPlayerCard = ({ player, rank }: { player: LeaderboardPlayer; rank: number }) => {
    const tierInfo = getTierInfo(player.rating, selectedFormat);
    
    return (
      <Link to={`/profile/${player.id}`} className={`relative bg-gradient-to-br ${rank === 1
          ? 'from-orange-900/50 to-orange-800/30 border-orange-500/50'
          : 'from-zinc-800/50 to-zinc-700/30 border-zinc-600/50'
        } rounded-xl border-2 hover:border-blue-400 transition-colors duration-200 p-6 ${rank === 1 ? 'transform scale-105' : ''}`}>
        <div className="text-center">
          <div className="relative inline-block mb-4">
            <PlayerAvatar
              id={player.id}
              avatar={player.avatar || null}
              displayname={player.displayname}
              username={player.username}
              size="lg"
              bordered={true}
              className={rank === 1 ? 'ring-4 ring-orange-500/50' : 'ring-2 ring-zinc-500/50'}
            />
            <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${rank === 1
                ? 'bg-orange-500 text-orange-900'
                : rank <= 3
                  ? 'bg-orange-500 text-orange-900'
                  : 'bg-blue-500 text-blue-900'
              }`}>
              #{rank}
            </div>
          </div>

          <h3 className="text-lg font-bold text-zinc-100 mb-1">{player.displayname}</h3>
          <p className="text-sm text-zinc-400 mb-3">@{player.username}</p>

          <div className="flex items-center justify-center mb-4">
            <img
              src={tierInfo.image}
              alt={t('leaderboard_page.tier_alt', { tier: tierInfo.name })}
              className="w-8 h-8 mr-2"
            />
            <span className="text-zinc-300 font-medium">{tierInfo.name}</span>
          </div>

          <div className="bg-zinc-800/50 rounded-lg p-4 mb-4">
            <div className="text-2xl font-bold text-blue-400 mb-1">{Math.floor(player.rating)}</div>
            <div className="text-xs text-zinc-400">{t('leaderboard_page.rating')}</div>
          </div>

          <WinRateBar player={player} />
        </div>
      </Link>
    );
  };

  const PlayerRow = ({ player, rank }: { player: LeaderboardPlayer; rank: number }) => {
    const tierInfo = getTierInfo(player.rating, selectedFormat);
    
    return (
      <Link to={`/profile/${player.id}`} className="bg-zinc-800 block rounded-lg border border-zinc-700 p-4 hover:border-blue-400 transition-colors duration-200">
        <div className="grid grid-cols-[3rem_1fr_1.5rem_4rem] xl:grid-cols-[3rem_1fr_1.5rem_4rem_10rem] gap-4">
          <div className="w-12 text-center">
            <span className="text-lg font-bold text-zinc-300">#{rank}</span>
          </div>

          <div className="flex items-center gap-4">
            <PlayerAvatar
              id={player.id}
              avatar={player.avatar || null}
              displayname={player.displayname}
              username={player.username}
              size="md"
              bordered={true}
            />

            <div className="flex flex-col gap-2 mb-1">
              <h4 title={player.displayname} className="text-sm font-semibold text-zinc-100 truncate">
                {player.displayname.length > 15 ? `${player.displayname.slice(0, 12)}...` : player.displayname}
              </h4>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <img
              src={tierInfo.image}
              alt={t('leaderboard_page.tier_alt', { tier: tierInfo.name })}
              className="w-6 h-6"
            />
          </div>

          <div className="w-20 text-center">
            <div className="text-sm font-bold text-blue-400">{Math.floor(player.rating)}</div>
            <div className="text-xs text-zinc-400">{t('leaderboard_page.rating')}</div>
          </div>

          <div className="w-full col-span-4 xl:col-span-1">
            <WinRateBar player={player} />
          </div>
        </div>
      </Link>
    );
  };

  const SkeletonCard = () => (
    <div className="bg-zinc-800 rounded-xl border border-zinc-700 p-6 animate-pulse">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-zinc-700 rounded-full mx-auto"></div>
        <div className="h-4 bg-zinc-700 rounded w-3/4 mx-auto"></div>
        <div className="h-3 bg-zinc-700 rounded w-1/2 mx-auto"></div>
        <div className="h-8 bg-zinc-700 rounded w-16 mx-auto"></div>
        <div className="h-6 bg-zinc-700 rounded w-full"></div>
        <div className="h-2 bg-zinc-700 rounded w-full"></div>
      </div>
    </div>
  );

  const SkeletonRow = () => (
    <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-4 animate-pulse">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-6 bg-zinc-700 rounded"></div>
        <div className="w-10 h-10 bg-zinc-700 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-zinc-700 rounded w-1/3"></div>
        </div>
        <div className="w-6 h-6 bg-zinc-700 rounded"></div>
        <div className="w-20 h-6 bg-zinc-700 rounded"></div>
        <div className="w-32 h-6 bg-zinc-700 rounded"></div>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">⚠️ {t('leaderboard_page.error_title')}</div>
          <p className="text-zinc-300">{error}</p>
        </div>
      </div>
    );
  }

  const currentPlayers = leaderboardData?.data[selectedFormat] || [];

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 mt-8">
      <div className="container mx-auto px-4 py-8">
        {/* Format Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-zinc-800 rounded-lg p-1 border border-zinc-700">
            <button
              onClick={() => setSelectedFormat('TCG')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${selectedFormat === 'TCG'
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
                }`}
            >
              {t('leaderboard_page.tcg_format')}
            </button>
            <button
              onClick={() => setSelectedFormat('OCG')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${selectedFormat === 'OCG'
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
                }`}
            >
              {t('leaderboard_page.ocg_format')}
            </button>
          </div>
        </div>

        {loading ? (
          <>
            {/* Top 5 Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
              {Array.from({ length: 5 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>

            {/* Rest Skeleton */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {Array.from({ length: 10 }).map((_, index) => (
                <SkeletonRow key={index} />
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Top 5 Players */}
            {currentPlayers.length > 0 && (
              <div className="mb-12">
                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6">
                  {currentPlayers.slice(0, 5).map((player, index) => (
                    <TopPlayerCard key={player.id} player={player} rank={index + 1} />
                  ))}
                </div>
              </div>
            )}

            {/* Rest of Leaderboard */}
            {currentPlayers.length > 5 && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {currentPlayers.slice(5).map((player, index) => (
                  <PlayerRow key={player.id} player={player} rank={index + 6} />
                ))}
              </div>
            )}

            {/* Empty State */}
            {currentPlayers.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="text-zinc-400 text-lg mb-2">{t('leaderboard_page.empty_title')}</div>
                <p className="text-zinc-500">{t('leaderboard_page.empty_subtitle')}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;