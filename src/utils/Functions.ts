import type { Player } from "@/pages/Live/types";

export const copyToClipboard = async (text: string, t?: (key: string) => string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
    const message = t ? t("clipboard.deck_copied") : "Deck code copied to clipboard.";
    alert(message);
  } catch (error) {
    const errorMsg = t ? t("clipboard.copy_error") : "Error copying text";
    console.error(errorMsg + ": ", error);
  }
};

export const downloadFile = (content: string, name: string): void => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = name;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url); // Libera o objeto URL
};

export const tcgHref = (name: string | undefined) => `https://partner.tcgplayer.com/c/4924450/1830156/21018?u=${encodeURIComponent(`https://www.tcgplayer.com/search/yugioh/product?Language=English&productLineName=yugioh&q=${name}&view=grid`)}`

export const decodeDuelData = (data: number, t?: (key: string) => string) => {
  const result = {
    mode: '',
    mr: 0,
    region: '',
    timer: 0,
    draw: false,
    startingHand: 0,
    noShuffle: false,
    isPublic: false,
    startlp: 0,
    duelRule: 0,
    allowBeta: false
  };

  const mode = (data & 0b11);
  if (t) {
    result.mode = mode === 1 ? t('game_modes.match') : mode === 2 ? t('game_modes.tag') : t('game_modes.single');
  } else {
    result.mode = mode === 1 ? 'Match' : mode === 2 ? 'Tag' : 'Single';
  }

  result.mr = (data >> 2) & 0b111;

  const region = (data >> 5) & 0b111;
  if (t) {
    result.region = region === 1 ? t('regions.tcg') : region === 2 ? t('regions.ocg') : region === 3 ? t('regions.world') : region === 4 ? t('regions.all') : t('regions.duel_links');
  } else {
    result.region = region === 1 ? 'TCG' : region === 2 ? 'OCG' : region === 3 ? 'World' : region === 4 ? 'All' : 'Duel Links';
  }

  result.timer = (data >> 8) & 0xFF;

  result.draw = ((data >> 16) & 0b1) === 1;

  result.startingHand = (data >> 17) & 0b11111;
  result.noShuffle = ((data >> 22) & 0b1) === 1;
  result.isPublic = ((data >> 23) & 0b1) === 1;

  result.startlp = (data >> 24) & 0xFF;

  result.duelRule = (data >> 32) & 0b111;
  result.allowBeta = ((data >> 35) & 0b1) === 1;

  return result;
}

export const getTopCut = (n: number): number => {
  switch (true) {
    case n >= 4 && n < 8:
      return 4
    case n >= 8:
      return 8
    default:
      return n
  }
}

export const getDuelist = (id: string, players: Player[] | null, t?: (key: string) => string) => {
  const byeText = t ? t('bye_player') : 'BYE';
  return players?.find(p => p.id === id) || { username: byeText, avatar: '/default.png', id: '', displayname: byeText };
}


export const getTierInfo = (rating: number, format: 'TCG' | 'OCG'): { name: string; image: string } => {
  let tierName = 'Iron';

  if (rating >= 2000) tierName = 'Omega';
  else if (rating >= 1450) tierName = 'Master';
  else if (rating >= 1000) tierName = 'Diamond';
  else if (rating >= 600) tierName = 'Platinum';
  else if (rating >= 350) tierName = 'Gold';
  else if (rating >= 200) tierName = 'Silver';
  else if (rating >= 50) tierName = 'Bronze';

  return {
    name: tierName,
    image: `/badges/${format}/${tierName.toLowerCase()}.png`
  };
};
