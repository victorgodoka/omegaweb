export interface LeaderboardResponse {
  success: boolean
  message?: string
  data: LeaderboardData
}

export interface LeaderboardData {
  TCG: LeaderboardPlayer[]
  OCG: LeaderboardPlayer[]
}

export interface LeaderboardPlayer {
  id: string
  username: string
  avatar?: string
  displayname: string
  wins: number
  loses: number
  draws: number
  rating: number
  winstreak: number
  losestreak: number
  games: number
  ot: string
}

