export type CardType = 'Monster' | 'Spell' | 'Trap';

export type CardAttribute = 'LIGHT' | 'DARK' | 'FIRE' | 'WATER' | 'EARTH' | 'WIND' | 'DIVINE';

export type MonsterType = 
  | 'Warrior' | 'Spellcaster' | 'Dragon' | 'Machine' | 'Beast' | 'Fiend' 
  | 'Fairy' | 'Zombie' | 'Aqua' | 'Pyro' | 'Rock' | 'Winged Beast' 
  | 'Plant' | 'Insect' | 'Thunder' | 'Dinosaur' | 'Sea Serpent' 
  | 'Reptile' | 'Psychic' | 'Divine-Beast' | 'Creator God' | 'Wyrm' | 'Cyberse';

export type SpellType = 'Normal' | 'Quick-Play' | 'Continuous' | 'Ritual';

export type TrapType = 'Normal' | 'Continuous' | 'Counter';

export type LinkArrow = 'Top-Left' | 'Top' | 'Top-Right' | 'Left' | 'Right' | 'Bottom-Left' | 'Bottom' | 'Bottom-Right';

export interface CardData {
  name: string;
  type: CardType;
  attribute: CardAttribute;
  level: number;
  atk: number;
  def: number;
  monsterType: MonsterType;
  spellType: SpellType;
  trapType: TrapType;
  description: string;
  artworkUrl: string;
  artworkFile: File | null;
  pendulumScale?: number | null;
  linkval?: number | null;
  linkArrows: LinkArrow[];
  isEffect?: boolean;
  isXyz?: boolean;
  isSynchro?: boolean;
  isFusion?: boolean;
  isLink?: boolean;
  isPendulum?: boolean;
  isRitual?: boolean;
}

export interface CardPreviewProps {
  cardData: CardData;
}

export interface ImageUploadProps {
  artworkUrl: string;
  artworkFile: File | null;
  onUrlChange: (url: string) => void;
  onFileChange: (file: File | null) => void;
}

export interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'textarea' | 'number';
  rows?: number;
  required?: boolean;
  error?: string;
}
