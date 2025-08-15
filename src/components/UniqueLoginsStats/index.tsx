import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import RankedUserCountCard from "@/components/RankedUserCountCard";
import { LineChart } from '@mui/x-charts/LineChart';
import { useLoadingContext } from "@/contexts/LoadingContext";
import { api } from "@/utils/Api";

export interface UniqueLoginsData {
  logins: Login[];
  total: number;
}

export interface Login {
  LogDate: string;
  LogCount: number;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const UniqueLoginsStats = () => {
  const [logins, setLogins] = useState<Login[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [percentChange, setPercentChange] = useState<number | null>(null);
  const [trendUp, setTrendUp] = useState<boolean | null>(null);

  const { dispatch } = useLoadingContext();
  const { t } = useTranslation();

  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: true });
    api.main.get<UniqueLoginsData>('lastlogins')
      .then((res) => {
        if (res.ok && res.data) {
          const data = res.data as UniqueLoginsData;
          setLogins(data.logins);
          setTotal(data.total);
          // Calculate % change
          const last7 = data.logins.slice(-7);
          const prev7 = data.logins.slice(-14, -7);
          const sum = (arr: Login[]) => arr.reduce((a, b) => a + b.LogCount, 0);
          if (last7.length === 7 && prev7.length === 7) {
            const lastSum = sum(last7);
            const prevSum = sum(prev7);
            if (prevSum > 0) {
              const change = ((lastSum - prevSum) / prevSum) * 100;
              setPercentChange(change);
              setTrendUp(change >= 0);
            }
          }
        } else {
          setError("Could not load login statistics.");
        }
      })
      .catch(() => {
        setError("Could not load login statistics.");
      })
      .finally(() => {
        dispatch({ type: 'SET_LOADING', payload: false });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) return <div className="w-full py-10 text-center text-red-500">{error}</div>;

  const last7 = logins.slice(-7);
  const last30 = logins.slice(-30);
  const last7Total = last7.reduce((a, b) => a + b.LogCount, 0);
  const last30Total = last30.reduce((a, b) => a + b.LogCount, 0);

  return (
    <section className="w-full mx-auto max-w-7xl flex flex-col items-center">
      <div className="w-full bg-zinc-800 rounded-2xl shadow-xl p-6 flex flex-col md:flex-row gap-6">
        <div className="flex flex-col sm:justify-between gap-6 mb-6">
          {/* 7 Days Stat */}
          <div className="flex-1 flex flex-col justify-center items-center bg-zinc-900 p-4 rounded-xl">
            <span className="uppercase text-xs text-zinc-400 tracking-widest">{t('unique_logins_7_days')}</span>
            <div className="flex items-center justify-center gap-2">
              <span className="text-4xl sm:text-5xl font-bold text-orange-500">{last7Total.toLocaleString()}</span>
              {percentChange !== null && (
                <span className={`text-[0.65rem] px-2 py-1 rounded-full font-semibold ${trendUp ? "bg-green-400 text-green-900" : "bg-red-400 text-red-900"}`}>
                  {trendUp ? "+" : ""}{percentChange.toFixed(1)}%
                </span>
              )}
            </div>
            <span className="text-xs text-zinc-400 mt-1">{t('compared_prev_7_days')}</span>
          </div>

          {/* 30 Days Stat */}
          <div className="flex-1 flex flex-col justify-center items-center bg-zinc-900 p-4 rounded-xl">
            <span className="uppercase text-xs text-zinc-400 tracking-widest">{t('unique_logins_30_days')}</span>
            <span className="text-2xl sm:text-3xl font-bold text-orange-400">{last30Total.toLocaleString()}</span>
          </div>
        </div>
        {/* Line Chart for Last 7 Days */}
        <div className="w-full mx-auto">
          <LineChart
            xAxis={[{ data: last7.map(l => formatDate(l.LogDate)), scaleType: 'point', label: t('date') }]}
            series={[{
              data: last7.map(l => l.LogCount),
              color: '#fb923c',
              label: t('unique_logins'),
              showMark: true,
              area: true,
              curve: 'monotoneX',
            }]}
            height={480}
            sx={{
              backgroundColor: '#18181b', // zinc-800
              borderRadius: 12,
              '.MuiChartsAxis-root .MuiChartsAxis-tickLabel': { fill: '#a1a1aa', fontSize: 10 }, // zinc-400
              '.MuiChartsAxis-root .MuiChartsAxis-label': { fill: '#a1a1aa' },
              '.MuiLineElement-root': { strokeWidth: 3 },
              '.MuiMarkElement-root': { stroke: '#fb923c', fill: '#fb923c' },
              '.MuiAreaElement-root': { fill: 'rgba(251,146,60,0.2)' },
            }}
            grid={{ horizontal: true }}
            margin={{ top: 16, right: 16, left: 16, bottom: 24 }}
          />
        </div>
      </div>
      {/* User count by rank card */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 w-full my-6">
        <div className="col-span-4 md:col-span-3 w-full">
          <RankedUserCountCard />
        </div>
        <div className="col-span-4 md:col-span-1 flex flex-col items-center gap-6 w-full">
          {/* Logins Yesterday */}
          <div className="flex-1 w-full flex flex-col justify-center items-center bg-zinc-800 p-4 rounded-xl">
            <span className="uppercase text-xs text-zinc-400 tracking-widest">{t('logins_yesterday')}</span>
            <div className="flex items-end gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-orange-300">
                {logins.length > 0 ? logins[logins.length - 1]?.LogCount?.toLocaleString() ?? '-' : '-'}
              </span>
              {/* % change from day before */}
              {logins.length > 2 && typeof logins[logins.length - 1]?.LogCount === 'number' && typeof logins[logins.length - 2]?.LogCount === 'number' ? (() => {
                const yest = logins[logins.length - 1].LogCount;
                const prev = logins[logins.length - 2].LogCount;
                const change = prev > 0 ? ((yest - prev) / prev) * 100 : 0;
                const up = change >= 0;
                return (
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${up ? "bg-green-400 text-green-900" : "bg-red-400 text-red-900"}`}>
                    {up ? "+" : ""}{change.toFixed(1)}%
                  </span>
                );
              })() : null}
            </div>
            <span className="text-xs text-zinc-400 mt-1">
              {logins.length > 0 ? formatDate(logins[logins.length - 1]?.LogDate) : ''}
            </span>
          </div>
          {/* Total Logins */}
          <div className="flex-1 w-full flex flex-col justify-center items-center bg-zinc-800 p-4 rounded-xl">
            <span className="uppercase text-xs text-zinc-400 tracking-widest">{t('total_logins')}</span>
            <div className="flex items-end gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-orange-300">
                {total.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UniqueLoginsStats;
