export interface MonsterCard {
  id: number;
  name: string;
  type: string;
  attribute: string;
  level: number;
  atk: number;
  def: number;
  image: string;
}

export interface SmallWorldStats {
  type: string;
  attribute: string;
  level: number;
  atk: number;
  def: number;
}

export interface SmallWorldChain {
  handCard: MonsterCard;
  bridgeCard: MonsterCard;
  targetCard: MonsterCard;
  handToBridgeConnection: string;
  bridgeToTargetConnection: string;
  isValid: boolean;
}

export interface CardSelectorProps {
  title: string;
  subtitle: string;
  selectedCard: MonsterCard | null;
  onCardSelect: (card: MonsterCard | null) => void;
  availableCards: MonsterCard[];
  placeholder: string;
}

export interface ChainDisplayProps {
  handCard: MonsterCard;
  targetCard: MonsterCard;
  validChains: SmallWorldChain[];
}

export interface BridgeResultsProps {
  chains: SmallWorldChain[];
  handCard: MonsterCard;
  targetCard: MonsterCard;
}
