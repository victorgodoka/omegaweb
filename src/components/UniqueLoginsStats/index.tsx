import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from '@iconify/react';
import RankedUserCountCard, { type RegionData } from "@/components/RankedUserCountCard";
import { LineChart } from '@mui/x-charts/LineChart';
import { api } from '@/utils/Api';

export interface UniqueLoginsData {
  logins: Login[];
  total: number;
}

export interface Login {
  LogDate: string;
  LogCount: number;
}

interface UniqueLoginsStatsProps {
  logins: Login[];
  total: number;
  initialRankData?: RegionData[] | null;
}

const UniqueLoginsStats = ({ logins, initialRankData }: UniqueLoginsStatsProps) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language || 'en-US';

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString(locale, { month: "short", day: "numeric" });
  }
  const [loginsPeriod, setLoginsPeriod] = useState<7 | 15 | 30>(7);
  const [rankData, setRankData] = useState<RegionData[]>(initialRankData ?? []);

  // Fetch rank distribution only if not provided via props
  useEffect(() => {
    if (initialRankData && initialRankData.length > 0) {
      setRankData(initialRankData);
      return;
    }
    
    let mounted = true;
    api.main.getRankDistribution()
      .then((res) => {
        if (!mounted) return;
        if (res.ok && res.data) {
          const data = Array.isArray(res.data) ? res.data : res.data.data;
          if (data && Array.isArray(data)) {
            setRankData(data);
          }
        }
      })
      .catch((err) => console.error('Rank Distribution Error:', err));
    return () => { mounted = false; };
  }, [initialRankData]);

  const loginStats = useMemo(() => {
    if (logins.length === 0) return null;

    const sortedLogins = [...logins].sort((a, b) => 
      new Date(b.LogDate).getTime() - new Date(a.LogDate).getTime()
    );

    const yesterday = sortedLogins[0]?.LogCount || 0;
    const dayBefore = sortedLogins[1]?.LogCount || 0;
    const yesterdayChange = dayBefore > 0 ? ((yesterday - dayBefore) / dayBefore) * 100 : 0;

    const last7Days = sortedLogins.slice(0, 7);
    const prev7Days = sortedLogins.slice(7, 14);
    const avg7Days = last7Days.reduce((sum, d) => sum + d.LogCount, 0) / last7Days.length;
    const avgPrev7Days = prev7Days.reduce((sum, d) => sum + d.LogCount, 0) / prev7Days.length;
    const week7Change = avgPrev7Days > 0 ? ((avg7Days - avgPrev7Days) / avgPrev7Days) * 100 : 0;

    const last30Days = sortedLogins.slice(0, 30);
    const prev30Days = sortedLogins.slice(30, 60);
    const avg30Days = last30Days.reduce((sum, d) => sum + d.LogCount, 0) / last30Days.length;
    const avgPrev30Days = prev30Days.reduce((sum, d) => sum + d.LogCount, 0) / prev30Days.length;
    const month30Change = avgPrev30Days > 0 ? ((avg30Days - avgPrev30Days) / avgPrev30Days) * 100 : 0;

    // Calcular dia da semana com mais logins
    const dayOfWeekCounts: { [key: string]: { total: number; count: number } } = {};
    sortedLogins.forEach(login => {
      const date = new Date(login.LogDate);
      const dayName = date.toLocaleDateString(locale, { weekday: 'long' });
      if (!dayOfWeekCounts[dayName]) {
        dayOfWeekCounts[dayName] = { total: 0, count: 0 };
      }
      dayOfWeekCounts[dayName].total += login.LogCount;
      dayOfWeekCounts[dayName].count += 1;
    });

    let maxDay = '';
    let maxAvg = 0;
    Object.entries(dayOfWeekCounts).forEach(([day, data]) => {
      const avg = data.total / data.count;
      if (avg > maxAvg) {
        maxAvg = avg;
        maxDay = day;
      }
    });

    return {
      yesterday,
      yesterdayChange,
      avg7Days,
      week7Change,
      avg30Days,
      month30Change,
      maxDay,
      maxAvg
    };
  }, [logins, locale]);

  if (!loginStats) return null;

  const sortedLogins = [...logins].sort((a, b) => 
    new Date(b.LogDate).getTime() - new Date(a.LogDate).getTime()
  );
  const chartData = sortedLogins.slice(0, loginsPeriod).reverse();

  return (
    <section className="w-full mx-auto flex flex-col items-center">
      {/* Header com seletor de período */}
      <div className="w-full flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon icon="mdi:account-multiple" className="w-6 h-6 text-gray-400" />
          <h2 className="text-2xl font-bold text-white">{t('statistics.unique_logins')}</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setLoginsPeriod(7)} className={`px-3 py-1 text-sm rounded-lg transition-colors ${loginsPeriod === 7 ? 'bg-white text-black font-semibold' : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'}`}>{t('statistics.days_7')}</button>
          <button onClick={() => setLoginsPeriod(15)} className={`px-3 py-1 text-sm rounded-lg transition-colors ${loginsPeriod === 15 ? 'bg-white text-black font-semibold' : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'}`}>{t('statistics.days_15')}</button>
          <button onClick={() => setLoginsPeriod(30)} className={`px-3 py-1 text-sm rounded-lg transition-colors ${loginsPeriod === 30 ? 'bg-white text-black font-semibold' : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'}`}>{t('statistics.days_30')}</button>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-zinc-900/50 border border-cyan-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Icon icon="mdi:calendar-today" className="w-5 h-5 text-cyan-400" />
            <div className={`text-xs font-semibold px-2 py-0.5 rounded ${loginStats.yesterdayChange >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
              {loginStats.yesterdayChange >= 0 ? '+' : ''}{loginStats.yesterdayChange.toFixed(1)}%
            </div>
          </div>
          <div className="text-3xl font-bold text-cyan-400 mb-1">{loginStats.yesterday.toLocaleString()}</div>
          <div className="text-gray-400 text-sm">{t('statistics.yesterday')}</div>
          <div className="text-gray-500 text-xs">{t('statistics.vs_previous_day')}</div>
        </div>

        <div className="bg-zinc-900/50 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Icon icon="mdi:calendar-week" className="w-5 h-5 text-blue-400" />
            <div className={`text-xs font-semibold px-2 py-0.5 rounded ${loginStats.week7Change >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
              {loginStats.week7Change >= 0 ? '+' : ''}{loginStats.week7Change.toFixed(1)}%
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-400 mb-1">{Math.round(loginStats.avg7Days).toLocaleString()}</div>
          <div className="text-gray-400 text-sm">{t('statistics.avg_7_days')}</div>
          <div className="text-gray-500 text-xs">{t('statistics.vs_previous_week')}</div>
        </div>

        <div className="bg-zinc-900/50 border border-purple-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Icon icon="mdi:calendar-month" className="w-5 h-5 text-purple-400" />
            <div className={`text-xs font-semibold px-2 py-0.5 rounded ${loginStats.month30Change >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
              {loginStats.month30Change >= 0 ? '+' : ''}{loginStats.month30Change.toFixed(1)}%
            </div>
          </div>
          <div className="text-3xl font-bold text-purple-400 mb-1">{Math.round(loginStats.avg30Days).toLocaleString()}</div>
          <div className="text-gray-400 text-sm">{t('statistics.avg_30_days')}</div>
          <div className="text-gray-500 text-xs">{t('statistics.vs_previous_month')}</div>
        </div>

        <div className="bg-zinc-900/50 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Icon icon="mdi:star" className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-green-400 mb-1 capitalize">{loginStats.maxDay}</div>
          <div className="text-gray-400 text-sm">{t('statistics.most_logins_day')}</div>
          <div className="text-gray-500 text-xs">{t('statistics.avg_logins', { count: Math.round(loginStats.maxAvg) })}</div>
        </div>
      </div>

      {/* Gráfico de linha com MUI */}
      <div className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
        <LineChart
          xAxis={[{ data: chartData.map(l => formatDate(l.LogDate)), scaleType: 'point', label: t('date') }]}
          series={[{
            data: chartData.map(l => l.LogCount),
            color: '#6b7280',
            label: t('statistics.unique_logins'),
            showMark: true,
            area: true,
            curve: 'monotoneX',
          }]}
          height={400}
          sx={{
            backgroundColor: 'transparent',
            '.MuiChartsAxis-root .MuiChartsAxis-tickLabel': { fill: '#9ca3af', fontSize: 10 },
            '.MuiChartsAxis-root .MuiChartsAxis-label': { fill: '#9ca3af' },
            '.MuiLineElement-root': { strokeWidth: 2 },
            '.MuiMarkElement-root': { stroke: '#6b7280', fill: '#6b7280' },
            '.MuiAreaElement-root': { fill: 'rgba(107,114,128,0.1)' },
          }}
          grid={{ horizontal: true }}
          margin={{ top: 16, right: 16, left: 16, bottom: 24 }}
        />
      </div>

      {/* User count by rank card */}
      <div className="w-full mt-6">
        <RankedUserCountCard data={rankData} />
      </div>
    </section>
  );
};

export default UniqueLoginsStats;
