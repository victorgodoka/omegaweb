import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useLoadingContext } from '@/contexts/LoadingContext';
import { api } from '@/utils/Api';

interface GenesysData {
  [cardId: number]: number; // cardId -> points
}

interface GenesysContextType {
  genesysData: GenesysData;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refetch: () => Promise<void>;
  ensureData: () => Promise<void>; // Lazy load function
}

const GenesysContext = createContext<GenesysContextType | undefined>(undefined);

const CACHE_KEY = 'genesys_points_cache_v2';
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

// Hardcoded Genesys points that will be merged with fetched data
const HARDCODED_GENESYS_POINTS: GenesysData = {
  18144507: 30, // Add your hardcoded card ID and points here
  // Add more hardcoded entries as needed:
  // 12345678: 25,
  // 87654321: 15,
};

interface CacheData {
  data: GenesysData;
  timestamp: number;
}

// Helper function to merge hardcoded points with fetched data
const mergeGenesysData = (fetchedData: GenesysData): GenesysData => {
  // Merge hardcoded points with fetched data
  // Hardcoded points take precedence over fetched data
  return {
    ...fetchedData,
    ...HARDCODED_GENESYS_POINTS
  };
};


const loadFromCache = (): GenesysData | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const cacheData: CacheData = JSON.parse(cached);
    const now = Date.now();
    
    // Check if cache is still valid (within 2 hours)
    if (now - cacheData.timestamp < CACHE_DURATION) {
      // Merge cached data with hardcoded points
      return mergeGenesysData(cacheData.data);
    }
    
    // Cache expired, remove it
    localStorage.removeItem(CACHE_KEY);
    return null;
  } catch (error) {
    console.error('Error loading Genesys cache:', error);
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
};

const saveToCache = (data: GenesysData): void => {
  try {
    const cacheData: CacheData = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error saving Genesys cache:', error);
  }
};

interface GenesysProviderProps {
  children: ReactNode;
}

export const GenesysProvider: React.FC<GenesysProviderProps> = ({ children }) => {
  const { dispatch: loadingDispatch } = useLoadingContext();
  const [genesysData, setGenesysData] = useState<GenesysData>({});
  const [isLoading, setIsLoading] = useState(false); // Start as false for lazy loading
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [hasFetchedFromAPI, setHasFetchedFromAPI] = useState(false); // Track if we've actually fetched from API

  const fetchGenesysData = async (): Promise<void> => {
    // Don't fetch if we've already successfully fetched from API
    if (hasFetchedFromAPI) {
      return;
    }
    
    try {
      setIsLoading(true);
      loadingDispatch({ type: 'SET_LOADING', payload: true }); // Show global loading
      setError(null);

      // Try to load from cache first
      const cachedData = loadFromCache();
      if (cachedData) {
        setGenesysData(cachedData);
        setLastUpdated(new Date());
        setHasFetchedFromAPI(true); // Mark as fetched since cache contains API data
        setIsLoading(false);
        loadingDispatch({ type: 'SET_LOADING', payload: false }); // Hide global loading
        return;
      }
      
      const response = await api.external.github.getRawContent(
        'https://raw.githubusercontent.com/Pluani/ygoanihelpbanlists/refs/heads/main/Genesys.conf'
      );
      
      if (!response.ok || !response.data) {
        throw new Error(response.message || 'Failed to fetch Genesys config');
      }

      const configText = response.data;
      
      // Parse the raw fetched data first (without hardcoded points)
      const rawFetchedData: GenesysData = {};
      const lines = configText.split('\n');
      const BATCH_SIZE = 100;
      
      const processBatch = (startIndex: number): Promise<void> => {
        return new Promise((resolve) => {
          const endIndex = Math.min(startIndex + BATCH_SIZE, lines.length);
          
          for (let i = startIndex; i < endIndex; i++) {
            const trimmedLine = lines[i].trim();
            const match = trimmedLine.match(/^\$setgenesyspoints\s+(\d+)\s+(\d+)\s+--(.+)$/);
            
            if (match) {
              const cardId = parseInt(match[1], 10);
              const points = parseInt(match[2], 10);
              
              if (!isNaN(cardId) && !isNaN(points)) {
                rawFetchedData[cardId] = points;
              }
            }
          }
          
          setTimeout(resolve, 0);
        });
      };
      
      // Process all lines in batches
      for (let i = 0; i < lines.length; i += BATCH_SIZE) {
        await processBatch(i);
      }

      // Save raw fetched data to cache (without hardcoded points)
      saveToCache(rawFetchedData);

      // Merge with hardcoded points for state
      const mergedData = mergeGenesysData(rawFetchedData);
      setGenesysData(mergedData);
      setLastUpdated(new Date());
      setHasFetchedFromAPI(true); // Mark as successfully fetched
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      // Even on error, provide hardcoded points if we don't have any data
      if (Object.keys(genesysData).length === 0) {
        setGenesysData(HARDCODED_GENESYS_POINTS);
      }
      
      console.error('Error fetching Genesys data:', err);
    } finally {
      setIsLoading(false);
      loadingDispatch({ type: 'SET_LOADING', payload: false }); // Hide global loading
    }
  };

  const refetch = async (): Promise<void> => {
    // Clear cache and fetch fresh data
    localStorage.removeItem(CACHE_KEY);
    setHasFetchedFromAPI(false); // Reset fetch state to allow refetching
    await fetchGenesysData();
  };

  // Initialize from cache only on mount, don't fetch from API
  useEffect(() => {
    const cachedData = loadFromCache();
    if (cachedData) {
      setGenesysData(cachedData);
      setLastUpdated(new Date());
      setHasFetchedFromAPI(true); // Cache contains API data, so mark as fetched
    } else {
      setGenesysData(HARDCODED_GENESYS_POINTS);
    }
  }, []);

  const contextValue: GenesysContextType = {
    genesysData,
    isLoading,
    error,
    lastUpdated,
    refetch,
    ensureData: fetchGenesysData
  };

  return (
    <GenesysContext.Provider value={contextValue}>
      {children}
    </GenesysContext.Provider>
  );
};

export const useGenesys = (): GenesysContextType => {
  const context = useContext(GenesysContext);
  if (context === undefined) {
    throw new Error('useGenesys must be used within a GenesysProvider');
  }
  return context;
};

// Hook to get points for a specific card by ID
export const useCardGenesysPoints = (cardId: number): number => {
  const { genesysData } = useGenesys();
  return genesysData[cardId] || 0;
};

// Hook to get points for a specific card by name (fallback for existing code)
export const useCardGenesysPointsByName = (cardName: string, cardLibrary: any[]): number => {
  const { genesysData } = useGenesys();
  
  // Find the card in the library to get its ID
  const card = cardLibrary.find(c => c.name.toLowerCase() === cardName.toLowerCase());
  if (!card) return 0;
  
  return genesysData[card.id] || 0;
};
