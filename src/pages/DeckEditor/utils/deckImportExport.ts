import type { Deck } from '../types';

export interface YDKFormat {
  main: number[];
  extra: number[];
  side: number[];
}

export interface DeckExportOptions {
  format: 'ydk' | 'json' | 'text';
  includeMetadata?: boolean;
}

export const exportDeck = (deck: Deck, options: DeckExportOptions): string => {
  switch (options.format) {
    case 'ydk':
      return exportToYDK(deck);
    case 'json':
      return exportToJSON(deck, options.includeMetadata);
    case 'text':
      return exportToText(deck);
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
};

export const exportToYDK = (deck: Deck): string => {
  const lines: string[] = [];
  
  lines.push('#created by Omega Web');
  lines.push('#main');
  
  // Main deck
  deck.mainDeck.forEach(deckCard => {
    for (let i = 0; i < deckCard.quantity; i++) {
      lines.push(deckCard.card.id.toString());
    }
  });
  
  lines.push('#extra');
  
  // Extra deck
  deck.extraDeck.forEach(deckCard => {
    for (let i = 0; i < deckCard.quantity; i++) {
      lines.push(deckCard.card.id.toString());
    }
  });
  
  lines.push('!side');
  
  // Side deck
  deck.sideDeck.forEach(deckCard => {
    for (let i = 0; i < deckCard.quantity; i++) {
      lines.push(deckCard.card.id.toString());
    }
  });
  
  return lines.join('\n');
};

export const exportToJSON = (deck: Deck, includeMetadata = true): string => {
  const exportData = includeMetadata ? deck : {
    mainDeck: deck.mainDeck,
    extraDeck: deck.extraDeck,
    sideDeck: deck.sideDeck
  };
  
  return JSON.stringify(exportData, null, 2);
};

export const exportToText = (deck: Deck): string => {
  const lines: string[] = [];
  
  lines.push(`Deck: ${deck.name}`);
  lines.push(`Format: ${deck.format}`);
  lines.push(`Banlist: ${deck.banlist}`);
  lines.push('');
  
  // Main deck
  if (deck.mainDeck.length > 0) {
    lines.push('Main Deck:');
    deck.mainDeck.forEach(deckCard => {
      lines.push(`${deckCard.quantity}x ${deckCard.card.name}`);
    });
    lines.push('');
  }
  
  // Extra deck
  if (deck.extraDeck.length > 0) {
    lines.push('Extra Deck:');
    deck.extraDeck.forEach(deckCard => {
      lines.push(`${deckCard.quantity}x ${deckCard.card.name}`);
    });
    lines.push('');
  }
  
  // Side deck
  if (deck.sideDeck.length > 0) {
    lines.push('Side Deck:');
    deck.sideDeck.forEach(deckCard => {
      lines.push(`${deckCard.quantity}x ${deckCard.card.name}`);
    });
  }
  
  return lines.join('\n');
};

export const parseYDK = (ydkContent: string): YDKFormat => {
  const lines = ydkContent.split('\n').map(line => line.trim());
  const result: YDKFormat = {
    main: [],
    extra: [],
    side: []
  };
  
  let currentSection: 'main' | 'extra' | 'side' | null = null;
  
  for (const line of lines) {
    if (line.startsWith('#main')) {
      currentSection = 'main';
      continue;
    }
    
    if (line.startsWith('#extra')) {
      currentSection = 'extra';
      continue;
    }
    
    if (line.startsWith('!side')) {
      currentSection = 'side';
      continue;
    }
    
    // Skip comments and empty lines
    if (line.startsWith('#') || line.startsWith('!') || !line || isNaN(Number(line))) {
      continue;
    }
    
    const cardId = parseInt(line, 10);
    if (currentSection && !isNaN(cardId)) {
      result[currentSection].push(cardId);
    }
  }
  
  return result;
};

export const downloadDeck = (deck: Deck, format: 'ydk' | 'json' | 'text' = 'ydk') => {
  const content = exportDeck(deck, { format });
  const fileName = `${deck.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${format}`;
  
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

export const copyDeckToClipboard = async (deck: Deck, format: 'ydk' | 'json' | 'text' = 'text') => {
  const content = exportDeck(deck, { format });
  
  try {
    await navigator.clipboard.writeText(content);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};
