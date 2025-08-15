import type { Cards } from '../PDFGenerator/types';

export interface CardGroup {
  name: string;
  cards: string[]; // Array of card instance IDs (e.g., "123-0", "123-1")
  minDesiredCount: number; // Minimum cards from this group we want to draw
  maxDesiredCount: number; // Maximum cards from this group we want to draw
  searcherCards: string[]; // Array of searcher card instance IDs for this specific group
}

export interface CalculatorState {
  deckCode: string;
  handSize: number;
  deckData: any | null; // ConvertData type
  isLoading: boolean;
  isDeckValid: boolean;
  targetCards: CardGroup[];
  results: ProbabilityResult[] | null;
  shareableId: string | null;
  isSharing: boolean;
  // When true, auto-run calculations once shared data is loaded
  autoCalculate?: boolean;
}

export interface ProbabilityResult {
  groupName: string;
  totalCopies: number;
  minDesiredCount: number;
  maxDesiredCount: number;
  probabilities: { copies: number; probability: number }[];
  inDesiredRange: number; // Probability of drawing within the desired range
  atLeastMin: number; // Probability of drawing at least the minimum
  withSearchers?: number; // Probability including searchers (if any)
  // Quick odds for common effects
  destinyDraw: number;     // draw 1 (e.g., normal draw/upstart)
  greedDraw: number;       // draw 2 at once (e.g., Pot of Greed)
  prosperity3: number;     // find in next 3 (Pot of Prosperity 3)
  prosperity6: number;     // find in next 6 (Pot of Prosperity 6)
  desiresDraw: number;     // banish 10 unseen, then draw 2 (Pot of Desires)
}

export interface CardSelectorProps {
  cards: (Cards & { location: 'main' | 'extra' | 'side' })[];
  targetCards: CardGroup[];
  onAddTargetGroup: (group: CardGroup) => void;
  onRemoveTargetGroup: (index: number) => void;
  onUpdateTargetGroup: (index: number, group: CardGroup) => void;
}

export interface ProbabilityResultsProps {
  results: ProbabilityResult[];
  handSize: number;
}
