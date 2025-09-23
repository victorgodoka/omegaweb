import React from 'react';
import type { CardFilters } from '../hooks/useCardSearch';

interface CardFiltersProps {
  filters: CardFilters;
  filterOptions: {
    types: string[];
    attributes: string[];
    races: string[];
    levels: number[];
    genesysPoints: number[];
  };
  currentBanlist: 'TCG' | 'OCG' | 'TCG Genesys';
  onFilterChange: (key: keyof CardFilters, value: string | number | null) => void;
  onClearFilters: () => void;
  onQuickFilter: (preset: string) => void;
}

const CardFiltersComponent: React.FC<CardFiltersProps> = ({
  filters,
  filterOptions,
  currentBanlist,
  onFilterChange,
  onClearFilters,
  onQuickFilter
}) => {
  return (
    <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-xl border border-purple-500/30 p-4 space-y-4">
      {/* Filter Controls */}
      <div className="flex gap-2 flex-wrap">
        {currentBanlist === 'TCG Genesys' && (
          <>
            <button
              onClick={() => onFilterChange('pointsFilter', 'has-points')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filters.pointsFilter === 'has-points'
                  ? 'bg-blue-600 text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              Cards with Points
            </button>
            
            <select
              value={filters.pointsFilter === 'has-points' ? '' : filters.pointsFilter}
              onChange={(e) => onFilterChange('pointsFilter', e.target.value)}
              className="px-3 py-2 bg-purple-900/30 border border-purple-500/30 rounded-lg text-purple-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="">All Points</option>
              {filterOptions.genesysPoints.map(points => (
                <option key={points} value={points.toString()}>
                  {points} Point{points !== 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </>
        )}

        <button
          onClick={onClearFilters}
          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Quick Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onQuickFilter('monsters')}
          className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm transition-colors"
        >
          Monsters
        </button>
        <button
          onClick={() => onQuickFilter('spells')}
          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
        >
          Spells
        </button>
        <button
          onClick={() => onQuickFilter('traps')}
          className="px-3 py-1 bg-pink-600 hover:bg-pink-700 text-white rounded text-sm transition-colors"
        >
          Traps
        </button>
        <button
          onClick={() => onQuickFilter('extra-deck')}
          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition-colors"
        >
          Extra Deck
        </button>
      </div>

      {/* Conditional Advanced Filters */}
      {filters.frameType === 'monster' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Attribute Filter */}
          <select
            value={filters.attribute}
            onChange={(e) => onFilterChange('attribute', e.target.value)}
            className="px-3 py-2 bg-purple-900/30 border border-purple-500/30 rounded-lg text-purple-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="">All Attributes</option>
            {filterOptions.attributes.map(attribute => (
              <option key={attribute} value={attribute}>{attribute}</option>
            ))}
          </select>

          {/* Race Filter */}
          <select
            value={filters.race}
            onChange={(e) => onFilterChange('race', e.target.value)}
            className="px-3 py-2 bg-purple-900/30 border border-purple-500/30 rounded-lg text-purple-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="">All Races</option>
            {filterOptions.races.map(race => (
              <option key={race} value={race}>{race}</option>
            ))}
          </select>

          {/* Level Filter */}
          <input
            type="number"
            placeholder="Level (1-13)"
            value={filters.level || ''}
            onChange={(e) => onFilterChange('level', e.target.value ? parseInt(e.target.value) : null)}
            min="1"
            max="13"
            className="px-3 py-2 bg-purple-900/30 border border-purple-500/30 rounded-lg text-purple-100 placeholder-purple-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          />

          {/* Pendulum Scale Filter - Hidden in TCG Genesys */}
          {currentBanlist !== 'TCG Genesys' && (
            <input
              type="number"
              placeholder="Scale (0-13)"
              value={filters.pendulumScale || ''}
              onChange={(e) => onFilterChange('pendulumScale', e.target.value ? parseInt(e.target.value) : null)}
              min="0"
              max="13"
              className="px-3 py-2 bg-purple-900/30 border border-purple-500/30 rounded-lg text-purple-100 placeholder-purple-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          )}

          {/* Link Rating Filter - Hidden in TCG Genesys */}
          {currentBanlist !== 'TCG Genesys' && (
            <input
              type="number"
              placeholder="Link (1-6)"
              value={filters.linkRating || ''}
              onChange={(e) => onFilterChange('linkRating', e.target.value ? parseInt(e.target.value) : null)}
              min="1"
              max="6"
              className="px-3 py-2 bg-purple-900/30 border border-purple-500/30 rounded-lg text-purple-100 placeholder-purple-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          )}
        </div>
      )}

      {/* Spell Subtypes */}
      {filters.frameType === 'spell' && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <button
            onClick={() => onFilterChange('race', 'Normal')}
            className={`px-3 py-2 rounded text-sm transition-colors ${
              filters.race === 'Normal' 
                ? 'bg-green-600 text-white' 
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            Normal
          </button>
          <button
            onClick={() => onFilterChange('race', 'Quick-Play')}
            className={`px-3 py-2 rounded text-sm transition-colors ${
              filters.race === 'Quick-Play' 
                ? 'bg-green-600 text-white' 
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            Quick-Play
          </button>
          <button
            onClick={() => onFilterChange('race', 'Continuous')}
            className={`px-3 py-2 rounded text-sm transition-colors ${
              filters.race === 'Continuous' 
                ? 'bg-green-600 text-white' 
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            Continuous
          </button>
          <button
            onClick={() => onFilterChange('race', 'Ritual')}
            className={`px-3 py-2 rounded text-sm transition-colors ${
              filters.race === 'Ritual' 
                ? 'bg-green-600 text-white' 
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            Ritual
          </button>
          <button
            onClick={() => onFilterChange('race', 'Equip')}
            className={`px-3 py-2 rounded text-sm transition-colors ${
              filters.race === 'Equip' 
                ? 'bg-green-600 text-white' 
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            Equip
          </button>
        </div>
      )}

      {/* Trap Subtypes */}
      {filters.frameType === 'trap' && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <button
            onClick={() => onFilterChange('race', 'Normal')}
            className={`px-3 py-2 rounded text-sm transition-colors ${
              filters.race === 'Normal' 
                ? 'bg-pink-600 text-white' 
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            Normal
          </button>
          <button
            onClick={() => onFilterChange('race', 'Continuous')}
            className={`px-3 py-2 rounded text-sm transition-colors ${
              filters.race === 'Continuous' 
                ? 'bg-pink-600 text-white' 
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            Continuous
          </button>
          <button
            onClick={() => onFilterChange('race', 'Counter')}
            className={`px-3 py-2 rounded text-sm transition-colors ${
              filters.race === 'Counter' 
                ? 'bg-pink-600 text-white' 
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            Counter
          </button>
        </div>
      )}

      {/* Sort Options */}
      <div className="flex gap-3 items-center">
        <span className="text-purple-200 text-sm">Sort by:</span>
        <select
          value={filters.sortBy}
          onChange={(e) => onFilterChange('sortBy', e.target.value)}
          className="px-3 py-1 bg-purple-900/30 border border-purple-500/30 rounded text-purple-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
        >
          <option value="name">Name</option>
          <option value="type">Type</option>
          <option value="level">Level</option>
          <option value="atk">ATK</option>
          <option value="def">DEF</option>
          {currentBanlist === 'TCG Genesys' && (
            <option value="points">Points</option>
          )}
        </select>

        <select
          value={filters.sortOrder}
          onChange={(e) => onFilterChange('sortOrder', e.target.value)}
          className="px-3 py-1 bg-purple-900/30 border border-purple-500/30 rounded text-purple-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>
    </div>
  );
};

export default CardFiltersComponent;
