import type { Card } from './ApiTypes';

/**
 * Determina a prioridade de ordenação de uma carta baseado em seu tipo
 * Retorna um número onde menor = maior prioridade
 */
function getCardSortPriority(card: Card): number {
  const typePrimary = card.type_primary?.toLowerCase() || '';
  const typeTags = card.type_tags.map(t => t.toLowerCase());
  const genreTags = card.genre_tags.map(t => t.toLowerCase());
  const categoryTags = card.category_tags.map(t => t.toLowerCase());

  // Helper functions
  const hasTag = (tag: string) => typeTags.includes(tag) || genreTags.includes(tag) || categoryTags.includes(tag);
  const isMonster = typePrimary === 'monster';
  const isSpell = typePrimary === 'spell';
  const isTrap = typePrimary === 'trap';

  // Monster types
  const isNormal = hasTag('normal');
  const isEffect = hasTag('effect');
  const isRitual = hasTag('ritual');
  const isPendulum = hasTag('pendulum');
  const isFusion = hasTag('fusion');
  const isSynchro = hasTag('synchro');
  const isXyz = hasTag('xyz');
  const isLink = hasTag('link');

  // Spell/Trap subtypes
  const isQuick = hasTag('quick-play') || hasTag('quick');
  const isContinuous = hasTag('continuous');
  const isField = hasTag('field');
  const isEquip = hasTag('equip');
  const isCounter = hasTag('counter');

  if (isMonster) {
    // 1: Monstros normais (não pendulum, não extra deck)
    if (isNormal && !isPendulum && !isRitual && !isFusion && !isSynchro && !isXyz && !isLink) {
      return 1;
    }

    // 2: Monstros de efeito (não pendulum, não extra deck)
    if (isEffect && !isPendulum && !isRitual && !isFusion && !isSynchro && !isXyz && !isLink) {
      return 2;
    }

    // 3: Rituais sem efeito
    if (isRitual && !isEffect && !isPendulum) {
      return 3;
    }

    // 4: Rituais com efeito
    if (isRitual && isEffect && !isPendulum) {
      return 4;
    }

    // 5: Pendulum normais
    if (isPendulum && isNormal && !isRitual && !isFusion && !isSynchro && !isXyz) {
      return 5;
    }

    // 6: Pendulum efeitos
    if (isPendulum && isEffect && !isRitual && !isFusion && !isSynchro && !isXyz) {
      return 6;
    }

    // 7: Pendulum rituais
    if (isPendulum && isRitual) {
      return 7;
    }

    // 8: Fusões sem efeito
    if (isFusion && !isEffect && !isPendulum) {
      return 8;
    }

    // 9: Fusões com efeito
    if (isFusion && isEffect && !isPendulum) {
      return 9;
    }

    // 10: Fusões pendulum
    if (isFusion && isPendulum) {
      return 10;
    }

    // 11: Synchro sem efeito
    if (isSynchro && !isEffect && !isPendulum) {
      return 11;
    }

    // 12: Synchro com efeito
    if (isSynchro && isEffect && !isPendulum) {
      return 12;
    }

    // 13: Synchro pendulum
    if (isSynchro && isPendulum) {
      return 13;
    }

    // 14: XYZ sem efeito
    if (isXyz && !isEffect && !isPendulum) {
      return 14;
    }

    // 15: XYZ com efeito
    if (isXyz && isEffect && !isPendulum) {
      return 15;
    }

    // 16: XYZ pendulum
    if (isXyz && isPendulum) {
      return 16;
    }

    // 17: Link sem efeito
    if (isLink && !isEffect) {
      return 17;
    }

    // 18: Link com efeito
    if (isLink && isEffect) {
      return 18;
    }
  }

  if (isSpell) {
    // 20: Spell quick
    if (isQuick) {
      return 20;
    }

    // 21: Spell contínua
    if (isContinuous) {
      return 21;
    }

    // 22: Spell campo
    if (isField) {
      return 22;
    }

    // 23: Spell equip
    if (isEquip) {
      return 23;
    }

    // 24: Spell ritual
    if (isRitual) {
      return 24;
    }

    // 19: Spell normal (sem quick/cont/field/equip/ritual)
    return 19;
  }

  if (isTrap) {
    // 26: Trap contínua
    if (isContinuous) {
      return 26;
    }

    // 27: Trap counter
    if (isCounter) {
      return 27;
    }

    // 25: Trap normal (sem contínua/counter)
    return 25;
  }

  // Fallback para tipos desconhecidos
  return 999;
}

/**
 * Compara duas cartas para ordenação
 * Retorna: negativo se a < b, positivo se a > b, 0 se iguais
 */
function compareCards(a: Card, b: Card): number {
  // 1. Comparar por prioridade de tipo
  const priorityA = getCardSortPriority(a);
  const priorityB = getCardSortPriority(b);

  if (priorityA !== priorityB) {
    return priorityA - priorityB;
  }

  // 2. Em caso de empate, comparar por Level (decrescente)
  const levelA = a.level ?? -1;
  const levelB = b.level ?? -1;

  if (levelA !== levelB) {
    return levelB - levelA; // Maior level primeiro
  }

  // 3. Comparar por ATK (decrescente)
  const atkA = a.atk ?? -1;
  const atkB = b.atk ?? -1;

  if (atkA !== atkB) {
    return atkB - atkA; // Maior ATK primeiro
  }

  // 4. Comparar por DEF (decrescente)
  const defA = a.def ?? -1;
  const defB = b.def ?? -1;

  if (defA !== defB) {
    return defB - defA; // Maior DEF primeiro
  }

  // 5. Comparar por ordem alfabética (usar name_en como padrão)
  const nameA = (a.name_en || a.name_pt || '').toLowerCase();
  const nameB = (b.name_en || b.name_pt || '').toLowerCase();

  return nameA.localeCompare(nameB);
}

/**
 * Ordena um array de cartas seguindo as prioridades definidas
 * @param cards Array de cartas para ordenar
 * @returns Novo array ordenado (não modifica o original)
 */
export function sortCards(cards: Card[]): Card[] {
  return [...cards].sort(compareCards);
}

