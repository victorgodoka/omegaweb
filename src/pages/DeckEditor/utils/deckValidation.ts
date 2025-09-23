import type { Deck, Card } from '../types';
import { DECK_LIMITS, COPY_LIMITS } from '@/utils/const';
import { getCardGenesysPoints } from '@/utils/Genesys';

export interface DeckValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

export interface CardValidationIssue {
  cardId: number;
  cardName: string;
  issue: string;
  severity: 'error' | 'warning';
}

export const validateDeck = (deck: Deck): DeckValidationResult => {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check deck size limits
  const mainDeckSize = deck.mainDeck.reduce((sum, card) => sum + card.quantity, 0);
  const extraDeckSize = deck.extraDeck.reduce((sum, card) => sum + card.quantity, 0);
  const sideDeckSize = deck.sideDeck.reduce((sum, card) => sum + card.quantity, 0);

  // Main deck validation
  if (mainDeckSize < DECK_LIMITS.MAIN_DECK.MIN) {
    errors.push(`Main deck must have at least ${DECK_LIMITS.MAIN_DECK.MIN} cards (currently ${mainDeckSize})`);
  }
  if (mainDeckSize > DECK_LIMITS.MAIN_DECK.MAX) {
    errors.push(`Main deck cannot exceed ${DECK_LIMITS.MAIN_DECK.MAX} cards (currently ${mainDeckSize})`);
  }

  // Extra deck validation
  if (extraDeckSize > DECK_LIMITS.EXTRA_DECK.MAX) {
    errors.push(`Extra deck cannot exceed ${DECK_LIMITS.EXTRA_DECK.MAX} cards (currently ${extraDeckSize})`);
  }

  // Side deck validation
  if (sideDeckSize > DECK_LIMITS.SIDE_DECK.MAX) {
    errors.push(`Side deck cannot exceed ${DECK_LIMITS.SIDE_DECK.MAX} cards (currently ${sideDeckSize})`);
  }

  // Check banlist compliance
  const banlistIssues = validateBanlistCompliance(deck);
  errors.push(...banlistIssues.filter(issue => issue.severity === 'error').map(issue => issue.issue));
  warnings.push(...banlistIssues.filter(issue => issue.severity === 'warning').map(issue => issue.issue));

  // Genesys format validation
  if (deck.banlist === 'TCG Genesys') {
    const genesysValidation = validateGenesysPoints(deck);
    warnings.push(...genesysValidation.warnings);
    errors.push(...genesysValidation.errors);

    // Check for forbidden card types in Genesys format
    const genesysCardTypeValidation = validateGenesysCardTypes(deck);
    errors.push(...genesysCardTypeValidation.errors);
    warnings.push(...genesysCardTypeValidation.warnings);
  }

  // Deck composition warnings
  const compositionWarnings = validateDeckComposition(deck);
  warnings.push(...compositionWarnings);

  return {
    isValid: errors.length === 0,
    warnings,
    errors
  };
};

export const validateBanlistCompliance = (deck: Deck): CardValidationIssue[] => {
  const issues: CardValidationIssue[] = [];

  // Create a map to track total quantities across all deck sections
  const cardQuantities = new Map<number, { card: Card, totalQuantity: number }>();

  // Count cards from all deck sections
  [...deck.mainDeck, ...deck.extraDeck, ...deck.sideDeck].forEach(deckCard => {
    const existing = cardQuantities.get(deckCard.card.id);
    if (existing) {
      existing.totalQuantity += deckCard.quantity;
    } else {
      cardQuantities.set(deckCard.card.id, {
        card: deckCard.card,
        totalQuantity: deckCard.quantity
      });
    }
  });

  // Check total quantities against limits
  cardQuantities.forEach(({ card, totalQuantity }) => {
    const maxAllowed = getMaxAllowedCopies(card, deck.banlist);
    
    if (totalQuantity > maxAllowed) {
      const status = getBanlistStatus(card, deck.banlist);
      issues.push({
        cardId: card.id,
        cardName: card.name,
        issue: `${card.name} is ${status} (max ${maxAllowed}) but you have ${totalQuantity} copies across all deck sections`,
        severity: 'error'
      });
    }
  });

  return issues;
};

export const validateGenesysPoints = (deck: Deck): { warnings: string[], errors: string[] } => {
  const warnings: string[] = [];
  const errors: string[] = [];

  let totalPoints = 0;
  const allCards = [...deck.mainDeck, ...deck.extraDeck, ...deck.sideDeck];

  allCards.forEach(deckCard => {
    const points = getCardGenesysPoints(deckCard.card.name);
    totalPoints += points * deckCard.quantity;
  });

  // Common Genesys point thresholds (adjust as needed)
  if (totalPoints > 1000) {
    warnings.push(`High Genesys points total: ${totalPoints} points`);
  }

  if (totalPoints > 1500) {
    errors.push(`Genesys points exceed recommended limit: ${totalPoints} points`);
  }

  return { warnings, errors };
};

export const validateGenesysCardTypes = (deck: Deck): { warnings: string[], errors: string[] } => {
  const warnings: string[] = [];
  const errors: string[] = [];

  const allCards = [...deck.mainDeck, ...deck.extraDeck, ...deck.sideDeck];

  allCards.forEach(deckCard => {
    const card = deckCard.card;
    const isLinkCard = card.frameType === 'link' || card.type.includes('Link');
    const isPendulumCard = card.frameType === 'pendulum' || card.type.includes('Pendulum');

    if (isLinkCard) {
      errors.push(`${card.name} is not allowed: Link cards are forbidden in TCG Genesys format`);
    }

    if (isPendulumCard) {
      errors.push(`${card.name} is not allowed: Pendulum cards are forbidden in TCG Genesys format`);
    }
  });

  return { warnings, errors };
};

export const validateDeckComposition = (deck: Deck): string[] => {
  const warnings: string[] = [];
  
  const mainDeckSize = deck.mainDeck.reduce((sum, card) => sum + card.quantity, 0);
  const monsterCount = deck.mainDeck
    .filter(card => card.card.type.includes('Monster'))
    .reduce((sum, card) => sum + card.quantity, 0);
  
  const spellCount = deck.mainDeck
    .filter(card => card.card.type.includes('Spell'))
    .reduce((sum, card) => sum + card.quantity, 0);
    
  const trapCount = deck.mainDeck
    .filter(card => card.card.type.includes('Trap'))
    .reduce((sum, card) => sum + card.quantity, 0);

  // Composition warnings
  if (mainDeckSize > 0) {
    const monsterRatio = monsterCount / mainDeckSize;
    const spellRatio = spellCount / mainDeckSize;
    
    if (monsterRatio < 0.3) {
      warnings.push(`Low monster count: ${monsterCount}/${mainDeckSize} (${Math.round(monsterRatio * 100)}%)`);
    }
    
    if (monsterRatio > 0.8) {
      warnings.push(`High monster count: ${monsterCount}/${mainDeckSize} (${Math.round(monsterRatio * 100)}%)`);
    }
    
    if (spellRatio < 0.1 && trapCount < 3) {
      warnings.push('Very low spell/trap count - consider adding more support cards');
    }
  }

  return warnings;
};

const getMaxAllowedCopies = (card: Card, banlist: 'TCG' | 'OCG' | 'TCG Genesys'): number => {
  if (banlist === 'TCG Genesys') return COPY_LIMITS.UNLIMITED;

  const banlistInfo = card.banlist_info;
  if (!banlistInfo) return COPY_LIMITS.UNLIMITED;

  const statusKey = `ban_${banlist.toLowerCase()}` as keyof typeof banlistInfo;
  const status = banlistInfo[statusKey];

  switch (status) {
    case 'Forbidden': return COPY_LIMITS.FORBIDDEN;
    case 'Limited': return COPY_LIMITS.LIMITED;
    case 'Semi-Limited': return COPY_LIMITS.SEMI_LIMITED;
    default: return COPY_LIMITS.UNLIMITED;
  }
};

const getBanlistStatus = (card: Card, banlist: 'TCG' | 'OCG' | 'TCG Genesys'): string => {
  if (banlist === 'TCG Genesys') return 'Unlimited';

  const banlistInfo = card.banlist_info;
  if (!banlistInfo) return 'Unlimited';

  const statusKey = `ban_${banlist.toLowerCase()}` as keyof typeof banlistInfo;
  return banlistInfo[statusKey] || 'Unlimited';
};
