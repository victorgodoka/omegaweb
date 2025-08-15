export interface FormData {
  deck: string;
  name: string;
  lastName: string;
  cardGameID: string;
  month: string;
  day: string;
  year: string;
  country: string;
  event: string;
  [key: string]: string; // Index signature for dynamic access
}

export interface FormErrors {
  [key: string]: string;
}

export interface ValidationRule {
  field: keyof FormData;
  name: string;
}

export interface PDFGenerationResponse {
  success: boolean;
  error?: string;
}

export interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  type?: 'text' | 'number' | 'textarea' | 'date';
  required?: boolean;
  min?: number;
  max?: number;
  rows?: number;
}

export interface ConvertAPIResponse {
  success: boolean
  data: ConvertData
}

export interface ConvertData {
  mainDeck: Cards[]
  extraDeck: Cards[]
  sideDeck: Cards[]
}

export interface Cards {
  id: number
  alias: number
  qtd: number
  name?: string
  desc?: string
  setcode?: Setcode
  type: number
  isSpell: boolean
  isTrap: boolean
  isExtra: boolean
}

export interface Setcode {
  data: number[]
}

