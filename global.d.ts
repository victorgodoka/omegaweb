declare interface TournamentPlayers {
  username: string
  avatar: string
  displayname: string
  id: string
}

declare interface TournamentRounds {
  id: number
  phase: number
  starttime: string
  bye?: string
  rooms: TournamentRooms[]
}

declare interface TournamentRooms {
  id: number
  duelist1: string
  duelist2: string
  end: string
  result: number
}

declare type LoadingActions = | { type: 'SET_LOADING', payload: boolean }

declare interface YGOAPI {
  id: number
  name: string
  type: string
  humanReadableCardType: string
  frameType: string
  desc: string
  race: string
  attribute?: string
  linkmarkers?: string[]
  archetype: string
  ygoprodeck_url: string
  level: number
  linkval?: number
  scale?: number
  def: number
  atk: number
  card_sets: CardSet[]
  card_images: CardImage[]
  card_prices: CardPrice[]
  misc_info: MiscInfo[]
  banlist_info: {
    ban_ocg: string
    ban_tcg: string
  }
}

declare interface CardSet {
  set_name: string
  set_code: string
  set_rarity: string
  set_rarity_code: string
  set_price: string
}

declare interface CardImage {
  id: number
  image_url: string
  image_url_small: string
  image_url_cropped: string
}

declare interface CardPrice {
  cardmarket_price: string
  tcgplayer_price: string
  ebay_price: string
  amazon_price: string
  coolstuffinc_price: string
}

declare interface MiscInfo {
  beta_name: string
  views: number
  viewsweek: number
  upvotes: number
  downvotes: number
  formats: string[]
  tcg_date: string
  ocg_date: string
  konami_id: number
  has_effect: number
  md_rarity: string
}

declare interface TournamentDecks {
  id: string
  code: string
  passwords: {
    mainDeck: number[]
    sideDeck: number[]
  }
  set: Archetype[]
}

declare interface Archetype {
  archetype: string
  ids: number[]
}

declare interface TiebreakerResult { playerID: string; tiebreaker: number }

declare interface TournamentHistory {
  id: number
  starttime: string
  endtime?: string
  extrarules: number
  settings: number
  banlist: string
  players: number
}

declare interface DeckLists {
  code: string
  id: string
  set: Archetype[]
  mainDeck: TournamentDeckData[]
  extraDeck: TournamentDeckData[]
  sideDeck: TournamentDeckData[]
  passwords: {
    mainDeck: number[]
    sideDeck: number[]
  }
}

declare interface TournamentDeckData {
  id: number
  name: string
  qtd: number
}

declare interface User {
  id: string
  username: string
  displayname: string
  avatar: string;
  profile?: Profile;
}

declare type UserActions = | { type: 'SET_USER', payload: User } | { type: 'LOGOUT' }

// Moment.js locale declarations
declare module 'moment/locale/pt-br';