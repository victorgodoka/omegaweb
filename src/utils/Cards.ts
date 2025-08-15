import type { Deck, Player } from "@/pages/Live/types";
import { api } from './Api';
import { toast } from "react-toastify";

export const compareCards = (a: YGOAPI, b: YGOAPI): number => {
  const typeOrder: { [key: string]: number } = {
    Monster: 1,
    Spell: 2,
    Trap: 3,
  };

  const monsterTypeOrder: { [key: string]: number } = {
    Normal: 1,
    Effect: 2,
    Ritual: 3,
    Fusion: 4,
    Synchro: 5,
    Xyz: 6,
    Link: 7,
  };

  const spellTypeOrder: { [key: string]: number } = {
    Normal: 1,
    'Quick-play': 2,
    Continuous: 3,
    Equip: 4,
    Field: 5,
  };

  const trapTypeOrder: { [key: string]: number } = {
    Normal: 1,
    Continuous: 2,
    Counter: 3,
  };

  const getTypePriority = (card: YGOAPI) => {
    const types = card.humanReadableCardType.split(' ');
    const type = types.find(t => ['Monster', 'Spell', 'Trap'].includes(t)) || '';
    const subtype = types.filter(t => !['Monster', 'Spell', 'Trap'].includes(t)).join(' ');
    return { type, subtype };
  };

  const { type: typeA, subtype: subtypeA } = getTypePriority(a);
  const { type: typeB, subtype: subtypeB } = getTypePriority(b);

  const typeComparison = (typeOrder[typeA] ?? 99) - (typeOrder[typeB] ?? 99);
  if (typeComparison !== 0) return typeComparison;

  if (typeA === 'Monster' && typeB === 'Monster') {
    const monsterComparison = (monsterTypeOrder[subtypeA] ?? 99) - (monsterTypeOrder[subtypeB] ?? 99);
    if (monsterComparison !== 0) return monsterComparison;

    if (a.level !== b.level) return b.level - a.level;

    return b.atk - a.atk;
  }

  if (typeA === 'Spell' && typeB === 'Spell') {
    const spellComparison = (spellTypeOrder[subtypeA] ?? 99) - (spellTypeOrder[subtypeB] ?? 99);
    if (spellComparison !== 0) return spellComparison;

    return a.name.localeCompare(b.name);
  }

  if (typeA === 'Trap' && typeB === 'Trap') {
    const trapComparison = (trapTypeOrder[subtypeA] ?? 99) - (trapTypeOrder[subtypeB] ?? 99);
    if (trapComparison !== 0) return trapComparison;

    return a.name.localeCompare(b.name);
  }

  return a.name.localeCompare(b.name);
};

export const loadDecklists = (decks: Deck[], cardStats: YGOAPI[]) => {
  try {
    return decks.map(({ id, passwords, set, code }) => {
      const deckData = {
        mainDeck: countOccurrences(
          passwords.mainDeck
            .map(id => cardStats.find(c => c.id === id || findWithImagesId(c.card_images, id)))
            .filter((c): c is YGOAPI => !!c && !isExtra(c))
            .sort(compareCards)
        ),
        extraDeck: countOccurrences(
          passwords.mainDeck
            .map(id => cardStats.find(c => c.id === id || findWithImagesId(c.card_images, id)))
            .filter((c): c is YGOAPI => !!c && isExtra(c))
            .sort(compareCards)
        ),
        sideDeck: countOccurrences(
          passwords.sideDeck
            .map(id => cardStats.find(c => c.id === id || findWithImagesId(c.card_images, id)))
            .filter((c): c is YGOAPI => !!c)
            .sort(compareCards)
        ),
      }

      return {
        id,
        set,
        code,
        passwords,
        ...deckData
      }
    })
  } catch (error) {
    console.log(error)
    return []
  }
}


export const findPlayer = (players: Player[], id: string) => players?.find(p => p.id === id) || { username: '', displayname: '', id, avatar: '' }
export const prepareDecklist = (main: number[], side: number[], player: Player) => {
  const lines = `#created by Duelist Unite\n#Deck used by ${player.displayname || player.username}`
  const mainLines = `#main & extra\n${main.join('\n')}`
  const sideLines = `!side\n${side.join('\n')}`
  return `${lines}\n${mainLines}\n${sideLines}`
}

export const addToOmega = async (code: string, player: Player) => {
  const deckName = `${player.displayname || player.username} deck`
  try {
    const response = await api.external.localDeckServer.addDeck(deckName, code);
    if (response.ok) {
      toast('Deck imported with success.')
    } else {
      toast.error('Failed to import deck. Make sure your YGO Omega is open and logged!')
    }
  } catch (error) {
    toast.error('Make sure your YGO Omega is open and logged!')
  }
}

export const countOccurrences = (array: { id: number, name: string }[]) => {
  const countMap = new Map<number, { id: number, name: string, qtd: number }>();

  array.forEach(({ id, name }) => {
    if (countMap.has(id)) {
      countMap.get(id)!.qtd += 1;
    } else {
      countMap.set(id, { id, name, qtd: 1 });
    }
  });

  return Array.from(countMap.values());
};

export const findWithImagesId = (arr: CardImage[], id: number) => arr.find(i => i.id === id)

export const fetchDeckCode = async (deckCode: string) => {
  const response = await api.external.omegaDecks.convertDeck(deckCode);
  return response.data;
}

export const isMonster = (card: YGOAPI) => card.humanReadableCardType.includes('Monster')
export const isVanilla = (card: YGOAPI) => card.humanReadableCardType.includes('Normal')

export const isExtra = (card: YGOAPI) => ['Fusion', 'Synchro', 'Xyz', 'Link'].some(type => card.humanReadableCardType.includes(type))
