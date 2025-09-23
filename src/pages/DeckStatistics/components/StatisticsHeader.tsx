import React from 'react';
import { useTranslation } from 'react-i18next';
import type { DeckStatistics } from '../types';

interface StatisticsHeaderProps {
  statistics: DeckStatistics;
  onRefresh: () => void;
  loading: boolean;
  lastRefresh: Date;
}

const StatisticsHeader: React.FC<StatisticsHeaderProps> = ({
  statistics,
  onRefresh,
  loading,
  lastRefresh,
}) => {
  const { t } = useTranslation();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatLastRefresh = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-zinc-800 rounded-lg p-6 mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Statistics Info */}
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="text-center sm:text-left">
            <div className="text-2xl font-bold text-blue-400">
              {statistics.totalMatches.toLocaleString()}
            </div>
            <div className="text-zinc-400 text-sm">
              {t('deck_statistics.total_matches')}
            </div>
          </div>
          
          <div className="text-center sm:text-left">
            <div className="text-2xl font-bold text-green-400">
              {statistics.deckStats.length}
            </div>
            <div className="text-zinc-400 text-sm">
              {t('deck_statistics.active_archetypes')}
            </div>
          </div>

          <div className="text-center sm:text-left">
            <div className="text-lg font-semibold text-orange-400">
              {formatDate(statistics.statisticsDate.date)} - {formatDate(statistics.lastUpdated)}
            </div>
            <div className="text-zinc-400 text-sm">
              {statistics.statisticsDate.isBanlist 
                ? t('deck_statistics.banlist_period')
                : t('deck_statistics.data_period')
              }
            </div>
          </div>
        </div>

        {/* Refresh Section */}
        <div className="flex flex-col items-center lg:items-end gap-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('deck_statistics.refreshing')}
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {t('deck_statistics.force_refresh')}
              </>
            )}
          </button>
          
          <div className="text-xs text-zinc-500">
            {t('deck_statistics.last_updated')}: {formatDate(statistics.lastUpdated)}
          </div>
          
          <div className="text-xs text-zinc-600">
            {t('deck_statistics.last_refresh')}: {formatLastRefresh(lastRefresh)}
          </div>
        </div>
      </div>

      {/* Reason/Description */}
      {statistics.statisticsDate.reason && (
        <div className="mt-4 p-3 bg-zinc-700 rounded-lg">
          <div className="text-sm text-zinc-300">
            <span className="font-semibold">{t('deck_statistics.period_info')}: </span>
            {statistics.statisticsDate.reason}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatisticsHeader;
