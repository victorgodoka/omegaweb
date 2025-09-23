export interface DeckStatisticsResponse {
  success: boolean
  data: DeckStatistics
}

export interface DeckStatistics {
  deckStats: DeckStat[]
  totalMatches: number
  statisticsDate: StatisticsDate
  lastUpdated: string
}

export interface DeckStat {
  archetype: Archetype
  wins: number
  losses: number
  totalMatches: number
}

export interface Archetype {
  name: string
  qty: number
  ids: number[][]
}

export interface StatisticsDate {
  isBanlist: boolean
  reason: string
  date: string
}
