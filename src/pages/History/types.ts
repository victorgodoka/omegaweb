export interface PastTournaments {
  success: boolean
  data: Tournament[]
}

export interface Tournament {
  id: number
  starttime: string
  extrarules: number
  settings: number
  banlist: string
  players: number
  endtime?: string
}
