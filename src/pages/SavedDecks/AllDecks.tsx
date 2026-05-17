import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { api, type SavedDeck } from '@/utils/Api';
import DeckCard from './components/DeckCard';
import DeckBreadcrumbs from './components/DeckBreadcrumbs';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const AllDecks = () => {
  const { t } = useTranslation();
  const [decks, setDecks] = useState<SavedDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [availableArchetypes, setAvailableArchetypes] = useState<any[]>([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArchetype, setSelectedArchetype] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'likes' | 'comments'>('created_at');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchDecks();
  }, [pagination.page, sortBy, order, selectedArchetype]);

  const fetchDecks = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Parse search query for name and tags
      const { name, tags } = parseSearchQuery(searchQuery);
      
      const response = await api.main.getAllPublicDecks({
        name,
        tag: tags[0], // API supports single tag filter
        archetype: selectedArchetype || undefined,
        sortBy,
        order,
        page: pagination.page,
        limit: pagination.limit
      });
      
      if (response.ok && response.data) {
        const { data, filters, pagination } = response.data
        setDecks(data);
        
        // Update pagination
        if (pagination) {
          setPagination(pagination);
        }
        
        // Update available archetypes
        if (filters?.availableArchetypes) {
          setAvailableArchetypes(filters.availableArchetypes);
        }
      } else {
        setError(response.message || t('saved_decks.create_error'));
      }
    } catch (err) {
      console.error('Error fetching public decks:', err);
      setError(t('common.network_error'));
    } finally {
      setLoading(false);
    }
  };

  const parseSearchQuery = (query: string) => {
    const parts = query.trim().split(/\s+/);
    const tags: string[] = [];
    const nameWords: string[] = [];
    
    parts.forEach(part => {
      if (part.startsWith('#')) {
        tags.push(part.substring(1));
      } else {
        nameWords.push(part);
      }
    });
    
    return {
      name: nameWords.join(' '),
      tags
    };
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchDecks();
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;
    
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, pagination.page - Math.floor(maxVisible / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return (
      <div className="flex items-center justify-center gap-2 mt-8">
        <button
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page === 1}
          className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 rounded-md transition-colors"
        >
          <Icon icon="mdi:chevron-left" />
        </button>
        
        {startPage > 1 && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-gray-300 rounded-md transition-colors"
            >
              1
            </button>
            {startPage > 2 && <span className="text-gray-500">...</span>}
          </>
        )}
        
        {pages.map(page => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-3 py-2 rounded-md transition-colors ${
              page === pagination.page
                ? 'bg-white text-black font-semibold'
                : 'bg-zinc-800 hover:bg-zinc-700 text-gray-300'
            }`}
          >
            {page}
          </button>
        ))}
        
        {endPage < pagination.totalPages && (
          <>
            {endPage < pagination.totalPages - 1 && <span className="text-gray-500">...</span>}
            <button
              onClick={() => handlePageChange(pagination.totalPages)}
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-gray-300 rounded-md transition-colors"
            >
              {pagination.totalPages}
            </button>
          </>
        )}
        
        <button
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={pagination.page === pagination.totalPages}
          className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 rounded-md transition-colors"
        >
          <Icon icon="mdi:chevron-right" />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-black to-zinc-900">
      <div className="container mx-auto px-4 py-20 max-w-7xl">
        <DeckBreadcrumbs
          items={[{ label: t("saved_decks.all_public_decks") }]}
          showBack={false}
        />

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-2">
            <Icon icon="mdi:cards-variant" className="text-3xl text-gray-400" />
            <h1 className="text-3xl font-bold text-white">
              {t("saved_decks.all_public_decks")}
            </h1>
          </div>
          <p className="text-gray-500 ml-14">
            {t("saved_decks.all_public_decks_subtitle")}
          </p>
        </div>

        {/* Filters and Search */}
        <div className="mb-8 bg-zinc-900/50 rounded-lg p-6 border border-zinc-800">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold mb-2 text-gray-400">
                {t("saved_decks.search")}
              </label>
              <div className="flex gap-2 flex-wrap">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  placeholder={t("saved_decks.search_placeholder")}
                  className="flex-1 px-4 py-2 bg-black border border-zinc-800 rounded-md focus:outline-none focus:border-zinc-700 text-white placeholder-gray-600 transition-colors"
                />
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-md font-semibold transition-colors flex items-center gap-2"
                >
                  <Icon icon="mdi:magnify" />
                  {t("saved_decks.search")}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t("saved_decks.search_hint")}
              </p>
            </div>

            {/* Archetype Filter */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-400">
                {t("saved_decks.archetype")}
              </label>
              <select
                value={selectedArchetype}
                onChange={(e) => setSelectedArchetype(e.target.value)}
                className="w-full px-4 py-2 bg-black border border-zinc-800 rounded-md focus:outline-none focus:border-zinc-700 text-white transition-colors"
              >
                <option value="">{t("saved_decks.all_archetypes")}</option>
                {availableArchetypes.map((archetype) => (
                  <option key={archetype} value={archetype}>
                    {archetype}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-400">
                {t("saved_decks.sort_by")}
              </label>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as typeof sortBy)
                  }
                  className="flex-1 px-4 py-2 bg-black border border-zinc-800 rounded-md focus:outline-none focus:border-zinc-700 text-white transition-colors"
                >
                  <option value="created_at">{t("saved_decks.newest")}</option>
                  <option value="likes">{t("saved_decks.most_liked")}</option>
                  <option value="comments">
                    {t("saved_decks.most_commented")}
                  </option>
                </select>
                <button
                  onClick={() => setOrder(order === "asc" ? "desc" : "asc")}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-gray-300 rounded-md transition-colors"
                  title={
                    order === "asc"
                      ? t("saved_decks.ascending")
                      : t("saved_decks.descending")
                  }
                >
                  <Icon
                    icon={
                      order === "asc"
                        ? "mdi:sort-ascending"
                        : "mdi:sort-descending"
                    }
                    className="text-xl"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Decks List */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, index) => (
              <div
                key={index}
                className="bg-zinc-900/50 rounded-lg border border-zinc-800 overflow-hidden animate-pulse"
              >
                {/* Cover Image Skeleton */}
                <div className="aspect-[2/3] bg-zinc-800" />

                {/* Content Skeleton */}
                <div className="p-3 space-y-3">
                  {/* Title */}
                  <div className="h-4 bg-zinc-800 rounded w-3/4" />

                  {/* Tags */}
                  <div className="flex gap-2">
                    <div className="h-5 bg-zinc-800 rounded w-16" />
                    <div className="h-5 bg-zinc-800 rounded w-20" />
                  </div>

                  {/* Stats */}
                  <div className="flex gap-3">
                    <div className="h-4 bg-zinc-800 rounded w-12" />
                    <div className="h-4 bg-zinc-800 rounded w-12" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col justify-center items-center py-16">
            <Icon
              icon="mdi:alert-circle"
              className="text-6xl text-red-400 mb-4"
            />
            <h3 className="text-xl font-semibold mb-2 text-white">
              {t("error")}
            </h3>
            <p className="text-gray-500">{error}</p>
          </div>
        ) : decks.length === 0 ? (
          <div className="flex flex-col justify-center items-center py-16">
            <Icon
              icon="mdi:cards-outline"
              className="text-6xl text-gray-700 mb-4"
            />
            <h3 className="text-xl font-semibold mb-2 text-gray-400">
              {t("saved_decks.no_public_decks")}
            </h3>
            <p className="text-gray-600">
              {t("saved_decks.no_public_decks_subtitle")}
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-400">
                {pagination.total}{" "}
                {pagination.total === 1
                  ? t("saved_decks.deck")
                  : t("saved_decks.decks")}
              </h2>
              <p className="text-sm text-gray-500">
                {t("saved_decks.page_info", {
                  page: pagination.page,
                  totalPages: pagination.totalPages,
                })}
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
              {decks.map((deck) => (
                <DeckCard key={deck.id} deck={deck} showActions={false} />
              ))}
            </div>

            {/* Pagination */}
            {renderPagination()}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllDecks;
