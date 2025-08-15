import React, { useState, useEffect } from 'react';
import type { PastTournaments, Tournament } from './types';
import { Link } from 'react-router';

const History: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [filteredTournaments, setFilteredTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTournaments, setTotalTournaments] = useState(0);
  const [availableBanlists, setAvailableBanlists] = useState<string[]>([]);
  const [selectedBanlist, setSelectedBanlist] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const tournamentsPerPage = 50;

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(import.meta.env.VITE_API_URL + '/tournaments');
        
        if (!response.ok) {
          throw new Error('Failed to fetch tournament data');
        }

        const data: PastTournaments = await response.json();
        
        if (!data.success) {
          throw new Error('API returned unsuccessful response');
        }

        setTournaments(data.data);
        setFilteredTournaments(data.data);
        setTotalTournaments(data.data.length);
        
        // Extract unique banlists
        const banlists = [...new Set(data.data.map(tournament => tournament.banlist))];
        setAvailableBanlists(banlists);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  // Filter tournaments based on criteria
  useEffect(() => {
    let filtered = tournaments;

    // Filter by banlist
    if (selectedBanlist) {
      filtered = filtered.filter(tournament => tournament.banlist === selectedBanlist);
    }

    // Filter by date range
    if (dateFrom) {
      filtered = filtered.filter(tournament => new Date(tournament.starttime) >= new Date(dateFrom));
    }
    if (dateTo) {
      filtered = filtered.filter(tournament => new Date(tournament.starttime) <= new Date(dateTo));
    }

    setFilteredTournaments(filtered);
    setTotalTournaments(filtered.length);
    setCurrentPage(1); // Reset to first page when filters change
  }, [tournaments, selectedBanlist, dateFrom, dateTo]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCurrentPageTournaments = (): Tournament[] => {
    const startIndex = (currentPage - 1) * tournamentsPerPage;
    const endIndex = startIndex + tournamentsPerPage;
    return filteredTournaments.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(totalTournaments / tournamentsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const SkeletonCard = () => (
    <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6 mt-12 animate-pulse">
      <div className="space-y-3">
        <div className="h-6 bg-zinc-700 rounded w-3/4"></div>
        <div className="h-4 bg-zinc-700 rounded w-1/2"></div>
        <div className="flex space-x-4">
          <div className="h-4 bg-zinc-700 rounded w-20"></div>
          <div className="h-4 bg-zinc-700 rounded w-16"></div>
        </div>
        <div className="h-4 bg-zinc-700 rounded w-1/3"></div>
        <div className="h-10 bg-zinc-700 rounded w-full mt-4"></div>
      </div>
    </div>
  );

  const clearFilters = () => {
    setSelectedBanlist('');
    setDateFrom('');
    setDateTo('');
  };

  const PaginationControls = () => {
    const getPageNumbers = () => {
      const pages = [];
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
      <div className="flex items-center justify-center space-x-2 mt-8">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 text-sm font-medium text-zinc-300 bg-zinc-800 border border-zinc-600 rounded-md hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        {getPageNumbers().map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="px-3 py-2 text-sm text-zinc-500">...</span>
            ) : (
              <button
                onClick={() => handlePageChange(page as number)}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-300 bg-zinc-800 border border-zinc-600 hover:bg-zinc-700'
                }`}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}
        
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 text-sm font-medium text-zinc-300 bg-zinc-800 border border-zinc-600 rounded-md hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    );
  };

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">⚠️ Error</div>
          <p className="text-zinc-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 mt-12">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-300 mb-2">Tournament History</h1>
          <p className="text-zinc-400">Browse past tournaments and their results</p>
          {!loading && (
            <p className="text-zinc-500 text-sm mt-2">
              Showing {((currentPage - 1) * tournamentsPerPage) + 1}-{Math.min(currentPage * tournamentsPerPage, totalTournaments)} of {totalTournaments} tournaments
            </p>
          )}
        </div>

        {/* Filters */}
        <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Banlist
              </label>
              <select
                value={selectedBanlist}
                onChange={(e) => setSelectedBanlist(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Banlists</option>
                {availableBanlists.map((banlist) => (
                  <option key={banlist} value={banlist}>
                    {banlist}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 bg-zinc-600 text-zinc-100 text-sm font-medium rounded-md hover:bg-zinc-500 transition-colors duration-200"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Tournament Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array.from({ length: 12 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))
          ) : (
            getCurrentPageTournaments().map((tournament) => (
              <div
                key={tournament.id}
                className="bg-zinc-800 rounded-lg border border-zinc-700 p-6 hover:border-blue-400 transition-colors duration-200 flex flex-col"
              >
                <h3 className="text-lg font-semibold text-zinc-100 mb-3">
                  Tournament #{tournament.id}
                </h3>
                
                <div className="flex flex-col space-y-2 text-sm text-zinc-400 mb-4 flex-1">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    {formatDate(tournament.starttime)}
                  </span>
                  
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {tournament.banlist}
                  </span>
                  
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                    </svg>
                    {tournament.players} players
                  </span>

                  {tournament.endtime && (
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900 text-green-300 border border-green-700 w-fit">
                      Completed
                    </div>
                  )}
                </div>
                
                <Link
                  to={`/tournament/${tournament.id}`}
                  className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors duration-200 text-center mt-auto"
                >
                  View Details
                </Link>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && <PaginationControls />}

        {/* Empty State */}
        {!loading && tournaments.length === 0 && (
          <div className="text-center py-12">
            <div className="text-zinc-400 text-lg mb-2">No tournaments found</div>
            <p className="text-zinc-500">Check back later for tournament history</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;