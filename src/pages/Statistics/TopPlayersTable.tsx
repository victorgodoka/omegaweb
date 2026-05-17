import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import type { TopPlayersData, TopPlayerDeck } from './types';

interface TopPlayersTableProps {
  data: TopPlayersData | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

const TopPlayersTable: React.FC<TopPlayersTableProps> = ({ data, loading, error, onRefresh }) => {
  const { t } = useTranslation();
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null);

  // Agrupar decks por arquétipo principal (primeiro arquétipo)
  const groupedByMainArchetype = useMemo(() => {
    if (!data?.decks) return new Map<string, TopPlayerDeck[]>();
    
    // Primeiro, agrupe todos os decks por arquétipo principal
    const groups = new Map<string, TopPlayerDeck[]>();
    
    data.decks.forEach(deck => {
      const mainArchetype = deck.archetypes[0]?.name || deck.primaryArchetype;
      
      if (!groups.has(mainArchetype)) {
        groups.set(mainArchetype, []);
      }
      groups.get(mainArchetype)!.push(deck);
    });
    
    // Agora, identifique arquétipos que tem apenas 1 jogador NO TOTAL e mova para "Other"
    const othersDecks: TopPlayerDeck[] = [];
    const finalGroups = new Map<string, TopPlayerDeck[]>();
    
    groups.forEach((decks, archetype) => {
      const totalPlayers = decks.reduce((sum, deck) => sum + deck.qty, 0);
      
      // Se o arquétipo tem apenas 1 jogador no total, vai para "Other"
      if (totalPlayers === 1) {
        othersDecks.push(...decks);
      } else {
        finalGroups.set(archetype, decks);
      }
    });
    
    // Adicionar grupo "Other" se houver decks
    if (othersDecks.length > 0) {
      finalGroups.set('Other', othersDecks);
    }
    
    return finalGroups;
  }, [data?.decks]);

  // Preparar dados agregados (primeiro nível)
  const mainTableData = useMemo(() => {
    if (!groupedByMainArchetype.size) return [];
    
    return Array.from(groupedByMainArchetype.entries()).map(([archetype, decks]) => {
      const totalQty = decks.reduce((sum, deck) => sum + deck.qty, 0);
      const firstDeck = decks[0];
      
      // Usar cardId especial para "Other"
      const cardId = archetype === 'Other' ? 27174286 : (firstDeck.archetypes[0]?.ids[0] || null);
      
      return {
        name: archetype,
        qty: totalQty,
        percentage: ((totalQty / (data?.totalPlayers || 1)) * 100).toFixed(1),
        cardId: cardId,
        variantCount: decks.length,
        hasVariants: decks.length > 1,
      };
    }).sort((a, b) => b.qty - a.qty);
  }, [groupedByMainArchetype, data?.totalPlayers]);

  // Preparar dados de variantes (segundo nível)
  const getVariantsData = (mainArchetype: string) => {
    const decks = groupedByMainArchetype.get(mainArchetype);
    if (!decks || decks.length === 0) return [];

    return decks.map((deck) => {
      const variantName = deck.archetypes.map((a) => a.name).join(' + ');
      
      return {
        name: variantName,
        qty: deck.qty,
        percentage: ((deck.qty / (data?.totalPlayers || 1)) * 100).toFixed(1),
        cardId: deck.archetypes[0]?.ids[0] || null,
        parentDeck: mainArchetype,
      };
    }).sort((a, b) => b.qty - a.qty);
  };

  const tableData = selectedDeck ? getVariantsData(selectedDeck) : mainTableData;

  if (loading) {
    return (
      <div className="bg-zinc-900/50 rounded-lg p-6 border border-zinc-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-700 rounded animate-pulse"></div>
            <div className="w-48 h-6 bg-zinc-700 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-12 bg-zinc-800 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-zinc-900/50 rounded-lg p-6 border border-zinc-800">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Icon icon="mdi:alert-circle" className="text-4xl text-red-400 mb-2 mx-auto" />
            <p className="text-red-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data || tableData.length === 0) {
    return (
      <div className="bg-zinc-900/50 rounded-lg p-6 border border-zinc-800">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Icon icon="mdi:table" className="text-4xl text-gray-600 mb-2 mx-auto" />
            <p className="text-gray-400">{t('statistics.no_data')}</p>
          </div>
        </div>
      </div>
    );
  }

  const handleRowClick = (deck: any) => {
    if (!selectedDeck && 'hasVariants' in deck && deck.hasVariants) {
      setSelectedDeck(deck.name);
    }
  };

  const handleBackToMain = () => {
    setSelectedDeck(null);
  };

  return (
    <div className="bg-zinc-900/50 rounded-lg p-6 border border-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {selectedDeck && (
            <button
              onClick={handleBackToMain}
              className="p-2 hover:bg-zinc-800 rounded-md transition-colors"
              title={t('statistics.back_to_main')}
            >
              <Icon icon="mdi:arrow-left" className="text-xl text-gray-400 hover:text-white" />
            </button>
          )}
          <Icon icon="mdi:table" className="text-2xl text-blue-400" />
          <div>
            <h2 className="text-xl font-semibold text-gray-300">
              {selectedDeck ? `${selectedDeck} - ${t('statistics.variants')}` : t('statistics.top_players_decks')}
            </h2>
            <p className="text-sm text-gray-500">
              {selectedDeck 
                ? t('statistics.explore_variants_count', { count: tableData.length })
                : t('statistics.top_players_subtitle', { 
                    count: data.totalPlayers,
                    unique: data.uniqueDecks 
                  })
              }
            </p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          className="p-2 hover:bg-zinc-800 rounded-md transition-colors"
          title={t('common.refresh')}
        >
          <Icon icon="mdi:refresh" className="text-xl text-gray-400 hover:text-white" />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">#</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
                {selectedDeck ? t('statistics.variant_name') : t('statistics.deck_name')}
              </th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">
                {t('statistics.players')}
              </th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">
                {t('statistics.percentage')}
              </th>
              {!selectedDeck && (
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">
                  {t('statistics.variants')}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {tableData.map((deck, index) => {
              const isClickable = !selectedDeck && 'hasVariants' in deck && deck.hasVariants;
              
              return (
                <tr
                  key={index}
                  onClick={() => handleRowClick(deck)}
                  className={`
                    border-b border-zinc-800 transition-colors
                    ${isClickable ? 'cursor-pointer hover:bg-zinc-800/50' : ''}
                    ${index % 2 === 0 ? 'bg-zinc-900/30' : 'bg-transparent'}
                  `}
                >
                  {/* Rank */}
                  <td className="py-3 px-4">
                    <div className={`flex items-center justify-center w-8 h-8 rounded font-bold text-sm ${
                      index < 3 ? 'text-blue-400' : 'text-gray-400'
                    }`}>
                      {index + 1}
                    </div>
                  </td>

                  {/* Deck Name */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {deck.cardId && (
                        <img
                          src={`https://ygopro.online/assets/card-arts/${deck.cardId}.jpg`}
                          alt={deck.name}
                          className="w-10 h-14 object-cover rounded border border-zinc-700"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <div className="flex-1">
                        <p className="text-white font-semibold">{deck.name}</p>
                        {!selectedDeck && 'parentDeck' in deck && (
                          <p className="text-xs text-gray-500">
                            {t('statistics.variant_of')} {deck.parentDeck}
                          </p>
                        )}
                      </div>
                      {isClickable && (
                        <Icon icon="mdi:chevron-right" className="text-gray-500 text-xl shrink-0" />
                      )}
                    </div>
                  </td>

                  {/* Players */}
                  <td className="py-3 px-4 text-center">
                    <span className="text-white font-bold text-lg">{deck.qty}</span>
                  </td>

                  {/* Percentage */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="flex-1 max-w-[100px] bg-zinc-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${Math.min(parseFloat(deck.percentage), 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-gray-300 font-semibold text-sm w-12 text-right">
                        {deck.percentage}%
                      </span>
                    </div>
                  </td>

                  {/* Variants Count */}
                  {!selectedDeck && (
                    <td className="py-3 px-4 text-center">
                      {'hasVariants' in deck && deck.hasVariants ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-semibold border border-blue-500/30">
                          {'variantCount' in deck ? deck.variantCount : 0}
                        </span>
                      ) : (
                        <span className="text-gray-600 text-sm">-</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Stats Summary */}
      <div className="mt-6 pt-6 border-t border-zinc-800">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{data.totalPlayers}</p>
            <p className="text-xs text-gray-500">{t('statistics.total_players')}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{data.uniqueDecks}</p>
            <p className="text-xs text-gray-500">{t('statistics.unique_decks')}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">
              {data.region === 33 ? 'TCG' : 'Genesys'}
            </p>
            <p className="text-xs text-gray-500">{t('statistics.region')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopPlayersTable;
