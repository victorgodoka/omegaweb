import React, { useState, useMemo } from 'react';
import type { Card } from '../types';
import { getCardGenesysPoints, CARDLISTPOINTS } from '@/utils/Genesys';
import { useCardSearch } from '../hooks/useCardSearch';
import CardFiltersComponent from './CardFilters';

interface CardLibraryProps {
  cards: Card[];
  onCardClick: (card: Card) => void;
  onCardHover: (card: Card | null) => void;
  onCardAdd: (card: Card, forceToSideDeck?: boolean) => void;
  currentBanlist: 'TCG' | 'OCG' | 'TCG Genesys';
}

const ITEMS_PER_PAGE = 20;

const CardLibrary: React.FC<CardLibraryProps> = ({ cards, onCardClick, onCardHover, onCardAdd, currentBanlist }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const {
    filters,
    filteredCards,
    filterOptions,
    updateFilter,
    clearFilters,
    applyQuickFilter
  } = useCardSearch(cards, currentBanlist);

  const totalPages = Math.ceil(filteredCards.length / ITEMS_PER_PAGE);

  const paginatedCards = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredCards.slice(startIndex, endIndex);
  }, [filteredCards, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPaginationControls = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const showPages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
    let endPage = Math.min(totalPages, startPage + showPages - 1);

    if (endPage - startPage < showPages - 1) {
      startPage = Math.max(1, endPage - showPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <div className="flex space-x-1">
          {startPage > 1 && (
            <>
              <button
                onClick={() => handlePageChange(1)}
                className="px-2 py-1 text-sm text-purple-300 hover:text-purple-100"
              >
                1
              </button>
              {startPage > 2 && <span className="px-2 py-1 text-sm text-purple-400">...</span>}
            </>
          )}

          {pages.map(page => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-2 py-1 text-sm rounded ${
                page === currentPage
                  ? 'bg-purple-600 text-white'
                  : 'text-purple-300 hover:text-purple-100 hover:bg-purple-900/30'
              }`}
            >
              {page}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="px-2 py-1 text-sm text-purple-400">...</span>}
              <button
                onClick={() => handlePageChange(totalPages)}
                className="px-2 py-1 text-sm text-purple-300 hover:text-purple-100"
              >
                {totalPages}
              </button>
            </>
          )}
        </div>

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    );
  };

  const getCardBanlistStatus = (card: Card) => {
    if (currentBanlist === 'TCG Genesys') {
      // Import the Genesys points data
      const genesysData = CARDLISTPOINTS;
      const cardData = genesysData.find((item: any) =>
        item.card.toLowerCase() === card.name.toLowerCase()
      );
      return cardData ? cardData.points : 0;
    }

    const banlistInfo = card.banlist_info;
    if (!banlistInfo) return 3; // Default unlimited

    const statusKey = `ban_${currentBanlist.toLowerCase()}` as keyof typeof banlistInfo;
    const status = banlistInfo[statusKey];

    switch (status) {
      case 'Forbidden': return 0;
      case 'Limited': return 1;
      case 'Semi-Limited': return 2;
      default: return 3;
    }
  };

  const renderCardItem = (card: Card) => {
    const banlistStatus = getCardBanlistStatus(card);
    const isGenesys = currentBanlist === 'TCG Genesys';
    const cardPoints = isGenesys ? getCardGenesysPoints(card.name) : 0;

    const getStatusColor = (status: number) => {
      if (status === 0) return 'bg-red-600 text-white';
      if (status === 1) return 'bg-yellow-600 text-white';
      if (status === 2) return 'bg-orange-600 text-white';
      return 'bg-green-600 text-white';
    };

    const shouldShowBadge = isGenesys ? banlistStatus > 0 : banlistStatus < 3;

    return (
      <div
        key={card.id}
        className="relative group transition-all duration-200 cursor-pointer"
        onClick={() => onCardClick(card)}
        onMouseEnter={() => onCardHover(card)}
        onMouseLeave={() => onCardHover(null)}
      >
        <div className="cursor-pointer bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-lg border border-purple-500/30 overflow-hidden">
          <img
            src={`https://images.ygoprodeck.com/images/cards_cropped/${card.id}.jpg`}
            alt={card.name}
            className="w-full h-24 object-cover"
            loading="lazy"
          />

          {/* Banlist Status Badge */}
          {!isGenesys && shouldShowBadge && (
            <div className={`absolute top-1 left-1 w-8 h-8 opacity-85 rounded-full flex items-center justify-center text-xs font-bold ${getStatusColor(banlistStatus)}`}>
              {banlistStatus}
            </div>
          )}

          {/* Genesys Points Badge */}
          {isGenesys && cardPoints > 0 && (
            <div className="absolute top-1 right-1 bg-blue-600 text-white w-8 h-8 opacity-85 rounded-full flex items-center justify-center font-bold">
              {cardPoints}
            </div>
          )}

          {/* Add to Deck Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const forceToSideDeck = e.ctrlKey || e.metaKey; // Support both Ctrl (Windows/Linux) and Cmd (Mac)
              onCardAdd(card, forceToSideDeck);
            }}
            className="absolute inset-0 bg-green-500/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
            title={`Click to add to main/extra deck${'\n'}Ctrl+Click to add to side deck`}
          >
            <span className="text-white font-bold text-lg">+</span>
          </button>
        </div>

        <div className="mt-1 text-xs text-purple-200 text-center truncate">
          {card.name}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Filter Toggle Button */}
      <div className="mb-4 flex-shrink-0">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-between"
        >
          <span>🔍 Advanced Filters</span>
          <span className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`}>▼</span>
        </button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="mb-4 flex-shrink-0">
          <CardFiltersComponent
            filters={filters}
            filterOptions={filterOptions}
            currentBanlist={currentBanlist}
            onFilterChange={(key, value) => {
              updateFilter(key, value);
              setCurrentPage(1); // Reset to first page when filtering
            }}
            onClearFilters={() => {
              clearFilters();
              setCurrentPage(1);
            }}
            onQuickFilter={(preset) => {
              applyQuickFilter(preset);
              setCurrentPage(1);
            }}
          />
        </div>
      )}

      {/* Quick Search Bar */}
      <div className="mb-4 flex-shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Quick search cards..."
            value={filters.search}
            onChange={(e) => {
              updateFilter('search', e.target.value);
              setCurrentPage(1);
            }}
            className="flex-1 px-3 py-2 bg-purple-900/30 border border-purple-500/30 rounded-lg text-purple-100 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />

          {/* Genesys Points Filter */}
          {currentBanlist === 'TCG Genesys' && (
            <input
              type="number"
              placeholder="Max points"
              value={filters.pointsFilter}
              onChange={(e) => {
                updateFilter('pointsFilter', e.target.value);
                setCurrentPage(1);
              }}
              max="999"
              min="0"
              className="w-24 px-3 py-2 bg-purple-900/30 border border-purple-500/30 rounded-lg text-purple-100 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          )}
        </div>
      </div>

      {/* Results Count and Page Info */}
      <div className="mb-3 text-sm text-purple-300 flex-shrink-0">
        Showing {paginatedCards.length} of {filteredCards.length} cards (Page {currentPage} of {totalPages})
      </div>

      {/* Card Grid */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="grid grid-cols-4 gap-2">
          {paginatedCards.map(renderCardItem)}
        </div>

        {paginatedCards.length === 0 && (
          <div className="flex items-center justify-center h-32 bg-purple-900/20 rounded-lg border border-purple-500/20">
            <p className="text-purple-300">No cards found</p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="mt-4 flex-shrink-0">
        {renderPaginationControls()}
      </div>
    </div>
  );
};

export default CardLibrary;
