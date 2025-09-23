export interface Card {
  id: number;
  name: string;
  desc: string;
  card_images: Array<{
    image_url: string;
    image_url_small: string;
  }>;
  type: string;
  humanReadableCardType: string;
  frameType: string;
  race: string;
  attribute?: string;
  level?: number;
  scale?: number;
  linkval?: number;
  atk?: number;
  def?: number;
  card_prices: Array<{
    cardmarket_price: string;
    tcgplayer_price: string;
    ebay_price: string;
    amazon_price: string;
    coolstuffinc_price: string;
  }>;
  banlist_info?: {
    ban_ocg?: "Limited" | "Forbidden" | "Semi-Limited";
    ban_tcg?: "Limited" | "Forbidden" | "Semi-Limited";
  };
}

export interface YGOAPI {
  id: number;
  name: string;
  type: string;
  humanReadableCardType: string;
  frameType: string;
  desc: string;
  race: string;
  attribute?: string;
  linkmarkers?: string[];
  archetype: string;
  ygoprodeck_url: string;
  level: number;
  linkval?: number;
  scale?: number;
  def: number;
  atk: number;
  card_sets: CardSet[];
  card_images: CardImage[];
  card_prices: CardPrice[];
  misc_info: MiscInfo[];
  banlist_info?: {
    ban_ocg?: "Limited" | "Forbidden" | "Semi-Limited";
    ban_tcg?: "Limited" | "Forbidden" | "Semi-Limited";
  };
}

export interface CardSet {
  set_name: string;
  set_code: string;
  set_rarity: string;
  set_rarity_code: string;
  set_price: string;
}

export interface CardImage {
  id: number;
  image_url: string;
  image_url_small: string;
  image_url_cropped: string;
}

export interface CardPrice {
  cardmarket_price: string;
  tcgplayer_price: string;
  ebay_price: string;
  amazon_price: string;
  coolstuffinc_price: string;
}

export interface MiscInfo {
  beta_name: string;
  views: number;
  viewsweek: number;
  upvotes: number;
  downvotes: number;
  formats: string[];
  tcg_date: string;
  ocg_date: string;
  konami_id: number;
  has_effect: number;
  md_rarity: string;
}

export interface DeckCard {
  card: Card;
  quantity: number;
}

export interface Deck {
  name: string;
  format: string;
  banlist: 'TCG' | 'OCG' | 'TCG Genesys';
  mainDeck: DeckCard[];
  extraDeck: DeckCard[];
  sideDeck: DeckCard[];
}

export interface CardTypeStats {
  monsters: number;
  spells: number;
  traps: number;
}

export interface DeckStats {
  totalCards: number;
  cardTypes: CardTypeStats;
  totalValue: number;
}

export interface CardFilter {
  search: string;
  type: string;
  attribute?: string;
  race?: string;
}

export interface DeckEditorState {
  deck: Deck;
  selectedCard: Card | null;
  cardLibrary: Card[];
  filters: CardFilter;
  loading: boolean;
  error: string | null;
}
