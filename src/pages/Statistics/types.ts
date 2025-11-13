// Statistics v3 API Response Types

export interface StatsSummary {
  total_unique_decks: number;
  total_games: number;
  total_deck_variants: number;
}

export interface LastProcessed {
  region: number;
  last_duel_id: number;
  last_processed_at: string;
}

export interface StatsSummaryResponse {
  summary: StatsSummary;
  lastProcessed: LastProcessed[];
  region: string | number;
}

export interface Archetype {
  name: string;
  ids: number[];
}

export interface DeckStat {
  deck_name: string;
  top_archetypes: Archetype[];
  total_wins: number;
  total_losses: number;
  total_games: number;
  win_rate: number;
  unique_deck_variants: number;
}

export interface StatsDecksResponse {
  decks: DeckStat[];
  filters: {
    region?: number;
    limit: number;
    minGames: number;
  };
  count: number;
}

export interface CardStat {
  card_id: number;
  card_name: string;
  zone: 'main' | 'extra' | 'side';
  total_copies: number;
  decks_used_in: number;
  decks_1_copy: number;
  decks_2_copies: number;
  decks_3_copies: number;
  total_wins: number;
  total_losses: number;
  total_games: number;
  win_rate: number;
  avg_copies: number;
}

export interface StatsCardsResponse {
  cards: CardStat[];
  filters: {
    region?: number;
    limit: number;
    minGames: number;
  };
  count: number;
}

export interface DeckDetail {
  deck_name: string;
  top_archetypes: Archetype[];
  total_wins: number;
  total_losses: number;
  total_games: number;
  win_rate: number;
}

export interface StatsDeckResponse {
  deck: DeckDetail;
  region: number;
}

export interface UpdateStatsResult {
  region: number;
  duelsProcessed: number;
  decksProcessed: number;
  cardsProcessed: number;
  startTime: number;
  endTime: number;
  lastDuelId: number;
}

export interface UpdateStatsResponse {
  ok: boolean;
  message: string;
  data?: {
    processed: number;
    updated_at: string;
  };
}

export interface LoginData {
  LogDate: string;
  LogCount: number;
}

export interface LastLoginsResponse {
  success: boolean;
  data: {
    logins: LoginData[];
  };
}
