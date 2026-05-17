import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { api } from '@/utils/Api';
import type { Tournament } from './types';

const History = () => {
  const { t, i18n } = useTranslation();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTournaments, setTotalTournaments] = useState(0);
  const [limit] = useState(20);

  useEffect(() => {
    fetchTournaments(currentPage);
  }, [currentPage]);

  const fetchTournaments = async (page: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.main.getTournaments(page, limit);

      if (!response.ok || !response.data) {
        throw new Error(t('history.error_loading'));
      }

      const data = response.data;

      if (!data.success) {
        throw new Error(t('history.api_unsuccessful'));
      }

      setTournaments(data.data.tournaments);
      setTotalPages(data.data.pagination.totalPages);
      setTotalTournaments(data.data.pagination.totalTournaments);
      setCurrentPage(data.data.pagination.currentPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.network_error'));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const lang = i18n.language || 'en-US';
    const locale = lang.startsWith('pt') ? 'pt-BR' : 'en-US';
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const TournamentCard = ({ tournament }: { tournament: Tournament }) => (
    <Link
      to={`/tournament/${tournament.id}`}
      className="block bg-zinc-900/50 border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition-all group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center border border-zinc-700">
            <Icon icon="mdi:tournament" className="w-6 h-6 text-zinc-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg group-hover:text-zinc-300 transition-colors">
              {t('history.tournament_number', { id: tournament.id })}
            </h3>
            <p className="text-zinc-500 text-sm">
              {tournament.phases} {t('history.phases')}
            </p>
          </div>
        </div>
        {tournament.endtime && (
          <span className="px-2 py-1 bg-zinc-800 text-zinc-400 text-xs rounded border border-zinc-700">
            {t('history.completed')}
          </span>
        )}
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Icon icon="mdi:calendar" className="w-4 h-4 text-zinc-500" />
          <span className="text-zinc-400">{formatDate(tournament.starttime)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Icon icon="mdi:account-group" className="w-4 h-4 text-zinc-500" />
          <span className="text-zinc-400">
            {tournament.players} {t('history.players_count')}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Icon icon="mdi:shield-check" className="w-4 h-4 text-zinc-500" />
          <span className="text-zinc-400">{tournament.banlist}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Icon icon="mdi:cog" className="w-4 h-4 text-zinc-500" />
          <span className="text-zinc-400">{tournament.settings}</span>
        </div>
      </div>

      {/* Extra Rules */}
      {tournament.extrarules && (
        <div className="pt-3 border-t border-zinc-800">
          <p className="text-zinc-500 text-xs">{tournament.extrarules}</p>
        </div>
      )}
    </Link>
  );

  const SkeletonCard = () => (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-5 animate-pulse">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 bg-zinc-800 rounded-lg"></div>
        <div className="flex-1">
          <div className="h-5 bg-zinc-800 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-zinc-800 rounded w-1/2"></div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="h-4 bg-zinc-800 rounded"></div>
        <div className="h-4 bg-zinc-800 rounded"></div>
        <div className="h-4 bg-zinc-800 rounded"></div>
        <div className="h-4 bg-zinc-800 rounded"></div>
      </div>
    </div>
  );

  const PaginationControls = () => {
    const getPageNumbers = () => {
      const pages: (number | string)[] = [];
      const maxVisiblePages = 5;

      if (totalPages <= maxVisiblePages) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        if (currentPage <= 3) {
          for (let i = 1; i <= 4; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1);
          pages.push('...');
          for (let i = totalPages - 3; i <= totalPages; i++) {
            pages.push(i);
          }
        } else {
          pages.push(1);
          pages.push('...');
          for (let i = currentPage - 1; i <= currentPage + 1; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(totalPages);
        }
      }

      return pages;
    };

    return (
      <div className="flex items-center justify-center gap-2 mt-8">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 text-sm font-medium text-zinc-400 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Icon icon="mdi:chevron-left" className="w-5 h-5" />
        </button>

        {getPageNumbers().map((page, index) => (
          <div key={index}>
            {page === '...' ? (
              <span className="px-3 py-2 text-sm text-zinc-600">...</span>
            ) : (
              <button
                onClick={() => handlePageChange(page as number)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                  currentPage === page
                    ? 'bg-white text-black'
                    : 'text-zinc-400 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:text-white'
                }`}
              >
                {page}
              </button>
            )}
          </div>
        ))}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 text-sm font-medium text-zinc-400 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Icon icon="mdi:chevron-right" className="w-5 h-5" />
        </button>
      </div>
    );
  };

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Icon icon="mdi:alert-circle" className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-white text-xl mb-2">{t('error')}</h2>
          <p className="text-zinc-400">{error}</p>
          <button
            onClick={() => fetchTournaments(currentPage)}
            className="mt-4 px-4 py-2 bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors"
          >
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Icon icon="mdi:history" className="w-8 h-8 text-white" />
            <h1 className="text-3xl font-bold text-white">{t('history.title')}</h1>
          </div>
          <p className="text-zinc-400">{t('history.subtitle')}</p>
          {!loading && (
            <p className="text-zinc-500 text-sm mt-2">
              {t('history.showing', {
                from: (currentPage - 1) * limit + 1,
                to: Math.min(currentPage * limit, totalTournaments),
                total: totalTournaments,
              })}
            </p>
          )}
        </div>

        {/* Tournament Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 12 }).map((_, index) => <SkeletonCard key={index} />)
            : tournaments.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
        </div>

        {/* Empty State */}
        {!loading && tournaments.length === 0 && (
          <div className="text-center py-16">
            <Icon icon="mdi:tournament" className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-zinc-400 text-lg mb-2">{t('history.empty_title')}</h3>
            <p className="text-zinc-600">{t('history.empty_subtitle')}</p>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && <PaginationControls />}
      </div>
    </div>
  );
};

export default History;
