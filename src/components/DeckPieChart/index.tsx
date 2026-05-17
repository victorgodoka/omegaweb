import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

// Paleta de cores com alto contraste para tema dark
const COLORS = [
  '#60a5fa', // blue-400
  '#a78bfa', // violet-400
  '#f472b6', // pink-400
  '#fbbf24', // amber-400
  '#34d399', // emerald-400
  '#22d3ee', // cyan-400
  '#fb923c', // orange-400
  '#818cf8', // indigo-400
  '#2dd4bf', // teal-400
  '#c084fc', // purple-400
  '#4ade80', // green-400
  '#facc15', // yellow-400
  '#f87171', // red-400
  '#38bdf8', // sky-400
  '#94a3b8', // slate-400
];

export interface DeckPieChartData {
  name: string;
  value: number;
  percentage: string;
  cardId: number | null;
  archetypes?: Array<{ name: string; percentage: string; ids: number[] }>;
  hasVariants?: boolean;
  variantCount?: number;
  parentDeck?: string;
  variantIndex?: number;
  [key: string]: any; // Allow additional properties for recharts compatibility
}

interface DeckPieChartProps {
  data: DeckPieChartData[];
  title: string;
  subtitle: string;
  isVariantView?: boolean;
  onBackToMain?: () => void;
  onRefresh?: () => void;
  onSliceClick?: (data: DeckPieChartData, index: number) => void;
  totalPlayers?: number;
  uniqueDecks?: number;
  region?: string;
}

const DeckPieChart: React.FC<DeckPieChartProps> = ({
  data,
  title,
  subtitle,
  isVariantView = false,
  onBackToMain,
  onRefresh,
  onSliceClick,
  totalPlayers,
  uniqueDecks,
  region,
}) => {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hoveredLegend, setHoveredLegend] = useState<string | null>(null);

  // Sort data by value (descending) to ensure legend is ordered by representation
  const sortedData = [...data].sort((a, b) => b.value - a.value);

  // Custom label para o gráfico - nome do deck
  const renderCustomLabel = (entry: any) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, outerRadius, name, percentage, payload } = entry;
    
    // Só mostra label se for >= 5% para não poluir
    if (parseFloat(percentage) < 5) return null;

    // Posição fora do círculo
    const radius = outerRadius + 30;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Determina alinhamento baseado no ângulo
    const textAnchor = x > cx ? 'start' : 'end';

    const hasVariants = 'hasVariants' in payload && payload.hasVariants;

    return (
      <g>
        <text 
          x={x} 
          y={y} 
          fill="#f4f4f5" 
          textAnchor={textAnchor}
          dominantBaseline="central"
          className="font-bold text-xs"
          style={{ 
            textShadow: '0 0 4px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.9)',
            stroke: '#000000',
            strokeWidth: '0.5px',
            paintOrder: 'stroke'
          }}
        >
          {name}
        </text>
        {hasVariants && !isVariantView && (
          <text
            x={x}
            y={y + 14}
            fill="#60a5fa"
            textAnchor={textAnchor}
            dominantBaseline="central"
            className="text-[10px] font-semibold"
            style={{ 
              textShadow: '0 0 4px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.9)',
              stroke: '#000000',
              strokeWidth: '0.5px',
              paintOrder: 'stroke'
            }}
          >
            ▸ {payload.variantCount || 0} variants
          </text>
        )}
      </g>
    );
  };

  // Handler para mouse sobre fatia do pie
  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  // Handler para click na fatia
  const onPieClick = (_: any, index: number) => {
    if (onSliceClick) {
      onSliceClick(sortedData[index], index);
    }
  };

  // Handler para click/hover na legenda
  const handleLegendMouseEnter = (legendData: any) => {
    const index = sortedData.findIndex(item => item.name === legendData.value);
    if (index !== -1) {
      setActiveIndex(index);
      setHoveredLegend(legendData.value);
    }
  };

  const handleLegendMouseLeave = () => {
    setActiveIndex(null);
    setHoveredLegend(null);
  };

  // Custom tooltip com imagem da carta
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const itemData = payload[0].payload;
      const cardImageUrl = itemData.cardId 
        ? `https://ygopro.online/assets/card-arts/${itemData.cardId}.jpg`
        : null;

      const isVariantViewLocal = 'parentDeck' in itemData;
      const hasClickableVariants = 'hasVariants' in itemData && itemData.hasVariants;

      return (
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl overflow-hidden max-w-xs">
          {/* Imagem da carta */}
          {cardImageUrl && (
            <div className="relative w-full h-48 bg-zinc-800">
              <img 
                src={cardImageUrl}
                alt={itemData.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
          
          {/* Informações */}
          <div className="p-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-white font-bold text-lg flex-1">{itemData.name}</p>
              {hasClickableVariants && (
                <span className="shrink-0 text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-blue-500/30 flex items-center gap-1">
                  <Icon icon="mdi:chevron-right" className="text-sm" />
                  {itemData.variantCount || 0}
                </span>
              )}
            </div>
            
            {/* Variant info */}
            {isVariantViewLocal && (
              <div className="mb-2">
                <span className="text-xs bg-zinc-800 text-gray-400 px-2 py-1 rounded border border-zinc-700">
                  {t('statistics.variant_of')} {itemData.parentDeck}
                </span>
              </div>
            )}
            
            {/* Arquétipos (só na view principal) */}
            {!isVariantViewLocal && itemData.archetypes && itemData.archetypes.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1">
                {itemData.archetypes.slice(0, 3).map((arch: any, idx: number) => (
                  <span 
                    key={idx}
                    className="text-xs bg-zinc-800 text-gray-300 px-2 py-1 rounded border border-zinc-700"
                  >
                    {arch.name} ({arch.percentage}%)
                  </span>
                ))}
                {itemData.archetypes.length > 3 && (
                  <span className="text-xs text-gray-500 px-2 py-1">
                    +{itemData.archetypes.length - 3} more
                  </span>
                )}
              </div>
            )}
            
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <div>
                <p className="text-gray-400 text-xs">{t('statistics.players')}</p>
                <p className="text-white font-bold text-xl">{itemData.value}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-xs">{t('statistics.percentage')}</p>
                <p className="text-white font-bold text-xl">{itemData.percentage}%</p>
              </div>
            </div>

            {hasClickableVariants && (
              <div className="mt-2 pt-2 border-t border-zinc-800">
                <p className="text-xs text-blue-400 flex items-center gap-1">
                  <Icon icon="mdi:information-outline" className="text-sm" />
                  {t('statistics.click_explore_variants')}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (sortedData.length === 0) {
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

  return (
    <div className="bg-zinc-900/50 rounded-lg p-6 border border-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {isVariantView && onBackToMain && (
            <button
              onClick={onBackToMain}
              className="p-2 hover:bg-zinc-800 rounded-md transition-colors"
              title={t('statistics.back_to_main')}
            >
              <Icon icon="mdi:arrow-left" className="text-xl text-gray-400 hover:text-white" />
            </button>
          )}
          <Icon icon="mdi:chart-pie" className="text-2xl text-blue-400" />
          <div>
            <h2 className="text-xl font-semibold text-gray-300">{title}</h2>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 hover:bg-zinc-800 rounded-md transition-colors"
            title={t('common.refresh')}
          >
            <Icon icon="mdi:refresh" className="text-xl text-gray-400 hover:text-white" />
          </button>
        )}
      </div>

      {/* Chart */}
      <div className="h-[600px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={sortedData}
              cx="50%"
              cy="45%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={220}
              innerRadius={0}
              fill="#8884d8"
              dataKey="value"
              paddingAngle={1}
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
              onClick={onPieClick}
            >
              {sortedData.map((_entry, index) => {
                const isActive = activeIndex === null || activeIndex === index;
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    stroke="#1a1a1a"
                    strokeWidth={2}
                    opacity={isActive ? 1 : 0.4}
                    style={{ 
                      transition: 'all 0.3s ease',
                      cursor: onSliceClick ? 'pointer' : 'default',
                      filter: isActive ? 'brightness(1.1)' : 'brightness(0.8)'
                    }}
                  />
                );
              })}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="middle" 
              align="right"
              layout="vertical"
              wrapperStyle={{ paddingLeft: '40px', cursor: 'pointer' }}
              onMouseEnter={handleLegendMouseEnter}
              onMouseLeave={handleLegendMouseLeave}
              formatter={(value) => {
                const isHovered = hoveredLegend === value;
                return (
                  <span 
                    className={`text-sm transition-all ${
                      isHovered ? 'text-white font-bold' : 'text-gray-200'
                    }`}
                    style={{ 
                      textShadow: isHovered ? '0 0 2px rgba(0,0,0,0.5)' : 'none'
                    }}
                  >
                    {value}
                  </span>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Summary */}
      {(totalPlayers !== undefined || uniqueDecks !== undefined || region) && (
        <div className="mt-6 pt-6 border-t border-zinc-800">
          <div className="flex justify-center items-center gap-4">
            {totalPlayers !== undefined && (
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{totalPlayers}</p>
                <p className="text-xs text-gray-500">{t('statistics.total_players')}</p>
              </div>
            )}
            {uniqueDecks !== undefined && (
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{uniqueDecks}</p>
                <p className="text-xs text-gray-500">{t('statistics.unique_decks')}</p>
              </div>
            )}
            {region && (
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{region}</p>
                <p className="text-xs text-gray-500">{t('statistics.region')}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeckPieChart;
