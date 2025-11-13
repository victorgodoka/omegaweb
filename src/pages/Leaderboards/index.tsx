import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Icon } from '@iconify/react';
import { api } from '@/utils/Api';

interface LeaderboardPlayer {
  id: string;
  username: string;
  avatar: string | null;
  displayname: string;
  wins: number;
  loses: number;
  draws: number;
  rating: number;
  winstreak: number;
  losestreak: number;
  games: number;
  ot: string;
}

interface LeaderboardData {
  TCG: LeaderboardPlayer[];
  OCG: LeaderboardPlayer[];
}

const getRankBadge = (position: number) => {
  const badges = {
    1: { icon: 'mdi:trophy', color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/50' },
    2: { icon: 'mdi:medal', color: 'text-gray-300', bg: 'bg-gray-400/20', border: 'border-gray-400/50' },
    3: { icon: 'mdi:medal', color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/50' },
    4: { icon: 'mdi:star', color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/50' },
    5: { icon: 'mdi:star', color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/50' },
  };
  return badges[position as keyof typeof badges] || { icon: 'mdi:account', color: 'text-zinc-400', bg: 'bg-zinc-700/20', border: 'border-zinc-700/50' };
};

const getAvatarUrl = (avatar: string | null, id: string) => {
  if (!avatar) return `https://cdn.discordapp.com/embed/avatars/${parseInt(id) % 5}.png`;
  const extension = avatar.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/avatars/${id}/${avatar}.${extension}`;
};

const Leaderboards2 = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<'TCG' | 'OCG'>('TCG');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await api.main.getLeaderboard();
        
        // A API retorna os dados diretamente em response.data (não em response.data.data)
        if (response.ok && response.data) {
          setData(response.data as unknown as LeaderboardData);
        } else {
          setError(t('error'));
        }
      } catch (err) {
        console.error('Leaderboard Error:', err);
        setError(t('error'));
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [t]);

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center px-4 mt-12 pb-12">
        <div className="w-full max-w-6xl">
          <div className="h-32 bg-zinc-800 rounded-lg animate-pulse mb-6"></div>
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-24 bg-zinc-800 rounded-lg animate-pulse mb-3"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full flex flex-col items-center px-4 mt-12 pb-12">
        <div className="w-full max-w-6xl text-center">
          <Icon icon="mdi:alert-circle" className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 text-xl">{error || t('error')}</p>
        </div>
      </div>
    );
  }

  const currentData = selectedRegion === 'TCG' ? data.TCG : data.OCG;
  const top1 = currentData[0];
  const top2to5 = currentData.slice(1, 5);
  const rest = currentData.slice(5);

  return (
    <div className="w-full flex flex-col items-center px-4 mt-12 pb-12 space-y-8">
      {/* Header */}
      <div className="w-full max-w-6xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Icon icon="mdi:podium-gold" className="w-10 h-10 text-yellow-400" />
              {t('leaderboards2.title')}
            </h1>
            <p className="text-zinc-400">{t('leaderboards2.subtitle')}</p>
          </div>

          {/* Region Selector */}
          <div className="flex gap-3">
            <button
              onClick={() => setSelectedRegion('TCG')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                selectedRegion === 'TCG'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/50'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              <Icon icon="mdi:earth" className="w-5 h-5" />
              {t('statistics2.tcg')}
            </button>
            <button
              onClick={() => setSelectedRegion('OCG')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                selectedRegion === 'OCG'
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/50'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              <Icon icon="mdi:star" className="w-5 h-5" />
              {t('leaderboards2.genesys')}
            </button>
          </div>
        </div>

        {/* Top 5 - Destaque */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Icon icon="mdi:star-circle" className="w-6 h-6 text-yellow-400" />
            {t('leaderboards2.top_5')}
          </h2>
          
          {/* Top 1 - Linha única */}
          {top1 && (() => {
            const badge = getRankBadge(1);
            const winRate = top1.games > 0 ? (top1.wins / top1.games) * 100 : 0;
            
            return (
              <div className="mb-4">
                <div
                  className={`relative bg-gradient-to-br from-zinc-800 to-zinc-900 border-2 ${badge.border} rounded-xl p-6 hover:scale-[1.01] transition-all duration-300 shadow-xl`}
                >
                  {/* Position Badge */}
                  <div className={`absolute -top-3 -left-3 w-12 h-12 ${badge.bg} border-2 ${badge.border} rounded-full flex items-center justify-center`}>
                    <span className={`text-xl font-black ${badge.color}`}>#1</span>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <img
                      src={getAvatarUrl(top1.avatar, top1.id)}
                      alt={top1.displayname || top1.username}
                      className="w-20 h-20 rounded-full border-4 border-zinc-700"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://cdn.discordapp.com/embed/avatars/0.png`;
                      }}
                    />

                    {/* Player Info */}
                    <div className="flex-1 min-w-0">
                      <Link to={`/profile/${top1.id}`} className="block hover:opacity-80 transition-opacity">
                        <h3 className="text-xl font-bold text-white truncate hover:text-orange-400 transition-colors">
                          {top1.displayname || top1.username}
                        </h3>
                        <p className="text-sm text-zinc-400">@{top1.username}</p>
                      </Link>
                      
                      {/* Rating */}
                      <div className="flex items-center gap-2 mt-2">
                        <Icon icon="mdi:chart-line" className="w-5 h-5 text-orange-400" />
                        <span className="text-2xl font-bold text-orange-400">
                          {Math.round(top1.rating)}
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="hidden md:flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-zinc-400">{t('leaderboards2.win_rate')}:</span>
                        <span className={`text-lg font-bold ${winRate >= 60 ? 'text-green-400' : winRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {winRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex gap-3 text-sm">
                        <span className="text-green-400">{top1.wins}W</span>
                        <span className="text-red-400">{top1.loses}L</span>
                        <span className="text-zinc-400">{top1.games}G</span>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Stats */}
                  <div className="md:hidden mt-4 pt-4 border-t border-zinc-700 flex justify-between">
                    <div>
                      <span className="text-xs text-zinc-400">{t('leaderboards2.win_rate')}</span>
                      <div className={`text-lg font-bold ${winRate >= 60 ? 'text-green-400' : winRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {winRate.toFixed(1)}%
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="text-center">
                        <div className="text-xs text-zinc-400">{t('wins')}</div>
                        <div className="text-green-400 font-bold">{top1.wins}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-zinc-400">{t('losses')}</div>
                        <div className="text-red-400 font-bold">{top1.loses}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-zinc-400">{t('leaderboards2.games')}</div>
                        <div className="text-zinc-300 font-bold">{top1.games}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
          
          {/* Top 2-5 - Grid 2 colunas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {top2to5.map((player, index) => {
              const position = index + 2;
              const badge = getRankBadge(position);
              const winRate = player.games > 0 ? (player.wins / player.games) * 100 : 0;

              return (
                <div
                  key={player.id}
                  className={`relative bg-gradient-to-br from-zinc-800 to-zinc-900 border-2 ${badge.border} rounded-xl p-6 hover:scale-[1.02] transition-all duration-300 shadow-xl`}
                >
                  {/* Position Badge */}
                  <div className={`absolute -top-3 -left-3 w-12 h-12 ${badge.bg} border-2 ${badge.border} rounded-full flex items-center justify-center`}>
                    <span className={`text-xl font-black ${badge.color}`}>#{position}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <img
                      src={getAvatarUrl(player.avatar, player.id)}
                      alt={player.displayname || player.username}
                      className="w-20 h-20 rounded-full border-4 border-zinc-700"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://cdn.discordapp.com/embed/avatars/0.png`;
                      }}
                    />

                    {/* Player Info */}
                    <div className="flex-1 min-w-0">
                      <Link to={`/profile/${player.id}`} className="block hover:opacity-80 transition-opacity">
                        <h3 className="text-xl font-bold text-white truncate hover:text-orange-400 transition-colors">
                          {player.displayname || player.username}
                        </h3>
                        <p className="text-sm text-zinc-400">@{player.username}</p>
                      </Link>
                      
                      {/* Rating */}
                      <div className="flex items-center gap-2 mt-2">
                        <Icon icon="mdi:chart-line" className="w-5 h-5 text-orange-400" />
                        <span className="text-2xl font-bold text-orange-400">
                          {Math.round(player.rating)}
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="hidden md:flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-zinc-400">{t('leaderboards2.win_rate')}:</span>
                        <span className={`text-lg font-bold ${winRate >= 60 ? 'text-green-400' : winRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {winRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex gap-3 text-sm">
                        <span className="text-green-400">{player.wins}W</span>
                        <span className="text-red-400">{player.loses}L</span>
                        <span className="text-zinc-400">{player.games}G</span>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Stats */}
                  <div className="md:hidden mt-4 pt-4 border-t border-zinc-700 flex justify-between">
                    <div>
                      <span className="text-xs text-zinc-400">{t('leaderboards2.win_rate')}</span>
                      <div className={`text-lg font-bold ${winRate >= 60 ? 'text-green-400' : winRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {winRate.toFixed(1)}%
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="text-center">
                        <div className="text-xs text-zinc-400">{t('wins')}</div>
                        <div className="text-green-400 font-bold">{player.wins}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-zinc-400">{t('losses')}</div>
                        <div className="text-red-400 font-bold">{player.loses}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-zinc-400">{t('leaderboards2.games')}</div>
                        <div className="text-zinc-300 font-bold">{player.games}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rest of Players */}
        {rest.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-zinc-300 mb-4">{t('leaderboards2.all_players')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {rest.map((player, index) => {
                const position = index + 6;
                const winRate = player.games > 0 ? (player.wins / player.games) * 100 : 0;

                return (
                  <div
                    key={player.id}
                    className="relative bg-zinc-800/70 border border-zinc-700 rounded-lg p-4 hover:border-orange-500/50 transition-all duration-200 group"
                  >
                    {/* Position Badge */}
                    <div className="absolute -top-2 -left-2 w-8 h-8 bg-zinc-700 border-2 border-zinc-600 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-zinc-300">#{position}</span>
                    </div>

                    <div className="flex items-center gap-4">

                      {/* Avatar */}
                      <img
                        src={getAvatarUrl(player.avatar, player.id)}
                        alt={player.displayname || player.username}
                        className="w-12 h-12 rounded-full border-2 border-zinc-700"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://cdn.discordapp.com/embed/avatars/0.png`;
                        }}
                      />

                      {/* Player Info */}
                      <div className="flex-1 min-w-0">
                        <Link to={`/profile/${player.id}`} className="block hover:opacity-80 transition-opacity">
                          <h3 className="font-semibold text-white truncate group-hover:text-orange-400 transition-colors">
                            {player.displayname || player.username}
                          </h3>
                          <p className="text-sm text-zinc-400">@{player.username}</p>
                        </Link>
                      </div>

                      {/* Stats - Desktop */}
                      <div className="hidden md:flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-xs text-zinc-400">{t('leaderboards2.rating')}</div>
                          <div className="text-lg font-bold text-orange-400">{Math.round(player.rating)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-zinc-400">{t('leaderboards2.win_rate')}</div>
                          <div className={`text-lg font-bold ${winRate >= 60 ? 'text-green-400' : winRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {winRate.toFixed(1)}%
                          </div>
                        </div>
                        <div className="flex gap-3 text-sm">
                          <span className="text-green-400">{player.wins}W</span>
                          <span className="text-red-400">{player.loses}L</span>
                          <span className="text-zinc-400">{player.games}G</span>
                        </div>
                      </div>

                      {/* Stats - Mobile */}
                      <div className="md:hidden flex flex-col items-end gap-1">
                        <div className="text-orange-400 font-bold">{Math.round(player.rating)}</div>
                        <div className={`text-sm font-bold ${winRate >= 60 ? 'text-green-400' : winRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {winRate.toFixed(1)}%
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
    </div>
  );
};

export default Leaderboards2;
