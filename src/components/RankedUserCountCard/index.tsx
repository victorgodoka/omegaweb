import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from '@iconify/react';

export interface RankData {
  rank: string;
  count: number;
  percentage: number;
}

export interface RegionData {
  region: string;
  totalPlayers: number;
  ranks: RankData[];
}

interface RankedUserCountCardProps {
  data: RegionData[];
}

const getRankColor = (rank: string): string => {
  const colors: { [key: string]: string } = {
    "Omega": "bg-gradient-to-t from-orange-700 to-orange-400",
    "Master": "bg-gradient-to-t from-purple-800 to-purple-400",
    "Diamond": "bg-gradient-to-t from-cyan-700 to-cyan-200",
    "Platinum": "bg-gradient-to-t from-blue-900 to-blue-300",
    "Gold": "bg-gradient-to-t from-yellow-600 to-yellow-300",
    "Silver": "bg-gradient-to-t from-zinc-400 to-zinc-100",
    "Bronze": "bg-gradient-to-t from-yellow-900 to-yellow-500",
    "Unranked": "bg-gradient-to-t from-zinc-700 to-zinc-400",
  };
  return colors[rank] || "bg-gradient-to-t from-zinc-700 to-zinc-400";
};

// Ordem dos ranks de Bronze para Omega
const rankOrder = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master", "Omega"];

const RankedUserCountCard = ({ data }: RankedUserCountCardProps) => {
  const [selectedRegion, setSelectedRegion] = useState<'TCG' | 'Genesys'>('TCG');
  const { t } = useTranslation();

  if (!data || data.length === 0) {
    return <div className="w-full py-10 text-center text-zinc-400">{t("loading")}</div>;
  }

  const regionData = data.find(d => d.region === selectedRegion);
  if (!regionData) return null;

  // Filtrar Unranked e ordenar de Bronze para Omega
  const ranksToShow = regionData.ranks
    .filter(r => r.rank !== 'Unranked')
    .sort((a, b) => rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank));

  // Usar escala logarítmica para melhor visualização
  const logCounts = ranksToShow.map(r => Math.log10(Math.max(1, r.count)));
  const maxLog = Math.max(...logCounts);
  const barMaxHeight = 128;

  return (
    <div className="w-full bg-zinc-800 rounded-2xl shadow-xl p-6 flex flex-col gap-6 overflow-auto">
      {/* Header com seletor de região */}
      <div className="flex items-center justify-between">
        <span className="uppercase text-xs text-zinc-400 tracking-widest">{t("user_count_by_rank")}</span>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedRegion('TCG')}
            className={`px-3 py-1 text-xs rounded transition-all ${
              selectedRegion === 'TCG'
                ? 'bg-orange-500 text-white'
                : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
            }`}
          >
            <Icon icon="mdi:earth" className="inline w-3 h-3 mr-1" />
            {t('statistics2.tcg')}
          </button>
          <button
            onClick={() => setSelectedRegion('Genesys')}
            className={`px-3 py-1 text-xs rounded transition-all ${
              selectedRegion === 'Genesys'
                ? 'bg-purple-500 text-white'
                : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
            }`}
          >
            <Icon icon="mdi:star" className="inline w-3 h-3 mr-1" />
            {t('statistics2.genesys')}
          </button>
        </div>
      </div>

      {/* Total de jogadores */}
      <div className="text-center">
        <div className="text-2xl font-bold text-orange-400">{regionData.totalPlayers.toLocaleString()}</div>
        <div className="text-xs text-zinc-400">{t('ranked_users')}</div>
      </div>

      {/* Gráfico de barras */}
      <div className="w-full flex items-end gap-3 h-32">
        {ranksToShow.map((rankData, idx) => {
          const logVal = logCounts[idx];
          const heightPx = maxLog > 0 ? Math.max((logVal / maxLog) * barMaxHeight, 8) : 8;
          const rankKey = rankData.rank.toLowerCase();
          return (
            <div key={rankData.rank} className="flex-1 flex flex-col items-center group">
              <div
                className={`w-full rounded ${getRankColor(rankData.rank)} flex items-end justify-center transition-all duration-300 hover:opacity-80 cursor-pointer`}
                style={{ height: `${heightPx}px` }}
              >
                <span className="text-xs font-bold text-zinc-900 drop-shadow-sm select-none">
                  {rankData.count.toLocaleString()}
                </span>
              </div>
              <div className="mt-1 text-center">
                <div className="text-xs text-zinc-400 select-none">{t(`ranks.${rankKey}`)}</div>
                <div className="text-[10px] text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  {rankData.percentage.toFixed(2)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RankedUserCountCard;
