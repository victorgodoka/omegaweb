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
