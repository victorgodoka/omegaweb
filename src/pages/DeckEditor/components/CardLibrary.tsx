import React, { useState, useMemo } from 'react';
import type { Card } from '../types';
import { useGenesys } from '@/contexts/GenesysContext';
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
  const { genesysData } = useGenesys();
  
  // Helper function to get Genesys points for a card
  const getCardGenesysPoints = (cardName: string): number => {
    const card = cards.find(c => c.name.toLowerCase() === cardName.toLowerCase());
    if (!card) return 0;
    return genesysData[card.id] || 0;
  };

  const {
    filters,
    filteredCards,
    filterOptions,
    updateFilter,
    clearFilters,
    applyQuickFilter,
    toggleMonsterType
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
      <div className="flex items-center justify-between">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2 lg:px-3 py-1 text-xs lg:text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
        >
          <span className="lg:hidden">‹</span>
          <span className="hidden lg:inline">Previous</span>
        </button>

        <div className="flex space-x-1 overflow-x-auto max-w-[60%] lg:max-w-none scrollbar-thin">
          {startPage > 1 && (
            <>
              <button
                onClick={() => handlePageChange(1)}
                className="px-2 py-1 text-xs lg:text-sm text-purple-300 hover:text-purple-100 whitespace-nowrap"
              >
                1
              </button>
              {startPage > 2 && <span className="px-1 py-1 text-xs lg:text-sm text-purple-400">...</span>}
            </>
          )}

          {pages.map(page => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-2 py-1 text-xs lg:text-sm rounded whitespace-nowrap touch-manipulation ${
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
              {endPage < totalPages - 1 && <span className="px-1 py-1 text-xs lg:text-sm text-purple-400">...</span>}
              <button
                onClick={() => handlePageChange(totalPages)}
                className="px-2 py-1 text-xs lg:text-sm text-purple-300 hover:text-purple-100 whitespace-nowrap"
              >
                {totalPages}
              </button>
            </>
          )}
        </div>

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-2 lg:px-3 py-1 text-xs lg:text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
        >
          <span className="lg:hidden">›</span>
          <span className="hidden lg:inline">Next</span>
        </button>
      </div>
    );
  };

  const getCardBanlistStatus = (card: Card) => {
    if (currentBanlist === 'TCG Genesys') {
      // Return Genesys points for this card
      return getCardGenesysPoints(card.name);
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
    const cardPoints = isGenesys ? getCardGenesysPoints(card.name) : "";

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
        className="relative group transition-all duration-200 cursor-pointer touch-manipulation"
        onClick={() => onCardClick(card)}
        onMouseEnter={() => onCardHover(card)}
        onMouseLeave={() => onCardHover(null)}
      >
        <div className="cursor-pointer bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded border border-purple-500/30 overflow-hidden aspect-[59/86]">
          <img
            src={`https://images.ygoprodeck.com/images/cards_cropped/${card.id}.jpg`}
            alt={card.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />

          {/* Banlist Status Badge */}
          {!isGenesys && shouldShowBadge && (
            <div className={`absolute top-0.5 left-0.5 lg:top-1 lg:left-1 w-5 h-5 lg:w-8 lg:h-8 opacity-85 rounded-full flex items-center justify-center text-xs font-bold ${getStatusColor(banlistStatus)}`}>
              {banlistStatus}
            </div>
          )}

          {/* Genesys Points Badge */}
          {isGenesys && (cardPoints || 0) > 0 && (
            <div className="absolute top-0.5 right-0.5 lg:top-1 lg:right-1 bg-blue-600 text-white w-5 h-5 lg:w-8 lg:h-8 opacity-85 rounded-full flex items-center justify-center text-xs font-bold">
              {cardPoints}
            </div>
          )}

          {/* Add to Deck Button - Touch Friendly */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const forceToSideDeck = e.ctrlKey || e.metaKey; // Support both Ctrl (Windows/Linux) and Cmd (Mac)
              onCardAdd(card, forceToSideDeck);
            }}
            className="absolute inset-0 bg-green-500/80 opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity duration-200 flex items-center justify-center touch-manipulation"
            title={`Click to add to main/extra deck${'\n'}Ctrl+Click to add to side deck`}
          >
            <span className="text-white font-bold text-sm lg:text-lg">+</span>
          </button>
        </div>

        <div className="mt-0.5 lg:mt-1 text-xs text-purple-200 text-center truncate hidden lg:block">
          {card.name}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Advanced Filters Toggle */}
      <div className="mb-3 lg:mb-4 flex-shrink-0">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-between"
        >
          <span>🔍 Advanced Filters</span>
          <span className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`}>▼</span>
        </button>
      </div>

      {/* Filter Panel Overlay - Mobile Fullscreen / Desktop Side Panel */}
      {showFilters && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setShowFilters(false)}
          />
          
          {/* Filter Panel */}
          <div className={`
            fixed z-50 bg-gray-900 border border-purple-500/30
            
            /* Mobile: Fullscreen */
            inset-0 lg:inset-auto
            
            /* Desktop: Side Panel */
            lg:fixed lg:top-0 lg:right-0 lg:h-full lg:w-96 lg:max-w-[90vw]
            
            /* Animations */
            transform transition-transform duration-300 ease-in-out
            ${showFilters ? 'translate-x-0' : 'translate-x-full lg:translate-x-full'}
            
            /* Styling */
            shadow-2xl overflow-y-auto
          `}>
            {/* Panel Header */}
            <div className="sticky top-0 bg-gray-900 border-b border-purple-500/30 p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-purple-100">Advanced Filters</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 hover:bg-purple-600/20 rounded-lg transition-colors text-purple-200 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Panel Content */}
            <div className="p-4">
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
                onToggleMonsterType={(monsterType) => {
                  toggleMonsterType(monsterType);
                  setCurrentPage(1);
                }}
                changeBanlistComponent={<></>}
              />
            </div>
            
            {/* Panel Footer - Mobile Only */}
            <div className="sticky bottom-0 bg-gray-900 border-t border-purple-500/30 p-4 lg:hidden">
              <button
                onClick={() => setShowFilters(false)}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </>
      )}

      {/* Quick Search Bar */}
      <div className="mb-3 lg:mb-4 flex-shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search cards..."
            value={filters.search}
            onChange={(e) => {
              updateFilter('search', e.target.value);
              setCurrentPage(1);
            }}
            className="flex-1 px-3 py-2 bg-purple-900/30 border border-purple-500/30 rounded-lg text-purple-100 placeholder-purple-300 text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-purple-400"
          />

          {/* Genesys Points Filter */}
          {currentBanlist === 'TCG Genesys' && (
            <input
              type="number"
              placeholder="Max pts"
              value={filters.pointsFilter}
              onChange={(e) => {
                updateFilter('pointsFilter', e.target.value);
                setCurrentPage(1);
              }}
              max="999"
              min="0"
              className="w-20 lg:w-24 px-2 lg:px-3 py-2 bg-purple-900/30 border border-purple-500/30 rounded-lg text-purple-100 placeholder-purple-300 text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          )}
        </div>
      </div>

      {/* Results Count and Page Info */}
      <div className="mb-2 lg:mb-3 text-xs lg:text-sm text-purple-300 flex-shrink-0">
        <span className="lg:hidden">{paginatedCards.length}/{filteredCards.length} cards</span>
        <span className="hidden lg:inline">Showing {paginatedCards.length} of {filteredCards.length} cards (Page {currentPage} of {totalPages})</span>
      </div>

      {/* Card Grid */}
      <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin">
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-1 lg:gap-2">
          {paginatedCards.map(renderCardItem)}
        </div>

        {paginatedCards.length === 0 && (
          <div className="flex items-center justify-center h-24 lg:h-32 bg-purple-900/20 rounded-lg border border-purple-500/20">
            <p className="text-purple-300 text-sm lg:text-base">No cards found</p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="mt-3 lg:mt-4 flex-shrink-0">
        {renderPaginationControls()}
      </div>
    </div>
  );
};

export default CardLibrary;
