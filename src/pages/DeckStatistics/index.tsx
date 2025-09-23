import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../utils/Api';
import type { DeckStatisticsResponse, DeckStatistics } from './types';
import { StatisticsHeader, DeckCard } from './components';
import Loading from '../../ui/Loading';

const DeckStatisticsPage: React.FC = () => {
  const { t } = useTranslation();
  const [statistics, setStatistics] = useState<DeckStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const decksPerPage = 12;

  const fetchStatistics = useCallback(async (forceUpdate: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.main.getDeckAnalytics<DeckStatisticsResponse>(forceUpdate);
      
      
      if (response.status === 304 && !forceUpdate) {
        return fetchStatistics(true);
      } else if (response.ok && response.success) {
        
        if (response.data) {
          
          // Check if data is already the DeckStatistics object or wrapped in DeckStatisticsResponse
          const data = response.data as any;
          if (data.deckStats) {
            setStatistics(data as DeckStatistics);
            setLastRefresh(new Date());
          } else if (data.data && data.success) {
            setStatistics(data.data as DeckStatistics);
            setLastRefresh(new Date());
          } else {
            setError(t('deck_statistics.error_loading'));
          }
        } else {
          setError(t('deck_statistics.error_loading'));
        }
      } else {
        setError(response.message || t('deck_statistics.error_loading'));
      }
    } catch (err) {
      setError(t('deck_statistics.error_loading'));
      console.error('Error fetching deck statistics:', err);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  const handleRefresh = useCallback(() => {
    fetchStatistics(true);
  }, [fetchStatistics]);

  // Filter and pagination logic
  const filteredDecks = statistics?.deckStats
    .filter(deck => 
      deck.archetype.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => b.totalMatches - a.totalMatches) || [];
  
  const totalPages = Math.ceil(filteredDecks.length / decksPerPage);
  const startIndex = (currentPage - 1) * decksPerPage;
  const endIndex = startIndex + decksPerPage;
  const currentDecks = filteredDecks.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  if (loading && !statistics) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error && !statistics) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">{error}</div>
          <button
            onClick={() => fetchStatistics()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('deck_statistics.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mt-12 bg-zinc-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-center mb-2">
            {t('deck_statistics.title')}
          </h1>
          <p className="text-zinc-400 text-center">
            {t('deck_statistics.subtitle')}
          </p>
        </div>

        {statistics && (
          <>
            {/* Statistics Header */}
            <StatisticsHeader
              statistics={statistics}
              onRefresh={handleRefresh}
              loading={loading}
              lastRefresh={lastRefresh}
            />

            {/* Search Input */}
            <div className="mb-6">
              <div className="max-w-md mx-auto">
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t('deck_statistics.search_placeholder')}
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full px-4 py-3 pl-10 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Pagination Info */}
            <div className="mb-6 text-center">
              <div className="text-zinc-400 text-sm">
                {searchTerm ? (
                  t('deck_statistics.search_results', {
                    results: filteredDecks.length,
                    total: statistics?.deckStats.length || 0,
                    term: searchTerm
                  })
                ) : (
                  t('deck_statistics.page_info', {
                    start: startIndex + 1,
                    end: Math.min(endIndex, filteredDecks.length),
                    total: filteredDecks.length
                  })
                )}
              </div>
            </div>

            {/* Deck Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {currentDecks.map((deckStat, index) => (
                <DeckCard
                  key={`${deckStat.archetype.name}-${index}`}
                  deckStat={deckStat}
                  rank={startIndex + index + 1}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 disabled:bg-zinc-800 disabled:cursor-not-allowed transition-colors"
                >
                  {t('deck_statistics.previous_page')}
                </button>
                
                <div className="flex gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 rounded-lg transition-colors ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  {totalPages > 5 && (
                    <>
                      {currentPage < totalPages - 2 && <span className="text-zinc-400">...</span>}
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        className={`px-3 py-2 rounded-lg transition-colors ${
                          currentPage === totalPages
                            ? 'bg-blue-600 text-white'
                            : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                        }`}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 disabled:bg-zinc-800 disabled:cursor-not-allowed transition-colors"
                >
                  {t('deck_statistics.next_page')}
                </button>
              </div>
            )}

            {filteredDecks.length === 0 && (
              <div className="text-center py-12">
                <div className="text-zinc-400 text-lg">
                  {t('deck_statistics.no_data')}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DeckStatisticsPage;
