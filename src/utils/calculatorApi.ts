// src/utils/calculatorApi.ts
import { AuthManager } from './auth';
import { api } from './Api';

export interface CardGroup {
  name: string;
  cards: string[];
  minDesiredCount: number;
  maxDesiredCount: number;
  searcherCards: string[];
}

export interface CalculatorConfiguration {
  deckCode: string;
  handSize: number;
  targetCards: CardGroup[];
}

export interface SaveCalculatorResponse {
  success: boolean;
  shareableId?: string;
  shareUrl?: string;
  message?: string;
}

export interface GetCalculatorResponse {
  success: boolean;
  data?: {
    deckCode: string;
    handSize: number;
    targetCards: CardGroup[];
    createdAt: string;
  };
  message?: string;
}

/**
 * Save calculator configuration (requires authentication)
 */
export async function saveCalculatorConfiguration(
  config: CalculatorConfiguration
): Promise<SaveCalculatorResponse> {
  try {
    const headers = AuthManager.getAuthHeader();
    const res = await api.main.post<SaveCalculatorResponse>('calculator/save', config, {
      headers: {
        ...headers,
      },
    });

    return {
      success: res.success || false,
      shareableId: (res.data as any)?.shareableId,
      shareUrl: (res.data as any)?.shareUrl,
      message: res.message,
    };
  } catch (error) {
    console.error('Error saving calculator configuration:', error);
    return {
      success: false,
      message: 'Network error while saving configuration',
    };
  }
}

/**
 * Get shared calculator configuration (public endpoint)
 */
export async function getSharedCalculatorConfiguration(
  shareableId: string
): Promise<GetCalculatorResponse> {
  try {
    const response = await api.main.get(`calculator/shared/${shareableId}`);
    
    return {
      success: response.success || false,
      data: response.data,
      message: response.message,
    };
  } catch (error) {
    console.error('Error fetching shared calculator configuration:', error);
    return {
      success: false,
      message: 'Network error while fetching configuration',
    };
  }
}
