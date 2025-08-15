import { setCache, getCache, isCacheExpired, clearCache } from "@/utils/Cache";
import { compareCards } from "@/utils/Cards";
import { type ReactNode, useState, useEffect, useContext, createContext, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
// Import YGOAPI type from a central location if available
// import type { YGOAPI } from "@/types/YGOAPI";

// Get error messages with i18n support
const getMessages = (t: (key: string) => string) => ({
  SAVE_CACHE_ERROR: t("cache_errors.save_cache_error"),
  FETCH_API_ERROR: t("cache_errors.fetch_api_error"),
  INVALID_API_DATA: t("cache_errors.invalid_api_data"),
  NO_VALID_CARDS: t("cache_errors.no_valid_cards"),
  CACHE_LOAD_ERROR: t("cache_errors.cache_load_error"),
  CACHE_UPDATE_ERROR: t("cache_errors.cache_update_error"),
});

const DEBUG = false; // Set to true to enable debug logs
function debugLog(...args: any[]) { if (DEBUG) console.log(...args); }

type CacheContextType = {
  cardStats: YGOAPI[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
  saveCardStats: (data: YGOAPI[]) => Promise<void>;
  fetchCardStats: () => Promise<void>;
  fetchCardStatsFromAPI: () => Promise<void>;
  refreshCache: () => Promise<void>;
};

const CacheContext = createContext<CacheContextType | undefined>(undefined);

export const CacheProvider = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation();
  const [cardStats, setCardStats] = useState<YGOAPI[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isMounted = useRef(true);
  const isFetching = useRef(false);
  const MESSAGES = getMessages(t);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const saveCardStats = async (data: YGOAPI[]) => {
    try {
      await setCache(data, 'YGOAPI_cache');
      setCardStats(data);
      setLastUpdated(Date.now());
      setError(null);
    } catch (error: unknown) {
      debugLog('Erro ao salvar no cache:', error);
      setError(MESSAGES.SAVE_CACHE_ERROR);
    }
  };

  // Função para buscar dados da API
  const fetchCardStatsFromAPI = async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    setIsLoading(true);
    setError(null);
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    try {
      const response = await fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php?misc=yes', {
        signal: abortRef.current.signal
      });
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} - ${response.statusText}`);
      }
      const result = await response.json();
      if (!result.data || !Array.isArray(result.data) || result.data.length === 0) {
        throw new Error(MESSAGES.INVALID_API_DATA);
      }
      const cardStatsData: YGOAPI[] = result.data
        .filter(({ misc_info, humanReadableCardType }: YGOAPI) =>
          humanReadableCardType !== 'Token' &&
          misc_info?.[0]?.formats?.some(format => format === 'TCG' || format === 'OCG')
        )
        .sort(compareCards);
      if (cardStatsData.length === 0) {
        throw new Error(MESSAGES.NO_VALID_CARDS);
      }
      await saveCardStats(cardStatsData);
    } catch (error: unknown) {
      if ((error as any)?.name === 'AbortError') {
        debugLog('API request aborted');
      } else {
        debugLog('Erro ao buscar os dados da API:', error);
        setError(MESSAGES.FETCH_API_ERROR);
      }
    } finally {
      isFetching.current = false;
      setIsLoading(false);
    }
  };

  const fetchCardStats = async () => {
    if (isLoading || isFetching.current) return;
    setIsLoading(true);
    setError(null);
    try {
      const cache = await getCache('YGOAPI_cache');
      if (cache && cache.data && cache.timestamp) {
        if ((Array.isArray(cache.data) && cache.data.length === 0) || isCacheExpired(cache.timestamp)) {
          debugLog('Cache expirado ou vazio, apagando e buscando dados atualizados...');
          await clearCache('YGOAPI_cache');
          await fetchCardStatsFromAPI();
        } else {
          debugLog('Cache válido, carregando do IndexedDB.');
          setCardStats(() => cache.data as YGOAPI[]);
          setLastUpdated(cache.timestamp);
        }
      } else {
        debugLog('Nenhum cache encontrado, buscando da API...');
        await fetchCardStatsFromAPI();
      }
    } catch (error: unknown) {
      debugLog('Erro ao buscar os dados do cache ou API:', error);
      setError(MESSAGES.CACHE_LOAD_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCache = async () => {
    if (isFetching.current) return;
    setIsLoading(true);
    setError(null);
    try {
      await clearCache('YGOAPI_cache');
      await fetchCardStatsFromAPI();
    } catch (error: unknown) {
      debugLog('Erro ao atualizar o cache:', error);
      setError(MESSAGES.CACHE_UPDATE_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (cardStats.length === 0) {
      fetchCardStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const contextValue = useMemo(() => ({
    cardStats,
    isLoading,
    error,
    lastUpdated,
    saveCardStats,
    fetchCardStats,
    fetchCardStatsFromAPI,
    refreshCache,
  }), [cardStats, isLoading, error, lastUpdated]);

  return (
    <CacheContext.Provider value={contextValue}>
      {children}
    </CacheContext.Provider>
  );
};

export const useCache = (): CacheContextType => {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error('useCache must be used within a CacheProvider');
  }
  return context;
};

// Custom hook for granular status
export const useCacheStatus = () => {
  const { isLoading, error, lastUpdated } = useCache();
  return { isLoading, error, lastUpdated };
};
