import { useState, useMemo, useCallback } from 'react';
import type { Card } from '../types';
import { useGenesys } from '@/contexts/GenesysContext';

export interface CardFilters {
  search: string;
  frameType: string; // 'monster', 'spell', 'trap'
  type: string;
  attribute: string;
  race: string;
  level: number | null;
  pendulumScale: number | null;
  linkval: number | null;
  // New ATK/DEF filters
  atkMin: number | null;
  atkMax: number | null;
  defMin: number | null;
  defMax: number | null;
  // Card limitations filter
  limitation: string; // 'forbidden', 'limited', 'semi-limited', ''
  // Monster type filters (can be combined)
  monsterTypes: string[]; // ['fusion', 'synchro', 'xyz', 'link', 'effect', 'normal', 'ritual', 'tuner', 'union', 'spirit', 'toon']
  // Spell subtype filter
  spellSubtype: string;
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

// Helper function to get banlist status of a card
const getBanlistStatus = (card: Card, banlist: 'TCG' | 'OCG' | 'TCG Genesys'): string => {
  if (banlist === 'TCG Genesys') return 'unlimited';

  const banlistInfo = card.banlist_info;
  if (!banlistInfo) return 'unlimited';

  const statusKey = `ban_${banlist.toLowerCase()}` as keyof typeof banlistInfo;
  const status = banlistInfo[statusKey];

  switch (status) {
    case 'Forbidden': return 'forbidden';
    case 'Limited': return 'limited';
    case 'Semi-Limited': return 'semi-limited';
    default: return 'unlimited';
  }
};

// Helper function to check if a card matches monster type filters (AND operation)
const matchesMonsterTypes = (card: Card, monsterTypes: string[]): boolean => {
  if (monsterTypes.length === 0) return true;

  const humanReadableType = card.humanReadableCardType.toLowerCase();

  // All selected monster types must be present (AND operation)
  return monsterTypes.every(type => {
    switch (type) {
      case 'effect': 
        return humanReadableType.includes('effect');
      case 'normal': 
        return humanReadableType.includes('normal');
      case 'fusion': 
        return humanReadableType.includes('fusion');
      case 'synchro': 
        return humanReadableType.includes('synchro');
      case 'xyz': 
        return humanReadableType.includes('xyz');
      case 'link': 
        return humanReadableType.includes('link');
      case 'ritual': 
        return humanReadableType.includes('ritual');
      case 'tuner': 
        return humanReadableType.includes('tuner');
      case 'union': 
        return humanReadableType.includes('union');
      case 'spirit': 
        return humanReadableType.includes('spirit');
      case 'toon': 
        return humanReadableType.includes('toon');
      case 'pendulum':
        return humanReadableType.includes('pendulum');
      case 'flip':
        return humanReadableType.includes('flip');
      case 'gemini':
        return humanReadableType.includes('gemini');
      default: return false;
    }
  });
};

export const useCardSearch = (cards: Card[], currentBanlist: 'TCG' | 'OCG' | 'TCG Genesys') => {
  const { genesysData } = useGenesys();
  
  // Create a memoized card name to ID mapping for better performance
  const cardNameToIdMap = useMemo(() => {
    const map = new Map<string, number>();
    cards.forEach(card => {
      map.set(card.name.toLowerCase(), card.id);
    });
    return map;
  }, [cards]);

  // Optimized helper function to get Genesys points for a card - only when banlist is TCG Genesys
  const getCardGenesysPoints = useCallback((cardName: string): number => {
    if (currentBanlist !== 'TCG Genesys') return 0; // Early return for non-Genesys formats
    const cardId = cardNameToIdMap.get(cardName.toLowerCase());
    if (!cardId) return 0;
    return genesysData[cardId] || 0;
  }, [genesysData, cardNameToIdMap, currentBanlist]);

  const [filters, setFilters] = useState<CardFilters>({
    search: '',
    frameType: '',
    type: '',
    attribute: '',
    race: '',
    level: null,
    pendulumScale: null,
    linkval: null,
    atkMin: null,
    atkMax: null,
    defMin: null,
    defMax: null,
    limitation: '',
    monsterTypes: [],
    spellSubtype: '',
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
        
        // Only add monster races (filter out spell/trap types)
        if (card.race && !['Normal', 'Quick-Play', 'Continuous', 'Ritual', 'Equip', 'Counter'].includes(card.race)) {
          races.add(card.race);
        }
      }
      
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

      // Race filter with special handling for Normal and Ritual monsters
      if (filters.race) {
        if (filters.race === 'Normal' && filters.frameType === 'monster') {
          // For Normal monsters, check if it's a Normal Monster (not Effect)
          if (!card.type.includes('Normal Monster')) return false;
        } else if (filters.race === 'Ritual' && filters.frameType === 'monster') {
          // For Ritual monsters, check if it's a Ritual Monster
          if (!card.type.includes('Ritual Monster')) return false;
        } else {
          // Standard race filtering
          if (card.race !== filters.race) return false;
        }
      }

      // FrameType filter with conflict prevention
      if (filters.frameType) {
        if (filters.frameType === 'monster') {
          // For monsters, use helper function
          if (!isMonsterCard(card)) return false;
          // Prevent extra deck + monster conflict
          if (filters.type === 'extra-deck-special') {
            const isExtraDeck = card.humanReadableCardType.includes('Fusion') ||
                               card.humanReadableCardType.includes('Synchro') ||
                               card.humanReadableCardType.includes('Xyz') ||
                               card.humanReadableCardType.includes('Link');
            if (!isExtraDeck) return false;
          }
        } else {
          // For spells and traps, direct match
          if (card.frameType !== filters.frameType) return false;
          // Prevent extra deck + spell/trap conflict
          if (filters.type === 'extra-deck-special') {
            return false; // Spells/traps can't be extra deck
          }
        }
      }

      // Level filter
      if (filters.level !== null && card.level !== filters.level) return false;

      // Pendulum scale filter
      if (filters.pendulumScale !== null && card.scale !== filters.pendulumScale) return false;

      // Link rating filter
      if (filters.linkval !== null && card.linkval !== filters.linkval) return false;

      // ATK filters (only for monsters with ATK values)
      if (filters.atkMin !== null && isMonsterCard(card)) {
        const cardAtk = card.atk || 0;
        if (cardAtk < filters.atkMin) return false;
      }
      if (filters.atkMax !== null && isMonsterCard(card)) {
        const cardAtk = card.atk || 0;
        if (cardAtk > filters.atkMax) return false;
      }

      // DEF filters (only for monsters with DEF values, excluding Link monsters)
      if (filters.defMin !== null && isMonsterCard(card) && card.frameType !== 'link') {
        const cardDef = card.def || 0;
        if (cardDef < filters.defMin) return false;
      }
      if (filters.defMax !== null && isMonsterCard(card) && card.frameType !== 'link') {
        const cardDef = card.def || 0;
        if (cardDef > filters.defMax) return false;
      }

      // Limitation filter (based on banlist status) - Skip for Genesys
      if (filters.limitation && currentBanlist !== 'TCG Genesys') {
        const cardBanlistStatus = getBanlistStatus(card, currentBanlist);
        if (cardBanlistStatus !== filters.limitation) return false;
      }

      // Monster type filters (can be combined)
      if (filters.monsterTypes.length > 0 && isMonsterCard(card)) {
        if (!matchesMonsterTypes(card, filters.monsterTypes)) return false;
      }

      // Spell subtype filter
      if (filters.spellSubtype && card.frameType === 'spell') {
        if (card.race !== filters.spellSubtype) return false;
      }

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
      linkval: null,
      atkMin: null,
      atkMax: null,
      defMin: null,
      defMax: null,
      limitation: '',
      monsterTypes: [],
      spellSubtype: '',
      pointsFilter: '',
      sortBy: 'name',
      sortOrder: 'asc'
    });
  }, []);

  // Quick filter presets - preserve search text
  const applyQuickFilter = useCallback((preset: string) => {
    setFilters(prev => {
      const baseFilters = {
        search: prev.search, // Preserve search text
        frameType: '',
        type: '',
        attribute: '',
        race: '',
        level: null,
        pendulumScale: null,
        linkval: null,
        atkMin: null,
        atkMax: null,
        defMin: null,
        defMax: null,
        limitation: prev.limitation, // Preserve limitation filter
        monsterTypes: [],
        spellSubtype: '',
        pointsFilter: prev.pointsFilter, // Preserve points filter
        sortBy: prev.sortBy,
        sortOrder: prev.sortOrder
      };

      switch (preset) {
        case 'monsters':
          return {
            ...baseFilters,
            frameType: 'monster'
          };
        case 'spells':
          return {
            ...baseFilters,
            frameType: 'spell'
          };
        case 'traps':
          return {
            ...baseFilters,
            frameType: 'trap'
          };
        case 'extra-deck':
          return {
            ...baseFilters,
            type: 'extra-deck-special'
          };
        default:
          return baseFilters;
      }
    });
  }, []);

  // Helper function to toggle monster type filters
  const toggleMonsterType = useCallback((monsterType: string) => {
    setFilters(prev => ({
      ...prev,
      monsterTypes: prev.monsterTypes.includes(monsterType)
        ? prev.monsterTypes.filter(type => type !== monsterType)
        : [...prev.monsterTypes, monsterType]
    }));
  }, []);

  return {
    filters,
    filteredCards,
    filterOptions,
    updateFilter,
    setFilters,
    clearFilters,
    applyQuickFilter,
    toggleMonsterType
  };
};
