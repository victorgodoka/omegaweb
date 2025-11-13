export interface ProfileResponse {
  data: ProfileData
}

export interface ProfileData {
  success: boolean
  id: string
  username: string
  displayname: string
  avatar: string
  tcgwins: number
  tcgloses: number
  tcgdraws: number
  ocgwins: number
  ocgloses: number
  ocgdraws: number
  tcgrating: number
  ocgrating: number
  lastlogin: string
  accountrank: number
}

export interface ProfileStatsResponse {
  success: boolean
  data: ProfileStatsQueue
}

export interface ProfileStatsQueue {
  tcg: ProfileStatsData,
  genesys: ProfileStatsData
}

export interface ProfileStatsData {
  opponentDecks: OpponentDeck[]
  totalGaming: string
  mostUsedArchetypes: MostUsedArchetype[]
  matchHistory: MatchHistory[]
  pagination: Pagination
}

export interface Pagination {
  currentPage: number
  pageSize: number
  totalMatches: number
  totalPages: number
}

export interface OpponentDeck {
  deck?: string
  wins: number
  loss: number
  total: number
}

export interface MostUsedArchetype {
  deck: string
  wins: number
  loss: number
  total: number
}

export interface MatchHistory {
  duelist: Duelist
  opponent: Opponent
  winner: string
  isWinner: boolean
  isDraw: boolean
  start: string
  end: string
}

export interface Duelist {
  id: string
  deck: Deck[]
  discord: Discord
}

export interface Deck {
  archetype: string
  ids: number[]
  qtd: number
}

export interface Discord {
  username: string
  avatar: string
  displayname: string
}

export interface Opponent {
  id: string
  deck: Deck[]
  discord: Discord
}

export interface ProfileCustomizationResponse {
  data: ProfileCustomizationData
}

export interface ProfileCustomizationData {
  success: boolean
  id: string
  duelist_bio: string
  duelist_favorite: any
  duelist_banner_url: string
  hide_history: number
  socialTwitch?: string
  socialYoutube?: string
  socialX?: string
  socialInstagram?: string
}
