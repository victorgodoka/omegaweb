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
}

const UniqueLoginsStats = ({ logins }: UniqueLoginsStatsProps) => {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language || 'en-US').startsWith('pt') ? 'pt-BR' : 'en-US';

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString(locale, { month: "short", day: "numeric" });
  }
  const [loginsPeriod, setLoginsPeriod] = useState<7 | 15 | 30>(7);
  const [rankData, setRankData] = useState<RegionData[]>([]);

  // Buscar dados de rank distribution
  useEffect(() => {
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
  }, []);

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
          <Icon icon="mdi:account-multiple" className="w-6 h-6 text-cyan-400" />
          <h2 className="text-2xl font-bold text-white">{t('statistics2.unique_logins')}</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setLoginsPeriod(7)} className={`px-3 py-1 text-sm rounded ${loginsPeriod === 7 ? 'bg-cyan-500 text-white' : 'bg-zinc-700 text-zinc-300'}`}>{t('statistics2.days_7')}</button>
          <button onClick={() => setLoginsPeriod(15)} className={`px-3 py-1 text-sm rounded ${loginsPeriod === 15 ? 'bg-cyan-500 text-white' : 'bg-zinc-700 text-zinc-300'}`}>{t('statistics2.days_15')}</button>
          <button onClick={() => setLoginsPeriod(30)} className={`px-3 py-1 text-sm rounded ${loginsPeriod === 30 ? 'bg-cyan-500 text-white' : 'bg-zinc-700 text-zinc-300'}`}>{t('statistics2.days_30')}</button>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Icon icon="mdi:calendar-today" className="w-6 h-6 text-cyan-400" />
            <div className={`text-sm font-bold ${loginStats.yesterdayChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {loginStats.yesterdayChange >= 0 ? '+' : ''}{loginStats.yesterdayChange.toFixed(1)}%
            </div>
          </div>
          <div className="text-3xl font-bold text-cyan-400 mb-1">{loginStats.yesterday.toLocaleString()}</div>
          <div className="text-zinc-400 text-sm">{t('statistics2.yesterday')}</div>
          <div className="text-zinc-500 text-xs">{t('statistics2.vs_previous_day')}</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Icon icon="mdi:calendar-week" className="w-6 h-6 text-blue-400" />
            <div className={`text-sm font-bold ${loginStats.week7Change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {loginStats.week7Change >= 0 ? '+' : ''}{loginStats.week7Change.toFixed(1)}%
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-400 mb-1">{Math.round(loginStats.avg7Days).toLocaleString()}</div>
          <div className="text-zinc-400 text-sm">{t('statistics2.avg_7_days')}</div>
          <div className="text-zinc-500 text-xs">{t('statistics2.vs_previous_week')}</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Icon icon="mdi:calendar-month" className="w-6 h-6 text-purple-400" />
            <div className={`text-sm font-bold ${loginStats.month30Change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {loginStats.month30Change >= 0 ? '+' : ''}{loginStats.month30Change.toFixed(1)}%
            </div>
          </div>
          <div className="text-3xl font-bold text-purple-400 mb-1">{Math.round(loginStats.avg30Days).toLocaleString()}</div>
          <div className="text-zinc-400 text-sm">{t('statistics2.avg_30_days')}</div>
          <div className="text-zinc-500 text-xs">{t('statistics2.vs_previous_month')}</div>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Icon icon="mdi:star" className="w-6 h-6 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-green-400 mb-1 capitalize">{loginStats.maxDay}</div>
          <div className="text-zinc-400 text-sm">{t('statistics2.most_logins_day')}</div>
          <div className="text-zinc-500 text-xs">{t('statistics2.avg_logins', { count: Math.round(loginStats.maxAvg) })}</div>
        </div>
      </div>

      {/* Gráfico de linha com MUI */}
      <div className="w-full bg-zinc-800 rounded-2xl shadow-xl p-6">
        <LineChart
          xAxis={[{ data: chartData.map(l => formatDate(l.LogDate)), scaleType: 'point', label: t('date') }]}
          series={[{
            data: chartData.map(l => l.LogCount),
            color: '#06b6d4',
            label: t('statistics2.unique_logins'),
            showMark: true,
            area: true,
            curve: 'monotoneX',
          }]}
          height={400}
          sx={{
            backgroundColor: '#18181b',
            borderRadius: 12,
            '.MuiChartsAxis-root .MuiChartsAxis-tickLabel': { fill: '#a1a1aa', fontSize: 10 },
            '.MuiChartsAxis-root .MuiChartsAxis-label': { fill: '#a1a1aa' },
            '.MuiLineElement-root': { strokeWidth: 3 },
            '.MuiMarkElement-root': { stroke: '#06b6d4', fill: '#06b6d4' },
            '.MuiAreaElement-root': { fill: 'rgba(6,182,212,0.2)' },
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
