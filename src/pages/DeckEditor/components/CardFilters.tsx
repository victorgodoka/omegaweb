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
  onToggleMonsterType: (monsterType: string) => void;
  changeBanlistComponent: React.ReactNode;
}

const CardFiltersComponent: React.FC<CardFiltersProps> = ({
  filters,
  filterOptions,
  currentBanlist,
  onFilterChange,
  onClearFilters,
  onQuickFilter,
  onToggleMonsterType,
  changeBanlistComponent
}) => {
  const monsterTypeButtons = [
    { key: 'effect', label: 'Effect', color: 'bg-orange-600 hover:bg-orange-700' },
    { key: 'normal', label: 'Normal', color: 'bg-yellow-600 hover:bg-yellow-700' },
    { key: 'fusion', label: 'Fusion', color: 'bg-purple-600 hover:bg-purple-700' },
    { key: 'synchro', label: 'Synchro', color: 'bg-white hover:bg-gray-100 text-black' },
    { key: 'xyz', label: 'Xyz', color: 'bg-black hover:bg-gray-800' },
    { key: 'link', label: 'Link', color: 'bg-blue-600 hover:bg-blue-700' },
    { key: 'ritual', label: 'Ritual', color: 'bg-indigo-600 hover:bg-indigo-700' },
    { key: 'pendulum', label: 'Pendulum', color: 'bg-emerald-600 hover:bg-emerald-700' },
    { key: 'tuner', label: 'Tuner', color: 'bg-green-600 hover:bg-green-700' },
    { key: 'union', label: 'Union', color: 'bg-gray-600 hover:bg-gray-700' },
    { key: 'spirit', label: 'Spirit', color: 'bg-cyan-600 hover:bg-cyan-700' },
    { key: 'toon', label: 'Toon', color: 'bg-pink-600 hover:bg-pink-700' },
    { key: 'flip', label: 'Flip', color: 'bg-amber-600 hover:bg-amber-700' },
    { key: 'gemini', label: 'Gemini', color: 'bg-violet-600 hover:bg-violet-700' }
  ];

  const spellSubtypes = ['Normal', 'Quick-Play', 'Continuous', 'Ritual', 'Equip', 'Field'];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-gradient-to-b from-purple-400 to-blue-400 rounded-full"></div>
          <h3 className="text-lg font-semibold text-white">Card Filters</h3>
        </div>
        <button
          onClick={onClearFilters}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
        >
          Clear All
        </button>
      </div>

      {/* Format-Specific Filter */}
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
        <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          {currentBanlist === 'TCG Genesys' ? 'Genesys Points' : 'Banlist Status'}
        </h4>

        <div className="flex items-center gap-2">
          {changeBanlistComponent}
          {currentBanlist === 'TCG Genesys' ? (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onFilterChange('pointsFilter', 'has-points')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${filters.pointsFilter === 'has-points'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
              >
                Cards with Points
              </button>

              <select
                value={filters.pointsFilter === 'has-points' ? '' : filters.pointsFilter}
                onChange={(e) => onFilterChange('pointsFilter', e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              >
                <option value="">All Points</option>
                {filterOptions.genesysPoints.map(points => (
                  <option key={points} value={points.toString()}>
                    {points} Point{points !== 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <select
              value={filters.limitation}
              onChange={(e) => onFilterChange('limitation', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
            >
              <option value="">All Cards</option>
              <option value="unlimited">Unlimited</option>
              <option value="forbidden">Forbidden</option>
              <option value="limited">Limited</option>
              <option value="semi-limited">Semi-Limited</option>
            </select>
          )}
        </div>
      </div>

      {/* Card Type Selection */}
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
        <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
          Card Type
        </h4>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onQuickFilter('monsters')}
            className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 border-2 ${filters.frameType === 'monster'
              ? 'bg-yellow-500 border-yellow-400 text-white shadow-lg shadow-yellow-500/25'
              : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500'
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span>Monsters</span>
            </div>
          </button>

          <button
            onClick={() => onQuickFilter('spells')}
            className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 border-2 ${filters.frameType === 'spell'
              ? 'bg-green-500 border-green-400 text-white shadow-lg shadow-green-500/25'
              : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500'
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span>Spells</span>
            </div>
          </button>

          <button
            onClick={() => onQuickFilter('traps')}
            className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 border-2 ${filters.frameType === 'trap'
              ? 'bg-pink-500 border-pink-400 text-white shadow-lg shadow-pink-500/25'
              : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500'
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span>Traps</span>
            </div>
          </button>

          <button
            onClick={() => onQuickFilter('extra-deck')}
            className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 border-2 ${filters.type === 'extra-deck-special'
              ? 'bg-purple-500 border-purple-400 text-white shadow-lg shadow-purple-500/25'
              : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500'
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span>Extra Deck</span>
            </div>
          </button>
        </div>
      </div>

      {/* Monster Filters */}
      {filters.frameType === 'monster' && (
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 space-y-4">
          <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
            Monster Filters
          </h4>

          {/* Monster Types */}
          <div className="grid grid-cols-3 gap-2">
            {monsterTypeButtons.map(({ key, label, color }) => (
              <button
                key={key}
                onClick={() => onToggleMonsterType(key)}
                className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${filters.monsterTypes.includes(key)
                  ? `${color} border-white/30 shadow-md`
                  : `${color.replace('hover:', '')} opacity-60 hover:opacity-80 border-transparent`
                  }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Basic Properties */}
          <div>
            <div className="text-xs text-gray-400 mb-2">Basic Properties</div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <select
                value={filters.attribute}
                onChange={(e) => onFilterChange('attribute', e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              >
                <option value="">All Attributes</option>
                {filterOptions.attributes.map(attribute => (
                  <option key={attribute} value={attribute}>{attribute}</option>
                ))}
              </select>

              <select
                value={filters.race}
                onChange={(e) => onFilterChange('race', e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              >
                <option value="">All Races</option>
                {filterOptions.races.map(race => (
                  <option key={race} value={race}>{race}</option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Level (1-13)"
                value={filters.level || ''}
                onChange={(e) => onFilterChange('level', e.target.value ? parseInt(e.target.value) : null)}
                min="1"
                max="13"
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />

              <input
                type="number"
                placeholder="Link Rating"
                value={filters.linkval || ''}
                onChange={(e) => onFilterChange('linkval', e.target.value ? parseInt(e.target.value) : null)}
                min="1"
                max="13"
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />

              {currentBanlist !== 'TCG Genesys' && (
                <>
                  <input
                    type="number"
                    placeholder="Pendulum Scale (0-13)"
                    value={filters.pendulumScale || ''}
                    onChange={(e) => onFilterChange('pendulumScale', e.target.value ? parseInt(e.target.value) : null)}
                    min="0"
                    max="13"
                    className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                  />

                  <input
                    type="number"
                    placeholder="Link Rating (1-6)"
                    value={filters.linkval || ''}
                    onChange={(e) => onFilterChange('linkval', e.target.value ? parseInt(e.target.value) : null)}
                    min="1"
                    max="6"
                    className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />
                </>
              )}
            </div>
          </div>

          {/* ATK/DEF Range */}
          <div>
            <div className="text-xs text-gray-400 mb-2">ATK/DEF Range</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="text-xs text-yellow-400 font-medium">ATK</div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.atkMin || ''}
                    onChange={(e) => onFilterChange('atkMin', e.target.value ? parseInt(e.target.value) : null)}
                    min="0"
                    max="5000"
                    step="100"
                    className="px-3 py-2 bg-yellow-900/20 border border-yellow-600/50 rounded-lg text-yellow-100 placeholder-yellow-400/70 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.atkMax || ''}
                    onChange={(e) => onFilterChange('atkMax', e.target.value ? parseInt(e.target.value) : null)}
                    min="0"
                    max="5000"
                    step="100"
                    className="px-3 py-2 bg-yellow-900/20 border border-yellow-600/50 rounded-lg text-yellow-100 placeholder-yellow-400/70 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs text-blue-400 font-medium">DEF</div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.defMin || ''}
                    onChange={(e) => onFilterChange('defMin', e.target.value ? parseInt(e.target.value) : null)}
                    min="0"
                    max="5000"
                    step="100"
                    className="px-3 py-2 bg-blue-900/20 border border-blue-600/50 rounded-lg text-blue-100 placeholder-blue-400/70 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.defMax || ''}
                    onChange={(e) => onFilterChange('defMax', e.target.value ? parseInt(e.target.value) : null)}
                    min="0"
                    max="5000"
                    step="100"
                    className="px-3 py-2 bg-blue-900/20 border border-blue-600/50 rounded-lg text-blue-100 placeholder-blue-400/70 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spell Subtypes */}
      {filters.frameType === 'spell' && (
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
            <span className="text-lg">✨</span>
            Spell Subtypes
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {spellSubtypes.map(subtype => (
              <button
                key={subtype}
                onClick={() => onFilterChange('spellSubtype', filters.spellSubtype === subtype ? '' : subtype)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border-2 ${filters.spellSubtype === subtype
                  ? 'bg-green-500 border-green-400 text-white shadow-lg shadow-green-500/25'
                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500'
                  }`}
              >
                {subtype === 'Quick-Play' ? (
                  <>
                    <span className="lg:hidden">Quick</span>
                    <span className="hidden lg:inline">Quick-Play</span>
                  </>
                ) : subtype === 'Continuous' ? (
                  <>
                    <span className="lg:hidden">Cont.</span>
                    <span className="hidden lg:inline">Continuous</span>
                  </>
                ) : (
                  subtype
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Trap Subtypes */}
      {filters.frameType === 'trap' && (
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
            <span className="text-lg">🪤</span>
            Trap Subtypes
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {['Normal', 'Continuous', 'Counter'].map(subtype => (
              <button
                key={subtype}
                onClick={() => onFilterChange('race', filters.race === subtype ? '' : subtype)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border-2 ${filters.race === subtype
                  ? 'bg-pink-500 border-pink-400 text-white shadow-lg shadow-pink-500/25'
                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500'
                  }`}
              >
                {subtype === 'Continuous' ? (
                  <>
                    <span className="lg:hidden">Cont.</span>
                    <span className="hidden lg:inline">Continuous</span>
                  </>
                ) : (
                  subtype
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sort Options */}
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
        <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h4a1 1 0 110 2H4a1 1 0 01-1-1z" />
          </svg>
          Sort Options
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange('sortBy', e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
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
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
          >
            <option value="asc">A-Z / Low-High</option>
            <option value="desc">Z-A / High-Low</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default CardFiltersComponent;
