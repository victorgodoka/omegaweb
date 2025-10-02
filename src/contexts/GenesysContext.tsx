import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

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

const CACHE_KEY = 'genesys_points_cache';
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

interface CacheData {
  data: GenesysData;
  timestamp: number;
}

const parseGenesysConfig = async (configText: string): Promise<GenesysData> => {
  const genesysData: GenesysData = {};
  const lines = configText.split('\n');
  const BATCH_SIZE = 100; // Process 100 lines at a time
  
  const processBatch = (startIndex: number): Promise<void> => {
    return new Promise((resolve) => {
      const endIndex = Math.min(startIndex + BATCH_SIZE, lines.length);
      
      for (let i = startIndex; i < endIndex; i++) {
        const trimmedLine = lines[i].trim();
        
        // Look for lines that match the pattern: $setgenesyspoints [cardId] [points] --[cardName]
        const match = trimmedLine.match(/^\$setgenesyspoints\s+(\d+)\s+(\d+)\s+--(.+)$/);
        
        if (match) {
          const cardId = parseInt(match[1], 10);
          const points = parseInt(match[2], 10);
          
          if (!isNaN(cardId) && !isNaN(points)) {
            genesysData[cardId] = points;
          }
        }
      }
      
      // Use setTimeout to yield control back to the browser
      setTimeout(resolve, 0);
    });
  };
  
  // Process all lines in batches
  for (let i = 0; i < lines.length; i += BATCH_SIZE) {
    await processBatch(i);
  }
  
  return genesysData;
};

const loadFromCache = (): GenesysData | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const cacheData: CacheData = JSON.parse(cached);
    const now = Date.now();
    
    // Check if cache is still valid (within 2 hours)
    if (now - cacheData.timestamp < CACHE_DURATION) {
      return cacheData.data;
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
  const [genesysData, setGenesysData] = useState<GenesysData>({});
  const [isLoading, setIsLoading] = useState(false); // Start as false for lazy loading
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  const fetchGenesysData = async (): Promise<void> => {
    // Don't fetch if already initialized and has data
    if (hasInitialized && Object.keys(genesysData).length > 0) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Try to load from cache first
      const cachedData = loadFromCache();
      if (cachedData) {
        setGenesysData(cachedData);
        setLastUpdated(new Date());
        setHasInitialized(true);
        setIsLoading(false);
        return;
      }

      // Fetch from API
      const response = await fetch('https://ygo.anihelp.co.uk/public/ALL/Genesys.conf');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch Genesys config: ${response.status} ${response.statusText}`);
      }

      const configText = await response.text();
      const parsedData = await parseGenesysConfig(configText);

      // Save to cache
      saveToCache(parsedData);

      setGenesysData(parsedData);
      setLastUpdated(new Date());
      setHasInitialized(true);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setHasInitialized(true); // Mark as initialized even on error
      console.error('Error fetching Genesys data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = async (): Promise<void> => {
    // Clear cache and fetch fresh data
    localStorage.removeItem(CACHE_KEY);
    await fetchGenesysData();
  };

  // Initialize from cache only on mount, don't fetch from API
  useEffect(() => {
    const cachedData = loadFromCache();
    if (cachedData) {
      setGenesysData(cachedData);
      setLastUpdated(new Date());
      setHasInitialized(true);
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
