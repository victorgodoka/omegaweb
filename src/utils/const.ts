export const HANDTRAPS = [
  14558127, 
  59438930, 
  62015408, 
  73642296, 
  60643553, 
  52038441, 
];

// Deck size limits
export const DECK_LIMITS = {
  MAIN_DECK: { MIN: 40, MAX: 60 },
  EXTRA_DECK: { MIN: 0, MAX: 15 },
  SIDE_DECK: { MIN: 0, MAX: 15 }
} as const;

// Card copy limits by banlist status
export const COPY_LIMITS = {
  FORBIDDEN: 0,
  LIMITED: 1,
  SEMI_LIMITED: 2,
  UNLIMITED: 3
} as const;

// Banlist formats
export const BANLIST_FORMATS = {
  TCG: 'TCG 15.09.2025',
  OCG: 'OCG 15.09.2025',
  GENESYS: 'Genesys Points'
} as const;