import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { api } from '@/utils/Api';
import { unwrapApiPayload } from '@/utils/unwrapApiPayload';
import TopPlayersPieChart from './TopPlayersPieChart';
import TopPlayersTable from './TopPlayersTable';
import type { TopPlayersData } from './types';

interface TopPlayersWrapperProps {
  region: number;
  limit?: number;
  initialData?: TopPlayersData | null;
}

type ViewMode = 'table' | 'chart';

const TopPlayersWrapper: React.FC<TopPlayersWrapperProps> = ({ region, limit = 64, initialData }) => {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>('chart');
  const [data, setData] = useState<TopPlayersData | null>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If we have initialData for the current region, use it
    if (initialData && initialData.region === region) {
      setData(initialData);
      setLoading(false);
      return;
    }
    // Otherwise fetch
    fetchTopPlayers();
  }, [region, limit, initialData]);

  const fetchTopPlayers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.statistics.getTopPlayers(region, limit);
      
      if (response.ok && response.data) {
        const payload = unwrapApiPayload<TopPlayersData>(response.data);
        if (payload) setData(payload);
      } else {
        const errorMsg = response.message || t('error');
        console.error('Top Players API Error:', errorMsg, response);
        setError(errorMsg);
      }
    } catch (err) {
      console.error('Error fetching top players:', err);
      setError(t('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* View Mode Toggle */}
      <div className="flex items-center justify-end gap-2 mb-4">
        <button
          onClick={() => setViewMode('table')}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium
            ${viewMode === 'table' 
              ? 'bg-white text-black' 
              : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700 hover:text-white'
            }
          `}
        >
          <Icon icon="mdi:table" className="text-lg" />
          <span className="hidden sm:inline">{t('statistics.view_table')}</span>
        </button>
        <button
          onClick={() => setViewMode('chart')}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium
            ${viewMode === 'chart' 
              ? 'bg-white text-black' 
              : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700 hover:text-white'
            }
          `}
        >
          <Icon icon="mdi:chart-pie" className="text-lg" />
          <span className="hidden sm:inline">{t('statistics.view_chart')}</span>
        </button>
      </div>

      {/* Content */}
      {viewMode === 'table' ? (
        <TopPlayersTable
          data={data}
          loading={loading}
          error={error}
          onRefresh={fetchTopPlayers}
        />
      ) : (
        <TopPlayersPieChart
          data={data}
          loading={loading}
          error={error}
          region={region}
          limit={limit}
          onRefresh={fetchTopPlayers}
        />
      )}
    </div>
  );
};

export default TopPlayersWrapper;
