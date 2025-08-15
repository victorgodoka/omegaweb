import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { useTranslation } from 'react-i18next'
import { calculateTiebreakers } from '@/utils/Tiebreaker'
import { getTopCut } from '@/utils/Functions'
import type { Player, Round, Table } from '@/pages/Live/types'

interface GraphsProps {
  deckLists: DeckLists[]
  players: Player[]
  rounds: Round[]
  table: Table[]
}

interface DeckData {
  name: string
  count: number
  percentage: number
  color: string
  cardId?: number
  cardImage?: string
}

const COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#A855F7' // Violet
]

const Graphs = ({ deckLists, players, rounds, table }: GraphsProps) => {
  const { t } = useTranslation();
  
  const { allTournamentData, topCutData } = useMemo(() => {
    if (!deckLists.length || !players.length) {
      return { allTournamentData: [], topCutData: [] }
    }

    // Get top cut players
    const tiebreakerResults = calculateTiebreakers({ players, rounds, table })
    const topCutCount = getTopCut(players.length)
    const topCutPlayerIds = tiebreakerResults
      .slice(0, topCutCount)
      .map(p => p.id)

    // Count deck archetypes for all tournament and get representative card IDs
    const allDeckCounts: Record<string, { count: number; cardId?: number }> = {}
    deckLists.forEach(deck => {
      const mainArchetype = deck.set?.[0]?.archetype || 'Unknown'
      const cardId = deck.set?.[0]?.ids?.[0]

      if (!allDeckCounts[mainArchetype]) {
        allDeckCounts[mainArchetype] = { count: 0, cardId }
      }
      allDeckCounts[mainArchetype].count += 1
    })

    // Count deck archetypes for top cut
    const topCutDeckCounts: Record<string, { count: number; cardId?: number }> =
      {}
    deckLists
      .filter(deck => topCutPlayerIds.includes(deck.id))
      .forEach(deck => {
        const mainArchetype = deck.set?.[0]?.archetype || 'Unknown'
        const cardId = deck.set?.[0]?.ids?.[0]

        if (!topCutDeckCounts[mainArchetype]) {
          topCutDeckCounts[mainArchetype] = { count: 0, cardId }
        }
        topCutDeckCounts[mainArchetype].count += 1
      })

    // Convert to chart data
    const allTournamentData: DeckData[] = Object.entries(allDeckCounts)
      .map(([name, deckData], index) => ({
        name,
        count: deckData.count,
        percentage: (deckData.count / deckLists.length) * 100,
        color: COLORS[index % COLORS.length],
        cardId: deckData.cardId,
        cardImage: deckData.cardId
          ? `https://images.ygoprodeck.com/images/cards_cropped/${deckData.cardId}.jpg`
          : undefined
      }))
      .sort((a, b) => b.count - a.count)

    const topCutData: DeckData[] = Object.entries(topCutDeckCounts)
      .map(([name, deckData], index) => ({
        name,
        count: deckData.count,
        percentage: (deckData.count / topCutCount) * 100,
        color: COLORS[index % COLORS.length],
        cardId: deckData.cardId,
        cardImage: deckData.cardId
          ? `https://images.ygoprodeck.com/images/cards_cropped/${deckData.cardId}.jpg`
          : undefined
      }))
      .sort((a, b) => b.count - a.count)

    return { allTournamentData, topCutData }
  }, [deckLists, players, rounds, table])

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className='bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-lg'>
          <p className='text-white font-medium'>{data.name}</p>
          <p className='text-blue-400'>
            {data.count} {data.count === 1 ? t('graphs.deck') : t('graphs.decks')} (
            {data.percentage.toFixed(1)}%)
          </p>
        </div>
      )
    }
    return null
  }

  const CustomPieLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percentage } = props

    // Only show percentage if the slice is large enough
    if (percentage < 8) return null

    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.7
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill='white'
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline='central'
        fontSize='14'
        fontWeight='bold'
        style={{
          textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
          filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.8))'
        }}
      >
        {`${percentage.toFixed(1)}%`}
      </text>
    )
  }

  const CustomLegend = ({ payload }: any) => (
    <div className='flex flex-wrap justify-center gap-2 mt-4'>
      {payload?.map((entry: any, index: number) => {
        // Find the corresponding data entry to get the percentage and card image
        const dataEntry = [...allTournamentData, ...topCutData].find(
          d => d.name === entry.value
        )
        return (
          <div
            key={index}
            className='flex items-center gap-2 text-sm bg-zinc-800 rounded-lg p-2'
          >
            {dataEntry?.cardImage ? (
              <img
                src={dataEntry.cardImage}
                alt={dataEntry.name}
                className='w-8 h-12 object-cover rounded border'
                onError={e => {
                  // Fallback to colored circle if image fails to load
                  e.currentTarget.style.display = 'none'
                  const nextElement = e.currentTarget
                    .nextElementSibling as HTMLElement
                  if (nextElement) nextElement.style.display = 'block'
                }}
              />
            ) : null}
            <div
              className='w-3 h-3 rounded-full'
              style={{
                backgroundColor: entry.color,
                display: dataEntry?.cardImage ? 'none' : 'block'
              }}
            />
            <span className='text-zinc-300'>
              {entry.value} ({dataEntry?.percentage?.toFixed(1) || '0.0'}%)
            </span>
          </div>
        )
      })}
    </div>
  )

  if (!deckLists.length) {
    return (
      <div className='flex items-center justify-center h-64 text-zinc-400'>
        <p>{t('graphs.no_deck_data')}</p>
      </div>
    )
  }

  return (
    <div className='space-y-8 p-6'>
      <div className='text-center'>
        <h2 className='text-2xl font-bold text-white mb-2'>
          {t('graphs.metagame_analysis')}
        </h2>
        <p className='text-zinc-400'>{t('graphs.deck_distribution')}</p>
      </div>

      <div className='grid grid-cols-1 xl:grid-cols-2 gap-8'>
        {/* All Tournament Chart */}
        <div className='bg-zinc-900 rounded-xl p-6'>
          <h3 className='text-xl font-semibold text-white mb-4 text-center'>
            {t('graphs.all_tournament')} ({deckLists.length} {t('graphs.players')})
          </h3>
          <div className='h-80'>
            <ResponsiveContainer width='100%' height='100%'>
              <PieChart>
                <Pie
                  data={allTournamentData}
                  cx='50%'
                  cy='50%'
                  outerRadius={100}
                  fill='#8884d8'
                  dataKey='count'
                  label={<CustomPieLabel />}
                  labelLine={false}
                >
                  {allTournamentData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <CustomLegend payload={allTournamentData} />
        </div>

        {/* Top Cut Chart */}
        <div className='bg-zinc-900 rounded-xl p-6'>
          <h3 className='text-xl font-semibold text-white mb-4 text-center'>
            {t('graphs.top_cut')} {getTopCut(players.length)} (
            {topCutData.reduce((sum, d) => sum + d.count, 0)} {t('graphs.players')})
          </h3>
          {topCutData.length > 0 ? (
            <>
              <div className='h-80'>
                <ResponsiveContainer width='100%' height='100%'>
                  <PieChart>
                    <Pie
                      data={topCutData}
                      cx='50%'
                      cy='50%'
                      outerRadius={100}
                      fill='#8884d8'
                      dataKey='count'
                      label={<CustomPieLabel />}
                      labelLine={false}
                    >
                      {topCutData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <CustomLegend payload={topCutData} />
            </>
          ) : (
            <div className='flex items-center justify-center h-80 text-zinc-400'>
              <p>{t('graphs.tournament_not_finished')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Summary */}
      <div className='bg-zinc-900 rounded-xl p-6'>
        <h3 className='text-xl font-semibold text-white mb-4'>
          {t('graphs.deck_statistics')}
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {allTournamentData.slice(0, 6).map((deck, index) => {
            const topCutDeck = topCutData.find(d => d.name === deck.name)
            const topCutPercentage = topCutDeck ? topCutDeck.percentage : 0
            const conversionRate = topCutDeck
              ? (topCutDeck.count / deck.count) * 100
              : 0

            return (
              <div key={index} className='bg-zinc-800 rounded-lg p-4'>
                <div className='flex items-center gap-3 mb-3'>
                  {deck.cardImage ? (
                    <img
                      src={deck.cardImage}
                      alt={deck.name}
                      className='w-10 h-14 object-cover rounded border flex-shrink-0'
                      onError={e => {
                        // Fallback to colored circle if image fails to load
                        e.currentTarget.style.display = 'none'
                        const nextElement = e.currentTarget
                          .nextElementSibling as HTMLElement
                        if (nextElement) nextElement.style.display = 'block'
                      }}
                    />
                  ) : null}
                  <div
                    className='w-4 h-4 rounded-full flex-shrink-0'
                    style={{
                      backgroundColor: deck.color,
                      display: deck.cardImage ? 'none' : 'block'
                    }}
                  />
                  <h4 className='font-medium text-white truncate'>
                    {deck.name}
                  </h4>
                </div>
                <div className='space-y-1 text-sm'>
                  <div className='flex justify-between text-zinc-300'>
                    <span>{t('graphs.tournament')}:</span>
                    <span>
                      {deck.count} ({deck.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className='flex justify-between text-zinc-300'>
                    <span>{t('graphs.top_cut')}:</span>
                    <span>
                      {topCutDeck?.count || 0} ({topCutPercentage.toFixed(1)}%)
                    </span>
                  </div>
                  {conversionRate > 0 && (
                    <div className='flex justify-between text-blue-400'>
                      <span>{t('graphs.conversion')}:</span>
                      <span>{conversionRate.toFixed(1)}%</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Graphs
