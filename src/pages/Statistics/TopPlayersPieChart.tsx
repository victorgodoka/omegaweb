import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import type { TopPlayersData, TopPlayerDeck } from './types';
import DeckPieChart, { type DeckPieChartData } from '@/components/DeckPieChart';

interface TopPlayersPieChartProps {
  data: TopPlayersData | null;
  loading: boolean;
  error: string | null;
  region: number;
  limit?: number;
  onRefresh?: () => void;
}

const TopPlayersPieChart: React.FC<TopPlayersPieChartProps> = ({ 
  data, 
  loading, 
  error, 
  region, 
  limit = 64,
  onRefresh 
}) => {
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

  // Preparar dados agregados (primeiro nível - view principal)
  const mainChartData = useMemo(() => {
    if (!groupedByMainArchetype.size) return [];
    
    return Array.from(groupedByMainArchetype.entries()).map(([archetype, decks]) => {
      const totalQty = decks.reduce((sum, deck) => sum + deck.qty, 0);
      const firstDeck = decks[0];
      
      // Usar cardId especial para "Other"
      const cardId = archetype === 'Other' ? 27174286 : (firstDeck.archetypes[0]?.ids[0] || null);
      
      return {
        name: archetype,
        value: totalQty,
        percentage: ((totalQty / (data?.totalPlayers || 1)) * 100).toFixed(1),
        cardId: cardId,
        archetypes: firstDeck.archetypes.map(arch => ({
          ...arch,
          percentage: arch.percentage.toString(),
        })),
        hasVariants: decks.length > 1, // Tem variantes se há múltiplos decks com esse arquétipo principal
        variantCount: decks.length,
      };
    }).sort((a, b) => b.value - a.value); // Ordenar por quantidade
  }, [groupedByMainArchetype, data?.totalPlayers]);

  // Preparar dados de variantes (segundo nível - drill-down view)
  const getVariantsData = (mainArchetype: string) => {
    const decks = groupedByMainArchetype.get(mainArchetype);
    if (!decks || decks.length === 0) return [];

    // Cada deck é uma variante (combinação de arquétipos)
    return decks.map((deck, idx) => {
      // Nome da variante é a combinação completa de arquétipos
      const variantName = deck.archetypes.map((a) => a.name).join(' + ');
      
      return {
        name: variantName,
        value: deck.qty,
        percentage: ((deck.qty / (data?.totalPlayers || 1)) * 100).toFixed(1),
        cardId: deck.archetypes[0]?.ids[0] || null,
        parentDeck: mainArchetype,
        variantIndex: idx,
        archetypes: deck.archetypes.map(arch => ({
          ...arch,
          percentage: arch.percentage.toString(),
        })),
      };
    }).sort((a, b) => b.value - a.value); // Ordenar por quantidade
  };

  // Dados atuais do gráfico (principal ou variantes)
  const chartData: DeckPieChartData[] = selectedDeck ? getVariantsData(selectedDeck) : mainChartData;

  // Handler para click na fatia (drill-down)
  const handleSliceClick = (clickedData: DeckPieChartData, _index: number) => {
    if (!selectedDeck && clickedData.hasVariants) {
      setSelectedDeck(clickedData.name);
    }
  };

  // Voltar para view principal
  const handleBackToMain = () => {
    setSelectedDeck(null);
  };

  if (loading) {
    return (
      <div className="bg-zinc-900/50 rounded-lg p-6 border border-zinc-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-700 rounded animate-pulse"></div>
            <div className="w-48 h-6 bg-zinc-700 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="flex items-center justify-center h-96">
          <Icon icon="mdi:loading" className="text-4xl text-gray-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-zinc-900/50 rounded-lg p-6 border border-zinc-800">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Icon icon="mdi:alert-circle" className="text-4xl text-red-400 mb-2 mx-auto" />
            <p className="text-red-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data || chartData.length === 0) {
    return (
      <div className="bg-zinc-900/50 rounded-lg p-6 border border-zinc-800">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Icon icon="mdi:chart-pie" className="text-4xl text-gray-600 mb-2 mx-auto" />
            <p className="text-gray-400">{t('statistics.no_data')}</p>
          </div>
        </div>
      </div>
    );
  }

  const title = selectedDeck 
    ? `${selectedDeck} - ${t('statistics.variants')}`
    : t('statistics.top_players_decks', { count: limit });

  const subtitle = selectedDeck
    ? t('statistics.explore_variants_count', { count: chartData.length })
    : t('statistics.top_players_subtitle', { 
        count: data?.totalPlayers || 0,
        unique: data?.uniqueDecks || 0
      });

  const regionLabel = region === 33 ? 'TCG' : 'Genesys';

  return (
    <DeckPieChart
      data={chartData}
      title={title}
      subtitle={subtitle}
      isVariantView={!!selectedDeck}
      onBackToMain={selectedDeck ? handleBackToMain : undefined}
      onRefresh={onRefresh}
      onSliceClick={handleSliceClick}
      totalPlayers={data?.totalPlayers}
      uniqueDecks={data?.uniqueDecks}
      region={regionLabel}
    />
  );
};

export default TopPlayersPieChart;
