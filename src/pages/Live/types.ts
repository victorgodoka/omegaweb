export interface TournamentData {
  decks: Deck[]
  players: Player[]
  tournament: Tournament
  rounds: Round[]
  table: Table[]
}

export interface Deck {
  id: string
  code: string
  passwords: Passwords
  set: Set[]
}

export interface Passwords {
  mainDeck: number[]
  sideDeck: number[]
}

export interface Set {
  archetype: string
  ids: number[]
  qtd: number
}

export interface Player {
  username: string
  avatar?: string
  displayname: string
  id: string
}

export interface Tournament {
  id: number
  starttime: string
  extrarules: number
  settings: number
  banlist: string
  players: number
  endtime: string
}

export interface Round {
  id: number
  phase: number
  starttime: string
  bye?: string
  rooms: Room[]
}

export interface Room {
  round_id: number
  room_id: number
  duelist1: string
  duelist2: string
  end: string
  result: number
}

export interface Table {
  id: string
  wins: number
  loses: number
  draws: number
  rating: number
}
