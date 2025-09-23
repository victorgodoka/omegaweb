import { useState, useMemo, useCallback } from 'react';
import type { Card } from '../types';
import { getCardGenesysPoints } from '@/utils/Genesys';

export interface CardFilters {
  search: string;
  frameType: string; // 'monster', 'spell', 'trap'
  type: string;
  attribute: string;
  race: string;
  level: number | null;
  pendulumScale: number | null;
  linkRating: number | null;
  pointsFilter: string;
  sortBy: 'name' | 'type' | 'level' | 'atk' | 'def' | 'points';
  sortOrder: 'asc' | 'desc';
}

// Helper function to determine if a card is a monster
const isMonsterCard = (card: Card): boolean => {
  return card.frameType === 'normal' || 
         card.frameType === 'effect' || 
         card.frameType === 'ritual' || 
         card.frameType === 'fusion' || 
         card.frameType === 'synchro' || 
         card.frameType === 'xyz' || 
         card.frameType === 'pendulum' || 
         card.frameType === 'link' ||
         card.type.includes('Monster');
};

export const useCardSearch = (cards: Card[], currentBanlist: 'TCG' | 'OCG' | 'TCG Genesys') => {
  const [filters, setFilters] = useState<CardFilters>({
    search: '',
    frameType: '',
    type: '',
    attribute: '',
    race: '',
    level: null,
    pendulumScale: null,
    linkRating: null,
    pointsFilter: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });

  // Get unique filter options from cards
  const filterOptions = useMemo(() => {
    const types = new Set<string>();
    const attributes = new Set<string>();
    const races = new Set<string>();
    const levels = new Set<number>();
    const genesysPoints = new Set<number>();

    cards.forEach(card => {
      types.add(card.type);
      
      // Only add monster-specific attributes if it's a monster
      if (isMonsterCard(card)) {
        if (card.attribute) attributes.add(card.attribute);
        if (card.level !== undefined) levels.add(card.level);
      }
      
      races.add(card.race);
      
      // Get Genesys points for this card
      if (currentBanlist === 'TCG Genesys') {
        const points = getCardGenesysPoints(card.name);
        if (points > 0) {
          genesysPoints.add(points);
        }
      }
    });

    return {
      types: Array.from(types).sort(),
      attributes: Array.from(attributes).sort(),
      races: Array.from(races).sort(),
      levels: Array.from(levels).sort((a, b) => a - b),
      genesysPoints: Array.from(genesysPoints).sort((a, b) => a - b)
    };
  }, [cards, currentBanlist]);

  // Filter and sort cards
  const filteredCards = useMemo(() => {
    let filtered = cards.filter(card => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesName = card.name.toLowerCase().includes(searchLower);
        const matchesDesc = card.desc.toLowerCase().includes(searchLower);
        const matchesHumanReadableType = card.humanReadableCardType.toLowerCase().includes(searchLower);
        
        // For extra deck search, use regex pattern matching
        if (filters.search.includes('|')) {
          const searchPattern = new RegExp(filters.search, 'i');
          const matchesPattern = searchPattern.test(card.humanReadableCardType) || 
                                searchPattern.test(card.name) || 
                                searchPattern.test(card.desc);
          if (!matchesPattern) return false;
        } else {
          if (!matchesName && !matchesDesc && !matchesHumanReadableType) return false;
        }
      }

      // Type filter
      if (filters.type) {
        if (filters.type === 'extra-deck-special') {
          // Special handling for extra deck cards
          const isExtraDeck = card.humanReadableCardType.includes('Fusion') ||
                             card.humanReadableCardType.includes('Synchro') ||
                             card.humanReadableCardType.includes('Xyz') ||
                             card.humanReadableCardType.includes('Link');
          if (!isExtraDeck) return false;
        } else {
          if (!card.type.includes(filters.type)) return false;
        }
      }

      // Attribute filter
      if (filters.attribute && card.attribute !== filters.attribute) return false;

      // Race filter
      if (filters.race && card.race !== filters.race) return false;

      // FrameType filter
      if (filters.frameType) {
        if (filters.frameType === 'monster') {
          // For monsters, use helper function
          if (!isMonsterCard(card)) return false;
        } else {
          // For spells and traps, direct match
          if (card.frameType !== filters.frameType) return false;
        }
      }

      // Level filter
      if (filters.level !== null && card.level !== filters.level) return false;

      // Pendulum scale filter
      if (filters.pendulumScale !== null && card.scale !== filters.pendulumScale) return false;

      // Link rating filter
      if (filters.linkRating !== null && card.linkval !== filters.linkRating) return false;

      // TCG Genesys format restrictions
      if (currentBanlist === 'TCG Genesys') {
        // Filter out Link and Pendulum cards in Genesys format
        const isLinkCard = card.frameType === 'link' || card.type.includes('Link');
        const isPendulumCard = card.frameType === 'pendulum' || card.type.includes('Pendulum');
        
        if (isLinkCard || isPendulumCard) {
          return false; // Don't show these cards in Genesys format
        }

        // Genesys points filter
        if (filters.pointsFilter) {
          const cardPoints = getCardGenesysPoints(card.name);
          
          if (filters.pointsFilter === 'has-points') {
            // Show only cards that have points (greater than 0)
            if (cardPoints === 0) return false;
          } else {
            // Filter by specific point value
            const targetPoints = parseInt(filters.pointsFilter);
            if (cardPoints !== targetPoints) return false;
          }
        }
      }

      return true;
    });

    // Sort cards
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'level':
          comparison = (a.level || 0) - (b.level || 0);
          break;
        case 'atk':
          comparison = (a.atk || 0) - (b.atk || 0);
          break;
        case 'def':
          comparison = (a.def || 0) - (b.def || 0);
          break;
        case 'points':
          if (currentBanlist === 'TCG Genesys') {
            const aPoints = getCardGenesysPoints(a.name);
            const bPoints = getCardGenesysPoints(b.name);
            comparison = aPoints - bPoints;
          }
          break;
      }

      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [cards, filters, currentBanlist]);

  // Update individual filter
  const updateFilter = useCallback((key: keyof CardFilters, value: string | number | null) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);
  // Filter for extra deck cards based on humanReadableCardType
  const searchForExtraDeck = useCallback(() => {
    // Instead of using search pattern, use a special filter approach
    setFilters(prev => ({
      ...prev,
      type: 'extra-deck-special', // Special marker for extra deck filtering
      search: '' // Clear search to avoid conflicts
    }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      frameType: '',
      type: '',
      attribute: '',
      race: '',
      level: null,
      pendulumScale: null,
      linkRating: null,
      pointsFilter: '',
      sortBy: 'name',
      sortOrder: 'asc'
    });
  }, []);

  // Quick filter presets
  const applyQuickFilter = useCallback((preset: string) => {
    switch (preset) {
      case 'monsters':
        // Reset all filters and set to monsters
        setFilters({
          search: '',
          frameType: 'monster',
          type: '',
          attribute: '',
          race: '',
          level: null,
          pendulumScale: null,
          linkRating: null,
          pointsFilter: '',
          sortBy: 'name',
          sortOrder: 'asc'
        });
        break;
      case 'spells':
        // Reset all filters and set to spells
        setFilters({
          search: '',
          frameType: 'spell',
          type: '',
          attribute: '',
          race: '',
          level: null,
          pendulumScale: null,
          linkRating: null,
          pointsFilter: '',
          sortBy: 'name',
          sortOrder: 'asc'
        });
        break;
      case 'traps':
        // Reset all filters and set to traps
        setFilters({
          search: '',
          frameType: 'trap',
          type: '',
          attribute: '',
          race: '',
          level: null,
          pendulumScale: null,
          linkRating: null,
          pointsFilter: '',
          sortBy: 'name',
          sortOrder: 'asc'
        });
        break;
      case 'extra-deck':
        searchForExtraDeck();
        break;
      default:
        clearFilters();
    }
  }, [clearFilters, searchForExtraDeck]);

  return {
    filters,
    filteredCards,
    filterOptions,
    updateFilter,
    setFilters,
    clearFilters,
    applyQuickFilter
  };
};
