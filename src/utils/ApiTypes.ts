// ============================================
// CORE API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = any> {
  data?: T;
  ok: boolean;
  success?: boolean;
  message?: string;
  status?: number;
  pagination?: Pagination;
  filters?: any;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

// ============================================
// DECK RELATED TYPES
// ============================================

export interface DeckConvertRequest {
  main: number[];
  side: number[];
  extra: number[];
}

export interface DeckConvertResponse {
  code: string;
  ydkeUrl: string;
}

export interface DeckCardData {
  id: number;
  name: string;
  qtd: number;
}

export interface DeckCategorizeRequest {
  decks: string[];
}

export interface CategorizedDeck {
  code: string;
  primaryArchetype: string;
  archetypes: CategorizedArchetype[];
  totalCards: number;
  mainDeckSize: number;
  sideDeckSize: number;
  uniqueCards: number[];
  fullDeck: FullDeck;
  uniqueCardsData?: Card[];
}

export interface CategorizedArchetype {
  name: string;
  count: number;
  percentage: number;
}

export interface FullDeck {
  main: number[];
  side: number[];
}

export type DeckCategorizeResponse = CategorizedDeck[];

// ============================================
// LEADERBOARD TYPES
// ============================================

export interface LeaderboardPlayer {
  id: string;
  username: string;
  avatar: string | null;
  displayname: string;
  wins: number;
  loses: number;
  draws: number;
  rating: number;
  winstreak: number;
  losestreak: number;
  games: number;
  ot: string;
}

export interface LeaderboardResponse {
  data: {
    TCG: LeaderboardPlayer[];
    OCG: LeaderboardPlayer[];
  };
}

// ============================================
// PDF GENERATION TYPES
// ============================================

export interface PDFGenerationResponse {
  blob: Blob;
}

// ============================================
// STATISTICS TYPES
// ============================================

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
  wilson_score: number;
  unique_deck_variants: number;
}

export interface StatsDecksResponse {
  decks: DeckStat[];
  filters: {
    region?: number;
    limit: number;
    minGames: number;
    rating?: number;
    elo?: string;
    tier?: string;
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
    rating?: number;
    elo?: string;
    tier?: string;
    zone?: 'main' | 'extra' | 'side';
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

export interface UpdateStatsResponse {
  message: string;
  data?: {
    processedGames: number;
    newDecks: number;
    updatedDecks: number;
  };
}

export interface DuelActivityPayload {
  tcg: DuelActivityBucket;
  genesys: DuelActivityBucket;
}

export interface DuelActivityBucket {
  live: number;
  lastHour: number;
  lastDay: number;
}

// ============================================
// LOGIN & RANK TYPES
// ============================================

export interface LoginData {
  LogDate: string;
  LogCount: number;
}

export interface LastLoginsResponse {
  logins: LoginData[];
}

export interface RankDistribution {
  rank: string;
  count: number;
  percentage: number;
}

export interface RankDistributionResponse {
  distribution: RankDistribution[];
  total_users: number;
}

// ============================================
// INITIAL STATISTICS TYPES
// ============================================

export interface InitialStatisticsRequest {
  forceCache?: boolean;
  lastlogins: Record<string, never>[];
  summary: Array<{ region?: number }>;
  decks: Array<{
    region?: number;
    limit?: number;
    minGames?: number;
    rating?: number;
    elo?: string;
    tier?: string;
  }>;
  cards: Array<{
    region?: number;
    limit?: number;
    minGames?: number;
    zone: 'main' | 'side' | 'extra';
    elo?: string;
    tier?: string;
  }>;
  'top-players': Array<{
    region: number;
    limit?: number;
  }>;
  'rank-distribution': Record<string, never>[];
}

export interface InitialStatisticsDataItem<T> {
  success: boolean;
  data: T;
}

export interface TopPlayersData {
  decks: Array<{
    primaryArchetype: string;
    archetypes: Array<{
      name: string;
      count: number;
      percentage: number;
      ids: number[];
    }>;
    qty: number;
  }>;
  region: number;
  totalPlayers: number;
  uniqueDecks: number;
}

export interface RankDistributionRank {
  rank: string;
  count: number;
  percentage: number;
}

export interface RankDistributionRegion {
  region: string;
  totalPlayers: number;
  ranks: RankDistributionRank[];
}

export type RankDistributionData = RankDistributionRegion[];

export interface InitialStatisticsResponse {
  success: boolean;
  data: {
    lastlogins: Array<InitialStatisticsDataItem<LastLoginsResponse>>;
    summary: Array<InitialStatisticsDataItem<StatsSummaryResponse>>;
    decks: Array<InitialStatisticsDataItem<StatsDecksResponse>>;
    cards: Array<InitialStatisticsDataItem<StatsCardsResponse>>;
    'top-players': Array<InitialStatisticsDataItem<TopPlayersData>>;
    'rank-distribution': Array<InitialStatisticsDataItem<RankDistributionData>>;
  };
  lastSaved: string;
  fromCache: boolean;
}

// ============================================
// SAVED DECKS TYPES
// ============================================

export interface SavedDeck {
  id: number;
  user_id: string;
  code: string;
  name: string;
  cover_id: number | null;
  archetypes: string[];
  tags: string[];
  private: boolean;
  created_at: string;
  updated_at: string;
  likes?: number;
  comment_count?: number;
}

export interface CreateDeckRequest {
  code: string;
  name: string;
  cover_id?: number;
  archetypes?: string[];
  tags?: string[];
  private?: boolean;
}

export interface UpdateDeckRequest {
  code?: string;
  name?: string;
  cover_id?: number;
  archetypes?: string[];
  tags?: string[];
  private?: boolean;
}

export interface DeckWithFullDeck extends SavedDeck {
  fullDeck?: {
    main: number[];
    extra: number[];
    side: number[];
  };
  user?: {
    discord_id: string | null;
    username: string;
    avatar: string;
    displayname: string;
  };
}

export interface SavedDeckResponse extends DeckWithFullDeck {
  success: boolean;
}

export interface UserDecksResponse {
  decks: SavedDeck[];
}

// Note: The actual API returns { data, pagination, filters }
// but fetchApi spreads it, so ApiResponse<SavedDeck[]> will have:
// - data: SavedDeck[]
// - pagination: Pagination (at top level)
// - filters: { availableArchetypes } (at top level)
export type AllDecksApiResponse = SavedDeck[];

// ============================================
// LIKES & COMMENTS TYPES
// ============================================

export interface LikeStatusResponse {
  success: boolean;
  liked: boolean;
  totalLikes: number;
}

export interface LikeResponse {
  success?: boolean;
  message?: string;
  liked: boolean;
  likes: number;
}

export interface Comment {
  id: number;
  deck_id: number;
  user_id: string;
  comment: string;
  parent_id: number | null;
  created_at: string;
  updated_at: string;
  user: {
    discord_id: string;
    username: string;
    avatar: string;
    displayname: string;
  } | null;
}

export interface CommentsResponse extends Array<Comment> {
  success?: boolean;
  count?: number;
}

export interface CommentResponse {
  comment: Comment;
}

// ============================================
// EXTERNAL API TYPES - DUELISTS UNITE
// ============================================

export interface PlayerData {
  id: string;
  username: string;
  displayname: string;
  avatar: string | null;
  wins: number;
  loses: number;
  draws: number;
  rating: number;
  games: number;
}

export interface PlayerResponse {
  data: PlayerData;
}

export interface ProfileCustomizationData {
  id: string;
  banner?: string;
  bio?: string;
  favorite_card?: number;
  social_links?: {
    twitter?: string;
    youtube?: string;
    twitch?: string;
  };
}

export interface ProfileCustomizationResponse {
  data: ProfileCustomizationData | null;
}

export interface UpdateProfileResponse {
  data: ProfileCustomizationData;
}

export interface PlayerDeck {
  deck_name: string;
  deck_code: string;
  games: number;
  wins: number;
  losses: number;
  win_rate: number;
}

export interface OpponentDeck {
  deck?: string;
  wins: number;
  loss: number;
  total: number;
}

export interface MostUsedArchetype {
  deck: string;
  wins: number;
  loss: number;
  total: number;
}

export interface MatchHistory {
  duelist: {
    id: string;
    deck: Array<{
      archetype: string;
      ids: number[];
      qtd: number;
    }>;
    discord: {
      username: string;
      avatar: string;
      displayname: string;
    };
  };
  opponent: {
    id: string;
    deck: Array<{
      archetype: string;
      ids: number[];
      qtd: number;
    }>;
    discord: {
      username: string;
      avatar: string;
      displayname: string;
    };
  };
  winner: string;
  isWinner: boolean;
  isDraw: boolean;
  start: string;
  end: string;
}

export interface ProfilePagination {
  currentPage: number;
  pageSize: number;
  totalMatches: number;
  totalPages: number;
}

export interface ProfileStatsData {
  opponentDecks: OpponentDeck[];
  totalGaming: string;
  mostUsedArchetypes: MostUsedArchetype[];
  matchHistory: MatchHistory[];
  pagination: ProfilePagination;
}

export interface PlayerDecksResponse {
  tcg: ProfileStatsData;
  genesys: ProfileStatsData;
}

export interface UserCountData {
  rank: string;
  count: number;
}

export interface UserCountResponse {
  data: UserCountData[];
}

export interface DatabaseResponse<T = any> {
  data: T;
}

// ============================================
// EXTERNAL API TYPES - DISCORD
// ============================================

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  email?: string;
  verified?: boolean;
  public_flags?: number;
  flags?: number;
  banner?: string | null;
  accent_color?: number | null;
  global_name?: string | null;
  avatar_decoration_data?: {
    asset: string;
    sku_id: string;
    expires_at: string | null;
  } | null;
  collectibles?: {
    nameplate?: {
      sku_id: string;
      asset: string;
      label: string;
      palette: string;
    };
  } | null;
  display_name_styles?: any;
  banner_color?: string | null;
  clan?: any;
  primary_guild?: any;
  mfa_enabled?: boolean;
  locale?: string;
  premium_type?: number;
}

export interface DiscordUserResponse {
  data: DiscordUser;
}

// ============================================
// EXTERNAL API TYPES - FORUM
// ============================================

export interface ForumPost {
  id: number;
  title: string;
  content: string;
  author: string;
  created_at: string;
  category_id: number;
}

export interface ForumPostsResponse {
  posts: ForumPost[];
}

export interface ForumCategory {
  id: number;
  name: string;
  description: string;
}

export interface ForumCategoriesResponse {
  categories: ForumCategory[];
}

// ============================================
// EXTERNAL API TYPES - YGOPRODECK
// ============================================

export interface YGOCard {
  id: number;
  name: string;
  type: string;
  desc: string;
  atk?: number;
  def?: number;
  level?: number;
  race: string;
  attribute?: string;
  card_images: Array<{
    id: number;
    image_url: string;
    image_url_small: string;
  }>;
}

export interface YGOCardInfoResponse {
  data: YGOCard[];
}

// ============================================
// EXTERNAL API TYPES - OMEGA DECKS
// ============================================

export interface OmegaDeckConvertResponse {
  success: boolean;
  data: {
    main: number[];
    extra: number[];
    side: number[];
  };
  meta?: {
    error?: string;
  };
}

// ============================================
// EXTERNAL API TYPES - GITHUB
// ============================================

export interface GitHubRawContentResponse {
  content: string;
}

// ============================================
// EXTERNAL API TYPES - LOCAL DECK SERVER
// ============================================

export interface LocalDeckServerResponse {
  success: boolean;
  message?: string;
}

export interface RoomData {
  id: number;
  name: string;
  players: number;
  max_players: number;
  locked: boolean;
}

export interface RoomListResponse {
  rooms: RoomData[];
}

export interface JoinRoomResponse {
  success: boolean;
  room_id: number;
  message?: string;
}

export interface LocalServerErrorResponse {
  ok: boolean;
  message: string;
  code?: string;
  Reason?: string;
  Code?: string;
}

// ============================================
// CARDS SEARCH TYPES (v3/cards)
// ============================================

export interface CardSet {
  code: string;
  name: string | null;
}

export interface Card {
  id: number;
  canonicalId?: number;
  name_en: string;
  desc_en?: string;
  name_pt?: string;
  desc_pt?: string;
  level?: number;
  atk?: number;
  def?: number;
  sets: CardSet[];
  attribute?: string;
  race?: string;
  type_primary: string;
  type_tags: string[];
  genre_tags: string[];
  category_tags: string[];
  konami_id?: number;
  leftScale?: number | null;
  rightScale?: number | null;
  banlist_data?: BanlistData;
}

export interface RegionBanlistInfo {
  banlist?: string;
  value?: number;
  status?: string;
}

export interface BanlistData {
  tcg?: RegionBanlistInfo;
  ocg?: RegionBanlistInfo;
  wcs?: RegionBanlistInfo;
  genesys?: RegionBanlistInfo;
}

export interface Decklist {
  archetypes?: string[];
  mainDeck: Card[];
  extraDeck: Card[];
  sideDeck: Card[];
}

export interface CardsSearchResponse {
  success: boolean;
  data?: {
    cards: Card[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

export interface CardsSearchParams {
  // HTTP Method
  method?: 'GET' | 'POST';
  
  // Text search
  fname?: string;
  q?: string;
  desc?: string;
  
  // ID / Alias
  id?: number | string | Array<number | string>;
  // Region
  region?: 'OCG' | 'TCG' | 'WCS' | 'GENESYS' | 'Genesys' | 'ALL';
  
  // Numeric filters
  atkMin?: number;
  atkMax?: number;
  defMin?: number;
  defMax?: number;
  levelMin?: number;
  levelMax?: number;
  pScale?: number;
  
  // Attribute
  attribute?: 'EARTH' | 'WATER' | 'FIRE' | 'WIND' | 'LIGHT' | 'DARK' | 'DIVINE';
  
  // Race
  race?: string;
  
  // Type
  type?: 'Monster' | 'Spell' | 'Trap' | 'Token';
  
  // Sets
  setcode?: string;
  sets?: string;
  page?: string | number;
  pageSize?: string  | number;
}

// ============================================
// DECK WIKI TYPES
// ============================================

export interface DeckWikiResponse {
  success: boolean;
  playing: DeckWikiCardSection;
  against: DeckWikiCardSection;
  decklist: DeckWikiDecklist;
  bo3: DeckWikiBo3Stats;
  meta: DeckWikiMeta;
  cached: boolean;
}

export interface DeckWikiCardSection {
  main: DeckWikiCard[];
  side: DeckWikiCard[];
  extra: DeckWikiCard[];
}

export interface DeckWikiCard {
  id: number;
  name: string;
  decks: number;
  frequency: number;
  copies: {
    1: { count: number; percent: number };
    2: { count: number; percent: number };
    3: { count: number; percent: number };
  };
  winRate: number;
  winRatePostSide: number;
}

export interface DeckWikiDecklist {
  mainDeck: Card[];
  sideDeck: Card[];
  extraDeck: Card[];
}

export interface DeckWikiDeckCard {
  id: number;
  name: string;
  copies: number;
}

export interface DeckWikiBo3Stats {
  total: number;
  wentToGame2: { count: number; percent: number };
  wentToGame3: { count: number; percent: number };
}

export interface DeckWikiMeta {
  archetype: string;
  duelsAnalyzed: number;
  targetDecks: number;
  opponentDecks: number;
  processingMs: number;
  updatedAt: string;
}
