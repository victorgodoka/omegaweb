import React, { useState, useMemo, useCallback } from 'react';
import { Icon } from '@iconify/react';
import type { CardSelectorProps, CardGroup } from '../types';
import type { Cards } from '../../PDFGenerator/types';
import { useTranslation } from 'react-i18next';

const CardSelector: React.FC<CardSelectorProps> = ({
  cards,
  targetCards,
  onAddTargetGroup,
  onRemoveTargetGroup,
  onUpdateTargetGroup
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [minDesiredCount, setMinDesiredCount] = useState(1);
  const [maxDesiredCount, setMaxDesiredCount] = useState(1);
  const [selectedSearchers, setSelectedSearchers] = useState<string[]>([]);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [editingGroupIndex, setEditingGroupIndex] = useState<number | null>(null);

  // Note: target selection uses unique monster rows with quantity controls (no per-instance list needed)

  // Get unique cards for reference (used for calculations)
  const uniqueCards = useMemo(() => {
    const uniqueMap = new Map<number, Cards & { location: 'main' | 'extra' | 'side' }>();
    cards.forEach(card => {
      if (!uniqueMap.has(card.id)) {
        uniqueMap.set(card.id, card);
      }
    });
    return Array.from(uniqueMap.values());
  }, [cards]);

  // Helper: is monster (main-deck) card
  const isMonster = useCallback((card: Cards) => !card.isSpell && !card.isTrap, []);

  // Handle searcher card selection for current group (by instance ID)
  const toggleSearcherSelection = (instanceId: string) => {
    setSelectedSearchers(prev => 
      prev.includes(instanceId)
        ? prev.filter(id => id !== instanceId)
        : [...prev, instanceId]
    );
  };

  // Get all cards that are currently selected as targets across all groups
  const allTargetCards = useMemo(() => {
    const targetCardIds = new Set<number>();
    targetCards.forEach(group => {
      group.cards.forEach(cardId => targetCardIds.add(parseInt(cardId.split('-')[0])));
    });
    // Don't include cards from the group being edited
    if (editingGroupIndex !== null) {
      targetCards[editingGroupIndex].cards.forEach(cardId => targetCardIds.delete(parseInt(cardId.split('-')[0])));
    }
    return targetCardIds;
  }, [targetCards, editingGroupIndex]);

  // Check if card is already in a target group (excluding the one being edited)
  const isCardInTargetGroup = useCallback((cardId: number) => {
    return allTargetCards.has(cardId);
  }, [allTargetCards]);

  // Check if card can be selected as searcher (not in any target group)
  const canBeSearcher = useCallback((cardId: number) => {
    // Can't be searcher if any instance is selected as target in current form
    const hasSelectedTarget = selectedCards.some(instanceId => {
      const selectedCardId = parseInt(instanceId.split('-')[0]);
      return selectedCardId === cardId;
    });
    if (hasSelectedTarget) return false;
    
    // Can't be searcher if it's already a target in any existing group (excluding the one being edited)
    return !isCardInTargetGroup(cardId);
  }, [selectedCards, isCardInTargetGroup]);

  // Get individual searcher card instances
  const individualSearcherCards = useMemo(() => {
    const searcherInstances: (Cards & { location: 'main' | 'extra' | 'side'; instanceId: string })[] = [];
    uniqueCards.forEach(card => {
      for (let i = 0; i < card.qtd; i++) {
        searcherInstances.push({
          ...card,
          instanceId: `${card.id}-${i}`
        });
      }
    });
    return searcherInstances;
  }, [uniqueCards]);

  // Filter individual searcher cards for display
  const filteredSearcherCards = useMemo(() => {
    const filtered = individualSearcherCards.filter(card => {
      const cardId = parseInt(card.instanceId.split('-')[0]);
      return canBeSearcher(cardId) && (
        card.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.id.toString().includes(searchTerm)
      );
    });
    
    return filtered.sort((a, b) => {
      const nameA = a.name || `Card ${a.id}`;
      const nameB = b.name || `Card ${b.id}`;
      return nameA.localeCompare(nameB);
    });
  }, [individualSearcherCards, searchTerm, canBeSearcher]);

  // Check if a searcher instance is available (not used in other groups)
  const isSearcherInstanceAvailable = (instanceId: string) => {
    const cardId = parseInt(instanceId.split('-')[0]);
    const instanceIndex = parseInt(instanceId.split('-')[1]);
    
    // Count how many copies of this card are used as searchers in other groups
    let usedAsSearcherCount = 0;
    targetCards.forEach((group, groupIndex) => {
      if (editingGroupIndex !== null && groupIndex === editingGroupIndex) return;
      usedAsSearcherCount += group.searcherCards.filter(id => {
        const searcherCardId = parseInt(id.split('-')[0]);
        return searcherCardId === cardId;
      }).length;
    });
    
    // Also count how many copies are used as targets
    const usedAsTargetCount = getUsedCopiesCount(cardId);
    
    return instanceIndex >= (usedAsSearcherCount + usedAsTargetCount);
  };

  // Add new target group
  const handleAddGroup = () => {
    if (groupName.trim() && selectedCards.length > 0) {
      const newGroup: CardGroup = {
        name: groupName.trim(),
        cards: [...selectedCards],
        minDesiredCount: Math.min(minDesiredCount, selectedCards.length),
        maxDesiredCount: Math.min(maxDesiredCount, selectedCards.length),
        searcherCards: [...selectedSearchers]
      };
      
      onAddTargetGroup(newGroup);
      
      // Reset form
      setGroupName('');
      setSelectedCards([]);
      setSelectedSearchers([]);
      setMinDesiredCount(1);
      setMaxDesiredCount(1);
      setShowAddGroup(false);
    }
  };

  // Update existing target group
  const handleUpdateGroup = () => {
    if (editingGroupIndex !== null && groupName.trim() && selectedCards.length > 0) {
      const updatedGroup: CardGroup = {
        name: groupName.trim(),
        cards: [...selectedCards],
        minDesiredCount: Math.min(minDesiredCount, selectedCards.length),
        maxDesiredCount: Math.min(maxDesiredCount, selectedCards.length),
        searcherCards: [...selectedSearchers]
      };
      
      onUpdateTargetGroup(editingGroupIndex, updatedGroup);
      
      // Reset form
      const resetForm = () => {
        setGroupName('');
        setSelectedCards([]);
        setSelectedSearchers([]);
        setMinDesiredCount(1);
        setMaxDesiredCount(1);
        setShowAddGroup(false);
        setEditingGroupIndex(null);
      };
      resetForm();
    }
  };

  // Edit existing group
  const editGroup = (index: number) => {
    const group = targetCards[index];
    setEditingGroupIndex(index);
    setGroupName(group.name);
    setSelectedCards([...group.cards]);
    setSelectedSearchers([...group.searcherCards]);
    setMinDesiredCount(group.minDesiredCount);
    setMaxDesiredCount(group.maxDesiredCount);
    setShowAddGroup(true);
  };

  // Get card display name
  const getCardName = (card: Cards) => {
    return card.name || `Card ${card.id}`;
  };

  // Unique monster cards only for target selection list
  const uniqueMonsterCards = useMemo(() => {
    return uniqueCards.filter(isMonster);
  }, [uniqueCards, isMonster]);

  // Filter and sort UNIQUE monster cards based on search term
  const filteredUniqueMonsterCards = useMemo(() => {
    const filtered = uniqueMonsterCards.filter(card => 
      (card.name || `Card ${card.id}`).toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.id.toString().includes(searchTerm)
    );
    return filtered.sort((a, b) => (getCardName(a)).localeCompare(getCardName(b)));
  }, [uniqueMonsterCards, searchTerm]);

  // Get how many copies of a card are already used in target groups
  const getUsedCopiesCount = (cardId: number) => {
    let usedCount = 0;
    targetCards.forEach((group, groupIndex) => {
      if (editingGroupIndex !== null && groupIndex === editingGroupIndex) return;
      usedCount += group.cards.filter(id => {
        const targetCardId = parseInt(id.split('-')[0]);
        return targetCardId === cardId;
      }).length;
    });
    return usedCount;
  };

  // Get how many copies of a card are already used across groups (targets + searchers), excluding the group being edited
  const getUsedOverallCopiesCount = (cardId: number) => {
    let used = 0;
    targetCards.forEach((group, groupIndex) => {
      if (editingGroupIndex !== null && groupIndex === editingGroupIndex) return;
      used += group.cards.filter(id => parseInt(id.split('-')[0]) === cardId).length;
      used += group.searcherCards.filter(id => parseInt(id.split('-')[0]) === cardId).length;
    });
    return used;
  };

  // Count selected instances for a given card id in the current form
  const getSelectedCountForId = (cardId: number) => {
    return selectedCards.filter(id => parseInt(id.split('-')[0]) === cardId).length;
  };

  // Find next available instance index for a given card id (not used elsewhere and not already selected)
  const findNextAvailableInstanceId = (cardId: number, maxQtd: number): string | null => {
    const taken = new Set<string>();
    // Instances used in other groups (targets + searchers)
    targetCards.forEach((group, groupIndex) => {
      if (editingGroupIndex !== null && groupIndex === editingGroupIndex) return;
      group.cards.forEach(inst => { if (parseInt(inst.split('-')[0]) === cardId) taken.add(inst); });
      group.searcherCards.forEach(inst => { if (parseInt(inst.split('-')[0]) === cardId) taken.add(inst); });
    });
    // Instances already selected in current form
    selectedCards.forEach(inst => { if (parseInt(inst.split('-')[0]) === cardId) taken.add(inst); });
    for (let i = 0; i < maxQtd; i++) {
      const candidate = `${cardId}-${i}`;
      if (!taken.has(candidate)) return candidate;
    }
    return null;
  };

  const addOneCopy = (card: Cards) => {
    const instanceId = findNextAvailableInstanceId(card.id, card.qtd);
    if (instanceId) {
      setSelectedCards(prev => [...prev, instanceId]);
    }
  };

  const removeOneCopy = (card: Cards) => {
    // Remove the highest-index selected instance for this card id (LIFO)
    const indices = selectedCards
      .filter(id => parseInt(id.split('-')[0]) === card.id)
      .map(id => parseInt(id.split('-')[1]))
      .sort((a, b) => b - a);
    if (indices.length > 0) {
      const toRemove = `${card.id}-${indices[0]}`;
      setSelectedCards(prev => prev.filter(id => id !== toRemove));
    }
  };

  // Per-instance availability checks are not needed for the unique list UI



  // Get card image URL
  const getCardImageUrl = (cardId: number) => {
    return `https://images.ygoprodeck.com/images/cards/${cardId}.jpg`;
  };

  return (
    <div className="space-y-6">
      {/* Target Card Groups */}
      <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-zinc-200 flex items-center gap-2">
            <Icon icon="mdi:target" className="text-blue-400" />
            {t('calculator.selector.heading')}
          </h2>
          <button
            onClick={() => setShowAddGroup(!showAddGroup)}
            className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex items-center gap-1"
          >
            <Icon icon="mdi:plus" />
            {t('calculator.selector.add_group')}
          </button>
        </div>

        {/* Existing Target Groups */}
        <div className="space-y-3 mb-4 grid grid-cols-1 lg:grid-cols-2 3xl:grid-cols-3 gap-4">
          {targetCards.map((group, index) => (
            <div key={index} className="bg-zinc-700 rounded-lg p-4 border border-zinc-600">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-zinc-200">{group.name}</h3>
                  <p className="text-sm text-zinc-400">
                    {t('calculator.selector.want_range', {
                      range: group.minDesiredCount === group.maxDesiredCount
                        ? `${group.minDesiredCount}`
                        : `${group.minDesiredCount}-${group.maxDesiredCount}`,
                      count: group.maxDesiredCount
                    })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => editGroup(index)}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Icon icon="mdi:pencil" />
                  </button>
                  <button
                    onClick={() => onRemoveTargetGroup(index)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Icon icon="mdi:close" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div>
                  <h4 className="text-xs font-medium text-zinc-400 mb-1">{t('calculator.selector.target_cards_label')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {group.cards.map(instanceId => {
                      const cardId = parseInt(instanceId.split('-')[0]);
                      const instanceIndex = parseInt(instanceId.split('-')[1]) + 1;
                      const card = uniqueCards.find(c => c.id === cardId);
                      if (!card) return null;
                      return (
                        <span
                          key={instanceId}
                          className="px-2 py-1 bg-blue-600 text-white text-xs rounded"
                        >
                          {getCardName(card)} #{instanceIndex}
                        </span>
                      );
                    })}
                  </div>
                </div>
                
                {group.searcherCards.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-zinc-400 mb-1">{t('calculator.selector.searchers_label')}</h4>
                    <div className="flex flex-wrap gap-2">
                      {group.searcherCards.map(instanceId => {
                        const cardId = parseInt(instanceId.split('-')[0]);
                        const instanceIndex = parseInt(instanceId.split('-')[1]) + 1;
                        const card = uniqueCards.find(c => c.id === cardId);
                        if (!card) return null;
                        return (
                          <span
                            key={instanceId}
                            className="px-2 py-1 bg-orange-600 text-white text-xs rounded"
                          >
                            {getCardName(card)} #{instanceIndex}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 3xl:grid-cols-3 gap-4">
          {/* Add New Group Form */}
        {showAddGroup && (
          <div className="bg-zinc-700 rounded-lg p-4 border border-zinc-600 space-y-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  {t('calculator.selector.form.group_name')}
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder={t('calculator.selector.form.group_placeholder')}
                  className="w-full px-3 py-2 bg-zinc-600 border border-zinc-500 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    {t('calculator.selector.form.min_desired', { max: selectedCards.length })}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedCards.length}
                    value={minDesiredCount}
                    onChange={(e) => {
                      const value = Math.max(1, Math.min(parseInt(e.target.value) || 1, selectedCards.length));
                      setMinDesiredCount(value);
                      if (value > maxDesiredCount) setMaxDesiredCount(value);
                    }}
                    className="w-full px-3 py-2 bg-zinc-600 border border-zinc-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    {t('calculator.selector.form.max_desired', { max: selectedCards.length })}
                  </label>
                  <input
                    type="number"
                    min={minDesiredCount}
                    max={selectedCards.length}
                    value={maxDesiredCount}
                    onChange={(e) => {
                      const value = Math.max(minDesiredCount, Math.min(parseInt(e.target.value) || minDesiredCount, selectedCards.length));
                      setMaxDesiredCount(value);
                    }}
                    className="w-full px-3 py-2 bg-zinc-600 border border-zinc-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                {t('calculator.selector.form.search_label')}
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('calculator.selector.form.search_placeholder')}
                className="w-full px-3 py-2 bg-zinc-600 border border-zinc-500 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Card Selection List (unique monster cards with quantity controls) */}
            <div className="max-h-64 overflow-y-auto border border-zinc-600 rounded-lg">
              <div className="divide-y divide-zinc-600">
                {filteredUniqueMonsterCards.length === 0 ? (
                  <div className="p-4 text-center text-zinc-400">
                    {t('calculator.selector.list.no_cards')}
                  </div>
                ) : (
                  filteredUniqueMonsterCards.map(card => {
                    const selectedCount = getSelectedCountForId(card.id);
                    const usedOverall = getUsedOverallCopiesCount(card.id);
                    const remaining = Math.max(0, card.qtd - usedOverall - selectedCount);
                    const canAdd = remaining > 0;
                    const canRemove = selectedCount > 0;
                    return (
                      <div
                        key={card.id}
                        className={`flex items-center gap-3 p-3`}
                      >
                        {/* Card Image */}
                        <div className="w-12 h-16 bg-zinc-700 rounded overflow-hidden flex-shrink-0">
                          <img
                            src={getCardImageUrl(card.id)}
                            alt={getCardName(card)}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTkiIGhlaWdodD0iODYiIHZpZXdCb3g9IjAgMCA1OSA4NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjU5IiBoZWlnaHQ9Ijg2IiBmaWxsPSIjM0Y0MDQ2Ii8+CjxwYXRoIGQ9Ik0yOS41IDQzTDI5LjUgNDNaIiBzdHJva2U9IiM2QjcyODAiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K';
                            }}
                          />
                        </div>

                        {/* Card Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-zinc-200 truncate">
                              {getCardName(card)}
                            </span>
                            <span className="text-xs bg-zinc-600 text-zinc-300 px-2 py-1 rounded-full flex-shrink-0">
                              x{card.qtd}
                            </span>
                          </div>
                          <div className="text-sm text-zinc-400 mt-1">
                            {t('calculator.selector.id_label')}: {card.id}
                          </div>
                        </div>

                        {/* Quantity controls */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => removeOneCopy(card)}
                            disabled={!canRemove}
                            className={`w-7 h-7 rounded-full flex items-center justify-center border ${canRemove ? 'border-zinc-500 text-zinc-200 hover:bg-zinc-600/40' : 'border-zinc-700 text-zinc-600 cursor-not-allowed'}`}
                            title={t('calculator.selector.buttons.remove')}
                          >
                            <Icon icon="mdi:minus" />
                          </button>
                          <span className="text-sm text-zinc-300 w-10 text-center">
                            {selectedCount}
                          </span>
                          <button
                            type="button"
                            onClick={() => addOneCopy(card)}
                            disabled={!canAdd}
                            className={`w-7 h-7 rounded-full flex items-center justify-center border ${canAdd ? 'border-zinc-500 text-zinc-200 hover:bg-zinc-600/40' : 'border-zinc-700 text-zinc-600 cursor-not-allowed'}`}
                            title={t('calculator.selector.buttons.add')}
                          >
                            <Icon icon="mdi:plus" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Searcher Cards Section */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                {t('calculator.selector.searchers.title')}
              </label>
              <p className="text-xs text-zinc-400 mb-3">
                {t('calculator.selector.searchers.subtitle')}
              </p>
              
              <div className="max-h-48 overflow-y-auto border border-zinc-600 rounded-lg">
                <div className="divide-y divide-zinc-600">
                  {filteredSearcherCards.length === 0 ? (
                    <div className="p-4 text-center text-zinc-400 text-sm">
                      {t('calculator.selector.searchers.none_available')}
                      <div className="text-xs mt-1">{t('calculator.selector.searchers.targets_cannot_be_searchers')}</div>
                    </div>
                  ) : (
                    filteredSearcherCards.map(card => {
                      const isSelected = selectedSearchers.includes(card.instanceId);
                      const isAvailable = isSearcherInstanceAvailable(card.instanceId);
                      const instanceIndex = parseInt(card.instanceId.split('-')[1]) + 1;
                      
                      return (
                        <div
                          key={card.instanceId}
                          className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-orange-600/20 border-l-4 border-l-orange-500'
                              : !isAvailable
                              ? 'opacity-50 cursor-not-allowed bg-zinc-800/50'
                              : 'hover:bg-zinc-700/50'
                          }`}
                          onClick={() => isAvailable && toggleSearcherSelection(card.instanceId)}
                        >
                          {/* Card Image */}
                          <div className="w-12 h-16 bg-zinc-700 rounded overflow-hidden flex-shrink-0">
                            <img
                              src={getCardImageUrl(card.id)}
                              alt={getCardName(card)}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTkiIGhlaWdodD0iODYiIHZpZXdCb3g9IjAgMCA1OSA4NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjU5IiBoZWlnaHQ9Ijg2IiBmaWxsPSIjM0Y0MDQ2Ii8+CjxwYXRoIGQ9Ik0yOS41IDQzTDI5LjUgNDNaIiBzdHJva2U9IiM2QjcyODAiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K';
                              }}
                            />
                          </div>
                          
                          {/* Card Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-zinc-200 truncate">
                                {getCardName(card)}
                              </span>
                              <span className="text-xs bg-zinc-600 text-zinc-300 px-2 py-1 rounded-full flex-shrink-0">
                                {t('calculator.selector.copy_badge', { index: instanceIndex })}
                              </span>
                            </div>
                            <div className="text-sm text-zinc-400 mt-1">
                              {t('calculator.selector.id_label')}: {card.id}
                              {!isAvailable && (
                                <span className="text-red-400 ml-2">
                                  {t('calculator.selector.searchers.used_elsewhere')}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Selection Checkbox */}
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? 'bg-orange-500 border-orange-500'
                              : 'border-zinc-500'
                          }`}>
                            {isSelected && (
                              <Icon icon="mdi:check" className="text-white text-sm" />
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              
              {selectedSearchers.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedSearchers.map(instanceId => {
                    const cardId = parseInt(instanceId.split('-')[0]);
                    const card = uniqueCards.find(c => c.id === cardId);
                    if (!card) return null;
                    const instanceIndex = parseInt(instanceId.split('-')[1]) + 1;
                    return (
                      <span
                        key={instanceId}
                        className="px-2 py-1 bg-orange-600 text-white text-xs rounded-full flex items-center gap-1"
                      >
                        {getCardName(card)} {t('calculator.selector.searchers.chip_copy', { index: instanceIndex })}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSearcherSelection(instanceId);
                          }}
                          className="hover:text-orange-200"
                        >
                          <Icon icon="mdi:close" className="text-xs" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={editingGroupIndex !== null ? handleUpdateGroup : handleAddGroup}
                disabled={selectedCards.length === 0 || !groupName.trim() || minDesiredCount < 1 || maxDesiredCount < minDesiredCount}
                className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <Icon icon={editingGroupIndex !== null ? "mdi:content-save" : "mdi:plus"} />
                {editingGroupIndex !== null ? t('calculator.selector.buttons.update_group') : t('calculator.selector.buttons.add_group')}
              </button>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setGroupName('');
                  setSelectedCards([]);
                  setSelectedSearchers([]);
                  setMinDesiredCount(1);
                  setMaxDesiredCount(1);
                  setShowAddGroup(false);
                  setEditingGroupIndex(null);
                }}
                className="px-4 py-2 bg-zinc-600 text-white font-medium rounded-lg hover:bg-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 transition-colors"
              >
                {t('calculator.selector.buttons.cancel')}
              </button>
            </div>
          </div>
        )}
        </div>
      </div>


    </div>
  );
};

export default CardSelector;
