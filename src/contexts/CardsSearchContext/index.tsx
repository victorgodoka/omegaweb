import { createContext, useContext, type FC, type ReactNode, useState, useCallback } from 'react';
import { api, type CardsSearchParams } from '@/utils/Api';
import { unwrapApiPayload } from '@/utils/unwrapApiPayload';
import type { Card } from '@/utils/ApiTypes';

interface CardsSearchContextType {
  cards: Card[];
  isLoading: boolean;
  error: string | null;
  searchCards: (params: CardsSearchParams) => Promise<Card[]>;
  clearSearch: () => void;
}

const CardsSearchContext = createContext<CardsSearchContextType | null>(null);

export const useCardsSearch = () => {
  const context = useContext(CardsSearchContext);

  if (!context) {
    throw new Error('useCardsSearch must be used inside the CardsSearchProvider');
  }

  return context;
};

export const CardsSearchProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchCards = useCallback(async (params: CardsSearchParams): Promise<Card[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.cards.search({
        ...params,
        region: 'ALL',
      });
      
      // API returns { success: true, data: { cards: [...], page, pageSize, total, totalPages } }
      const actualData = unwrapApiPayload<{ cards: Card[]; page?: number; pageSize?: number; total?: number; totalPages?: number }>(response.data);
      
      if (response.ok && actualData?.cards) {
        const filteredCards = actualData.cards
          .filter((card: Card) => {
            return (
              card.type_primary !== "Token" &&
              !card.category_tags.includes("RushCard") &&
              !card.category_tags.includes("PreErrata") &&
              !card.category_tags.includes("SkillCard")
            );
          })
          .reduce((acc: Card[], card: Card) => {
            // If card has DoubleScript tag, only keep one instance per id
            if (card.category_tags.includes("DoubleScript")) {
              const exists = acc.some(c => c.id === card.id);
              if (!exists) {
                acc.push(card);
              }
            } else {
              acc.push(card);
            }
            return acc;
          }, []);

        setCards(filteredCards);
        return filteredCards;
      } else {
        setError(response.data?.error || response.message || 'Failed to search cards');
        setCards([]);
        return [];
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setCards([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setCards([]);
    setError(null);
  }, []);

  return (
    <CardsSearchContext.Provider
      value={{
        cards,
        isLoading,
        error,
        searchCards,
        clearSearch,
      }}
    >
      {children}
    </CardsSearchContext.Provider>
  );
};
