// Removed unused import: DeckWithFullDeck

// Tournament Basic Info (usado em /v3/tournaments)
export interface Tournament {
  id: number;
  phases: number;
  players: number;
  banlist: string;
  settings: string;
  refteam: string;
  refuntil: string;
  starttime: string;
  endtime: string | null;
  extrarules: string;
}

// Archetype info in decoded deck
export interface DeckArchetype {
  name: string;
  count: number;
  percentage: number;
}

// Topcut player deck (response from API)
export interface TopcutDeck {
  code: string;
  primaryArchetype: string;
  archetypes: DeckArchetype[];
  totalCards: number;
  mainDeckSize: number;
  sideDeckSize: number;
  uniqueCards: number[];
  fullDeck: FullDeck;
}

export interface FullDeck {
  main: number[];
  side: number[];
}

// Decoded deck structure
export interface DecodedDeck {
  code: string;
  primaryArchetype: string;
  archetypes: DeckArchetype[];
  mainDeckSize: number;
  extraDeckSize: number;
  sideDeckSize: number;
}

// User stats in tournament
export interface UserStats {
  wins: number;
  loses: number;
  draws: number;
  rating: number;
}

// User/Player in tournament
export interface TournamentUser {
  user_id: string;
  username: string;
  avatar: string;
  displayname: string;
  stats: UserStats;
  deck?: TopcutDeck;
  tiebreaker?: string;
}

// Game results
export interface GameResults {
  game1: number;
  game2: number;
  game3: number;
}

// Game end reasons
export interface GameReasons {
  game1: number;
  game2: number;
  game3: number;
}

// Duel in a round
export interface Duel {
  room_id: number;
  duelist1: string;
  duelist2: string;
  winner: string | null;
  result: number;
  results: GameResults;
  reasons: GameReasons;
  first: number;
  end: string;
  usage: string;
}

// Round in tournament
export interface Round {
  id: number;
  tournament_id: number;
  phase: number;
  bye: string;
  starttime: string;
  duels: Duel[];
}

// Topcut statistics archetype data
export interface TopcutStatsArchetype {
  name: string;
  count: number;
  percentage: number;
  ids: number[];
}

export interface TopcutStatsDeck {
  primaryArchetype: string;
  archetypes: TopcutStatsArchetype[];
  qty: number;
}

export interface TopcutData {
  decks: TopcutStatsDeck[];
  totalPlayers: number;
  uniqueDecks: number;
}

// Complete tournament data (usado em /v3/tournaments/:id e /v3/tournaments/live)
export interface TournamentDetail {
  tournament: Tournament;
  rounds: Round[];
  users: TournamentUser[];
  topcutPlayers: TournamentUser[];
  topcutData?: TopcutData;
}

// Pagination info
export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalTournaments: number;
  limit: number;
}

// API Response for /v3/tournaments (list)
export interface TournamentsListResponse {
  success: boolean;
  data: {
    tournaments: Tournament[];
    pagination: Pagination;
  };
}

// API Response for /v3/tournaments/:id and /v3/tournaments/live
export interface TournamentDetailResponse {
  success: boolean;
  data: TournamentDetail;
}
