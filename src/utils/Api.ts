import type { TopPlayersResponse } from '@/pages/Statistics/types';
import type {
  TournamentsListResponse,
  TournamentDetailResponse,
} from '@/pages/History/types';
import type {
  ApiResponse,
  DeckConvertRequest,
  DeckConvertResponse,
  DeckCategorizeResponse,
  LeaderboardResponse,
  StatsSummaryResponse,
  StatsDecksResponse,
  StatsCardsResponse,
  StatsDeckResponse,
  UpdateStatsResponse,
  LastLoginsResponse,
  CreateDeckRequest,
  UpdateDeckRequest,
  SavedDeckResponse,
  AllDecksApiResponse,
  LikeStatusResponse,
  LikeResponse,
  CommentResponse,
  ProfileCustomizationResponse,
  UpdateProfileResponse,
  PlayerDecksResponse,
  UserCountResponse,
  DatabaseResponse,
  DiscordUser,
  OmegaDeckConvertResponse,
  LocalDeckServerResponse,
  RoomListResponse,
  JoinRoomResponse,
  CardsSearchParams,
  CardsSearchResponse,
  Card,
  PlayerData,
  CategorizedDeck,
  InitialStatisticsRequest,
  InitialStatisticsResponse,
  DeckWikiResponse,
  DuelActivityPayload,
} from './ApiTypes';

// Re-export types for convenience
export type {
  ApiResponse,
  Pagination,
  LeaderboardResponse,
  SavedDeck,
  DeckWithFullDeck,
  AllDecksApiResponse,
  Comment,
  CommentsResponse,
  CommentResponse,
  LikeStatusResponse,
  LikeResponse,
  CardsSearchParams,
  CardsSearchResponse,
} from './ApiTypes';

// API Configuration
export const API_ENDPOINTS = {
  // Main API (omega-server-v3)
  MAIN: import.meta.env.VITE_API_URL || 'http://localhost:3000/v3',
  
  // External APIs
  DUELISTS_UNITE: 'https://duelistsunite.org',
  DUELISTS_UNITE_V3: import.meta.env.VITE_API_URL,
  DISCORD: 'https://discord.com/api',
  FORUM: 'https://forum.duelistsunite.org',
  YGOPRODECK: 'https://db.ygoprodeck.com/api/v7',
  OMEGA_DECKS: 'https://duelistsunite.org/omega-api-decks',
  LOCAL_DECK_SERVER: 'http://localhost:9999',
} as const;

// ApiResponse and other types are now imported from ApiTypes.ts

// Simple in-memory cache for tags and archetypes
let tagsCache: { data: string[] | null; timestamp: number } = { data: null, timestamp: 0 };
export type ArchetypeInfo = { archetype: string; ids: number[] };
let archetypesCache: { data: ArchetypeInfo[] | null; timestamp: number } = { data: null, timestamp: 0 };
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const tagsService = {
  getCache: () => tagsCache.data,
  isExpired: () => Date.now() - tagsCache.timestamp > CACHE_TTL,
  setCache: (tags: string[]) => {
    tagsCache = { data: tags, timestamp: Date.now() };
  },
  invalidate: () => {
    tagsCache = { data: null, timestamp: 0 };
  },
};

export const archetypesService = {
  getCache: () => archetypesCache.data,
  isExpired: () => Date.now() - archetypesCache.timestamp > CACHE_TTL,
  setCache: (archetypes: ArchetypeInfo[]) => {
    archetypesCache = { data: archetypes, timestamp: Date.now() };
  },
  invalidate: () => {
    archetypesCache = { data: null, timestamp: 0 };
  },
};

// Enhanced fetch function for main API
export const AUTH_EXPIRED_EVENT = 'omega:auth-expired';

export const fetchApi = async <T = any>(
  endpoint: string, 
  options?: RequestInit
): Promise<ApiResponse<T>> => {
  try {
    const url = endpoint.startsWith('http') ? endpoint : `${API_ENDPOINTS.MAIN}/${endpoint.replace(/^\//, '')}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      if (response.status === 401 && typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent(AUTH_EXPIRED_EVENT, {
            detail: { message: data?.message },
          })
        );
      }
      return { 
        data: data,  // Preserve original response structure
        ok: false,
        success: false,
        status: response.status
      };
    }

    return { 
      data: data,  // Preserve original response structure
      ok: true,
      success: true,
      status: response.status
    };
  } catch (error) {
    console.error('Network Error:', error);
    return { 
      ok: false, 
      success: false, 
      message: error instanceof Error ? error.message : 'Network error',
      status: 0 
    };
  }
};

// Specialized API functions
export const api = {
  // Main API endpoints
  main: {
    get: <T = any>(endpoint: string, options?: RequestInit) =>
      fetchApi<T>(endpoint, { ...options, method: "GET" }),

    post: (endpoint: string, data?: any, options?: RequestInit) =>
      fetchApi(endpoint, {
        ...options,
        method: "POST",
        body: data ? JSON.stringify(data) : undefined,
      }),

    put: <T = any>(endpoint: string, data?: any, options?: RequestInit) =>
      fetchApi<T>(endpoint, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        method: "PUT",
        body: data ? JSON.stringify(data) : undefined,
      }),

    delete: <T = any>(endpoint: string, options?: RequestInit) =>
      fetchApi<T>(endpoint, { ...options, method: "DELETE" }),

    // Deck analytics endpoint
    getDeckAnalytics: <T = any>(forceUpdate: boolean = false) =>
      fetchApi<T>(`deck-analytics${forceUpdate ? "?update=y" : ""}`, {
        method: "GET",
      }),

    getDuelsActivityStats: async (): Promise<
      ApiResponse<DuelActivityPayload>
    > => {
      try {
        return await fetchApi<DuelActivityPayload>("activity", {
          method: "GET",
        });
      } catch (error) {
        console.error("Get Duels Activity Error:", error);
        return {
          ok: false,
          success: false,
          message: error instanceof Error ? error.message : "Unknown error",
          status: 0
        };
      }
    },

    // Encode deck arrays to get deck code
    encodeDeck: async (
      deckData: DeckConvertRequest
    ): Promise<ApiResponse<DeckConvertResponse>> => {
      try {
        const response = await fetchApi<DeckConvertResponse>(`/convert`, {
          method: "POST",
          body: JSON.stringify(deckData),
        });
        return response;
      } catch (error) {
        console.error("Encode API Error:", error);
        return {
          ok: false,
          success: false,
          message: error instanceof Error ? error.message : "Unknown error",
          status: 0
        };
      }
    },

    // Decode deck code to get deck data
    decodeDeck: async (
      deckCode: string,
      full?: boolean
    ): Promise<ApiResponse<CategorizedDeck>> => {
      try {
        const response = await fetchApi<CategorizedDeck>(
          `/convert?code=${encodeURIComponent(deckCode)}${
            full ? "&full=y" : ""
          }`,
          {
            method: "GET",
          }
        );
        return response;
      } catch (error) {
        console.error("Decode API Error:", error);
        return {
          ok: false,
          success: false,
          message: error instanceof Error ? error.message : "Unknown error",
          status: 0
        };
      }
    },

    // Leaderboard endpoint
    getLeaderboard: async (): Promise<ApiResponse<LeaderboardResponse>> => {
      try {
        const response = await fetchApi<LeaderboardResponse>("leaderboard", {
          method: "GET",
        });
        return response;
      } catch (error) {
        console.error("Leaderboard API Error:", error);
        return {
          ok: false,
          success: false,
          message: error instanceof Error ? error.message : "Unknown error",
          status: 0
        };
      }
    },

    // PDF Generation endpoint
    generatePDF: async (
      params: Record<string, string>
    ): Promise<ApiResponse<Blob>> => {
      try {
        const queryParams = new URLSearchParams(params).toString();
        const url = `${API_ENDPOINTS.MAIN}/pdf/generate?${queryParams}`;

        const response = await fetch(url);

        if (!response.ok) {
          const errorData = await response.json();
          return {
            ok: false,
            success: false,
            message: errorData.error || "Failed to generate PDF",
            status: response.status,
          };
        }

        const blob = await response.blob();
        return {
          ok: true,
          data: blob,
          status: response.status,
        };
      } catch (error) {
        console.error("PDF Generation Error:", error);
        return {
          ok: false,
          success: false,
          message: error instanceof Error ? error.message : "Unknown error",
          status: 0
        };
      }
    },

    // Statistics v3 endpoints
    getStatsSummary: async (
      region?: number
    ): Promise<ApiResponse<StatsSummaryResponse>> => {
      try {
        const endpoint = region
          ? `stats/summary?region=${region}`
          : "stats/summary";
        return await fetchApi<StatsSummaryResponse>(endpoint, {
          method: "GET",
        });
      } catch (error) {
        console.error("Stats Summary Error:", error);
        return {
          ok: false,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },

    getStatsDecks: async (params?: {
      region?: number;
      limit?: number;
      minGames?: number;
      rating?: number;
      elo?: string;
      tier?: string;
    }): Promise<ApiResponse<StatsDecksResponse>> => {
      try {
        const queryParams = new URLSearchParams();
        if (params?.region)
          queryParams.append("region", params.region.toString());
        if (params?.limit) queryParams.append("limit", params.limit.toString());
        if (params?.minGames)
          queryParams.append("minGames", params.minGames.toString());
        if (params?.rating !== undefined)
          queryParams.append("rating", params.rating.toString());
        if (params?.elo) queryParams.append("elo", params.elo);
        if (params?.tier) queryParams.append("tier", params.tier);

        const endpoint = `stats/decks${
          queryParams.toString() ? `?${queryParams.toString()}` : ""
        }`;
        return await fetchApi<StatsDecksResponse>(endpoint, { method: "GET" });
      } catch (error) {
        console.error("Stats Decks Error:", error);
        return {
          ok: false,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },

    getStatsCards: async (params?: {
      region?: number;
      limit?: number;
      minGames?: number;
      zone?: string;
      elo?: string;
      tier?: string;
    }): Promise<ApiResponse<StatsCardsResponse>> => {
      try {
        const queryParams = new URLSearchParams();
        if (params?.region)
          queryParams.append("region", params.region.toString());
        if (params?.limit) queryParams.append("limit", params.limit.toString());
        if (params?.minGames)
          queryParams.append("minGames", params.minGames.toString());
        if (params?.zone) queryParams.append("zone", params.zone);
        if (params?.elo) queryParams.append("elo", params.elo);
        if (params?.tier) queryParams.append("tier", params.tier);

        const endpoint = `stats/cards${
          queryParams.toString() ? `?${queryParams.toString()}` : ""
        }`;
        return await fetchApi<StatsCardsResponse>(endpoint, { method: "GET" });
      } catch (error) {
        console.error("Stats Cards Error:", error);
        return {
          ok: false,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },

    getStatsDeck: async (
      deckName: string,
      region?: number
    ): Promise<ApiResponse<StatsDeckResponse>> => {
      try {
        const endpoint = region
          ? `stats/deck/${encodeURIComponent(deckName)}?region=${region}`
          : `stats/deck/${encodeURIComponent(deckName)}`;
        return await fetchApi<StatsDeckResponse>(endpoint, { method: "GET" });
      } catch (error) {
        console.error("Stats Deck Error:", error);
        return {
          ok: false,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },

    getMatchupStats: async (
      archetypes: string[],
      region: 17 | 33,
      options?: {
        limit?: number;
        minGames?: number;
        force?: boolean;
        maxDuels?: number;
      }
    ): Promise<ApiResponse<DeckWikiResponse>> => {
      try {
        const archetypeParam = archetypes.map(a => a.toLowerCase()).join('|');
        const queryParams = new URLSearchParams();
        queryParams.append('archetype', archetypeParam);
        queryParams.append('region', region.toString());
        
        if (options?.limit) queryParams.append('limit', options.limit.toString());
        if (options?.minGames) queryParams.append('minGames', options.minGames.toString());
        if (options?.force) queryParams.append('force', 'true');
        if (options?.maxDuels) queryParams.append('maxDuels', options.maxDuels.toString());
        
        const endpoint = `stats/matchup?${queryParams.toString()}`;
        return await fetchApi<DeckWikiResponse>(endpoint, { method: "GET" });
      } catch (error) {
        console.error("Matchup Stats Error:", error);
        return {
          ok: false,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },

    updateStats: async (): Promise<ApiResponse<UpdateStatsResponse>> => {
      try {
        return await fetchApi<UpdateStatsResponse>("stats/update", {
          method: "POST",
        });
      } catch (error) {
        console.error("Update Stats Error:", error);
        return {
          ok: false,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },

    getLastLogins: async (): Promise<ApiResponse<LastLoginsResponse>> => {
      try {
        return await fetchApi<LastLoginsResponse>("lastlogins", {
          method: "GET",
        });
      } catch (error) {
        console.error("Last Logins Error:", error);
        return {
          ok: false,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },

    getRankDistribution: async (): Promise<
      ApiResponse
    > => {
      try {
        return await fetchApi("rank-distribution", {
          method: "GET",
        });
      } catch (error) {
        console.error("Rank Distribution Error:", error);
        return {
          ok: false,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },

    // Saved Decks endpoints
    categorizeDeck: async (
      deckCodes: string[]
    ): Promise<ApiResponse<DeckCategorizeResponse>> => {
      try {
        return await fetchApi<DeckCategorizeResponse>("deck-categorize", {
          method: "POST",
          body: JSON.stringify({ decks: deckCodes }),
        });
      } catch (error) {
        console.error("Deck Categorize Error:", error);
        return {
          ok: false,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },

    // Saved Decks endpoints
    categorizeDeckGET: async (
      deckCode: string
    ): Promise<ApiResponse<CategorizedDeck>> => {
      try {
        return await fetchApi<CategorizedDeck>(
          "deck-categorize?code=" + encodeURIComponent(deckCode),
          {
            method: "GET",
          }
        );
      } catch (error) {
        console.error("Deck Categorize Error:", error);
        return {
          ok: false,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },

    createDeck: async (
      deckData: CreateDeckRequest,
      token: string
    ): Promise<ApiResponse<SavedDeckResponse>> => {
      try {
        return await fetchApi<SavedDeckResponse>("saved-decks", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(deckData),
        });
      } catch (error) {
        console.error("Create Deck Error:", error);
        return {
          ok: false,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },

    getUserDecks: async (userId: string, token?: string): Promise<any> => {
      try {
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        return await fetchApi(`saved-decks/${userId}`, {
          method: "GET",
          headers,
        });
      } catch (error) {
        console.error("Get User Decks Error:", error);
        return {
          ok: false,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },

    getDeck: async (
      deckId: string,
      token?: string
    ): Promise<ApiResponse> => {
      try {
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        return await fetchApi(`saved-decks/deck/${deckId}`, {
          method: "GET",
          headers,
        });
      } catch (error) {
        console.error("Get Deck Error:", error);
        return {
          ok: false,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },

    updateDeck: async (
      deckId: string,
      deckData: UpdateDeckRequest,
      token: string
    ): Promise<ApiResponse<SavedDeckResponse>> => {
      try {
        return await fetchApi<SavedDeckResponse>(`saved-decks/${deckId}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(deckData),
        });
      } catch (error) {
        console.error("Update Deck Error:", error);
        return {
          ok: false,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },

    deleteDeck: async (
      deckId: string,
      token: string
    ): Promise<ApiResponse<{ success: boolean }>> => {
      try {
        return await fetchApi<{ success: boolean }>(`saved-decks/${deckId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error("Delete Deck Error:", error);
        return {
          ok: false,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },

    // Deck info endpoint (tags + archetypes) with caching
    getDeckInfo: async (): Promise<ApiResponse<{ tags: string[]; archetypes: ArchetypeInfo[] }>> => {
      try {
        const response = await fetchApi<{ tags: string[]; archetypes: ArchetypeInfo[] }>('saved-decks/decks/info', {
          method: 'GET',
        });

        if (response.ok && response.data) {
          console.log(response.data)
          const tags = Array.isArray(response.data.tags) ? response.data.tags : [];
          const archetypes = Array.isArray(response.data.archetypes) ? response.data.archetypes : [];
          return { ok: true, data: { tags, archetypes } };
        }

        return response;
      } catch (error) {
        console.error('Get Deck Info Error:', error);
        return {
          ok: false,
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },

    getAllPublicDecks: async (params?: {
      name?: string;
      archetype?: string;
      tag?: string;
      sortBy?: "created_at" | "likes" | "comments";
      order?: "asc" | "desc";
      page?: number;
      limit?: number;
    }): Promise<ApiResponse> => {
      try {
        const queryParams = new URLSearchParams();
        if (params?.name) queryParams.append("name", params.name);
        if (params?.archetype)
          queryParams.append("archetype", params.archetype);
        if (params?.tag) queryParams.append("tag", params.tag);
        if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
        if (params?.order) queryParams.append("order", params.order);
        if (params?.page) queryParams.append("page", params.page.toString());
        if (params?.limit) queryParams.append("limit", params.limit.toString());

        const url = `saved-decks/public/all${
          queryParams.toString() ? `?${queryParams.toString()}` : ""
        }`;
        return await fetchApi<AllDecksApiResponse>(url, {
          method: "GET",
        });
      } catch (error) {
        console.error("Get All Public Decks Error:", error);
        return {
          ok: false,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },

    // Likes endpoints
    likeDeck: async (
      deckId: string,
      token: string
    ): Promise<ApiResponse<LikeResponse>> => {
      try {
        return await fetchApi<LikeResponse>(`saved-decks/${deckId}/like`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error("Like Deck Error:", error);
        return {
          ok: false,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },

    unlikeDeck: async (
      deckId: string,
      token: string
    ): Promise<ApiResponse<LikeResponse>> => {
      try {
        return await fetchApi<LikeResponse>(`saved-decks/${deckId}/like`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error("Unlike Deck Error:", error);
        return {
          ok: false,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },

    getLikeStatus: async (
      deckId: string,
      token: string
    ): Promise<ApiResponse<LikeStatusResponse>> => {
      try {
        return await fetchApi<LikeStatusResponse>(
          `saved-decks/${deckId}/like/status`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } catch (error) {
        console.error("Get Like Status Error:", error);
        return {
          ok: false,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },

    // Comments endpoints
    addComment: async (
      deckId: string,
      comment: string,
      token: string,
      parentId?: number
    ): Promise<ApiResponse<CommentResponse>> => {
      try {
        const body: { comment: string; parentId?: number } = { comment };
        if (parentId !== undefined) {
          body.parentId = parentId;
        }

        return await fetchApi<CommentResponse>(
          `saved-decks/${deckId}/comments`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
          }
        );
      } catch (error) {
        console.error("Add Comment Error:", error);
        return {
          ok: false,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },

    getComments: async (
      deckId: string
    ): Promise<ApiResponse> => {
      try {
        return await fetchApi(
          `saved-decks/${deckId}/comments`,
          {
            method: "GET",
          }
        );
      } catch (error) {
        console.error("Get Comments Error:", error);
        return {
          ok: false,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },

    updateComment: async (
      deckId: string,
      commentId: string,
      comment: string,
      token: string
    ): Promise<ApiResponse<CommentResponse>> => {
      try {
        return await fetchApi<CommentResponse>(
          `saved-decks/${deckId}/comments/${commentId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ comment }),
          }
        );
      } catch (error) {
        console.error("Update Comment Error:", error);
        return {
          ok: false,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },

    deleteComment: async (
      deckId: string,
      commentId: string,
      token: string
    ): Promise<ApiResponse<{ success: boolean }>> => {
      try {
        return await fetchApi<{ success: boolean }>(
          `saved-decks/${deckId}/comments/${commentId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } catch (error) {
        console.error("Delete Comment Error:", error);
        return {
          ok: false,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },

    // Tournament endpoints (v3)
    getTournaments: async (
      page: number = 1,
      limit: number = 20
    ): Promise<ApiResponse<TournamentsListResponse>> => {
      try {
        const queryParams = new URLSearchParams();
        queryParams.append("page", page.toString());
        queryParams.append("limit", limit.toString());

        const endpoint = `tournaments?${queryParams.toString()}`;
        return await fetchApi<TournamentsListResponse>(endpoint, {
          method: "GET",
        });
      } catch (error) {
        console.error("Get Tournaments Error:", error);
        return {
          ok: false,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },

    getLiveTournament: async (): Promise<
      ApiResponse<TournamentDetailResponse>
    > => {
      try {
        return await fetchApi<TournamentDetailResponse>("tournaments/live", {
          method: "GET",
        });
      } catch (error) {
        console.error("Get Live Tournament Error:", error);
        return {
          ok: false,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },

    getTournamentById: async (
      id: number
    ): Promise<ApiResponse<TournamentDetailResponse>> => {
      try {
        return await fetchApi<TournamentDetailResponse>(`tournaments/${id}`, {
          method: "GET",
        });
      } catch (error) {
        console.error("Get Tournament Error:", error);
        return {
          ok: false,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  },

  // External API helpers
  external: {
    // Duelists Unite API
    duelistsUnite: {
      // Get player basic data
      getPlayer: async (discordId: string): Promise<ApiResponse> => {
        try {
          const response = await fetch(
            `${API_ENDPOINTS.DUELISTS_UNITE_V3}/profile?id=${discordId}`
          );
          if (!response.ok) throw new Error("Failed to fetch player data");
          const result = await response.json();

          // Handle the new nested response format
          if (result.success && result.data) {
            return { data: result.data as PlayerData, ok: true };
          } else {
            throw new Error("Invalid response format from server");
          }
        } catch (error) {
          console.error("Duelists Unite API Error:", error);
          return {
            ok: false,
            message: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },

      // Get player profile customization data
      getPlayerCustomization: async (
        discordId: string
      ): Promise<ApiResponse<ProfileCustomizationResponse>> => {
        try {
          const response = await fetch(
            `${API_ENDPOINTS.DUELISTS_UNITE_V3}/duelist?id=${discordId}`
          );
          if (!response.ok) {
            if (response.status === 404)
              return { ok: false, data: { data: null } };
            throw new Error("Failed to fetch player profile");
          }
          const data = await response.json();
          return { ok: true, data };
        } catch (error) {
          console.error("Error fetching player profile:", error);
          return {
            ok: false,
            message: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },

      // Update player profile customization (FormData for file uploads)
      updatePlayerCustomization: async (
        formData: FormData
      ): Promise<ApiResponse<UpdateProfileResponse>> => {
        try {
          const response = await fetch(
            `${API_ENDPOINTS.DUELISTS_UNITE_V3}/duelist`,
            {
              method: "POST",
              body: formData,
              // Don't set Content-Type header - let browser set it with boundary for FormData
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            return {
              ok: false,
              success: false,
              message: errorData.error || "Failed to update profile",
              status: response.status,
            };
          }

          const data = await response.json();
          return {
            ok: true,
            success: true,
            data,
            status: response.status,
          };
        } catch (error) {
          console.error("Error updating player profile:", error);
          return {
            ok: false,
            success: false,
            message: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },

      // Get player decks and match history with pagination
      getPlayerDecks: async (
        discordId: string,
        options?: { tcgPage?: number; genesysPage?: number }
      ): Promise<ApiResponse<PlayerDecksResponse>> => {
        try {
          const params = new URLSearchParams();
          params.append("id", discordId);

          if (options?.tcgPage) {
            params.append("tcgPage", options.tcgPage.toString());
          }

          if (options?.genesysPage) {
            params.append("genesysPage", options.genesysPage.toString());
          }

          const response = await fetch(
            `${API_ENDPOINTS.DUELISTS_UNITE_V3}/decks?${params.toString()}`
          );
          if (!response.ok) {
            throw new Error("Failed to fetch player decks");
          }
          const data = await response.json();
          return { ok: true, data };
        } catch (error) {
          console.error("Error fetching player decks:", error);
          return {
            ok: false,
            message: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },

      // User count by rank for Omega (tapi)
      getUserCount: async (): Promise<ApiResponse<UserCountResponse>> => {
        try {
          const response = await fetch(
            `${API_ENDPOINTS.DUELISTS_UNITE}/tapi/usercount`
          );
          if (!response.ok) throw new Error("Failed to fetch user count");
          return { data: await response.json(), ok: true };
        } catch (error) {
          console.error("Duelists Unite API Error:", error);
          return {
            ok: false,
            message: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },

      getDatabase: async <T = any>(
        table: string,
        bucket?: string
      ): Promise<ApiResponse<DatabaseResponse<T>>> => {
        try {
          const url = `${
            API_ENDPOINTS.DUELISTS_UNITE
          }/api/database/read/${table}${bucket ? `?bucket=${bucket}` : ""}`;
          const response = await fetch(url);
          if (!response.ok) throw new Error("Failed to fetch database data");
          return { data: await response.json(), ok: true };
        } catch (error) {
          console.error("Duelists Unite Database Error:", error);
          return {
            ok: false,
            message: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    },

    // Discord API
    discord: {
      getUser: async (
        token: string,
        tokenType: string = "Bearer"
      ): Promise<ApiResponse<DiscordUser>> => {
        try {
          const response = await fetch(`${API_ENDPOINTS.DISCORD}/users/@me`, {
            headers: { authorization: `${tokenType} ${token}` },
          });
          if (!response.ok)
            throw new Error("Failed to fetch Discord user data");
          return { data: await response.json(), ok: true };
        } catch (error) {
          console.error("Discord API Error:", error);
          return {
            ok: false,
            message: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    },

    omegaDecks: {
      convertDeck: async (
        deckCode: string
      ): Promise<ApiResponse<OmegaDeckConvertResponse>> => {
        try {
          const token =
            "fc251ea703476dea9f037898611a14fa3d3e4cde99f6b3b81b4e25";
          const url = `${
            API_ENDPOINTS.OMEGA_DECKS
          }/convert?token=${token}&pretty&list=${encodeURIComponent(deckCode)}`;
          const response = await fetch(url);
          const data = await response.json();

          if (!response.ok || !data.success) {
            return {
              ok: false,
              data,
              message: data.meta?.error || "Failed to convert deck",
            };
          }

          return { data, ok: true };
        } catch (error) {
          console.error("Omega Decks API Error:", error);
          return {
            ok: false,
            message: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    },

    // GitHub Raw Content
    github: {
      getRawContent: async (url: string): Promise<ApiResponse<string>> => {
        try {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(
              `Failed to fetch GitHub content: ${response.status} ${response.statusText}`
            );
          }
          return { data: await response.text(), ok: true };
        } catch (error) {
          console.error("GitHub API Error:", error);
          return {
            ok: false,
            message: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    },

    // Local Deck Server
    localDeckServer: {
      addDeck: async (
        deckName: string,
        code: string
      ): Promise<ApiResponse<LocalDeckServerResponse>> => {
        try {
          const response = await fetch(
            `${API_ENDPOINTS.LOCAL_DECK_SERVER}/add-deck/${encodeURIComponent(
              deckName
            )}/${encodeURIComponent(code)}`,
            {
              method: "POST",
            }
          );
          if (!response.ok)
            throw new Error("Failed to add deck to local server");
          return { data: await response.json(), ok: true };
        } catch (error) {
          console.error("Local Deck Server Error:", error);
          return {
            ok: false,
            message: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },

      fetchRooms: async (): Promise<ApiResponse<RoomListResponse>> => {
        try {
          const response = await fetch(
            `${API_ENDPOINTS.LOCAL_DECK_SERVER}/room-list`,
            {
              method: "GET",
            }
          );

          // Parse the response once and reuse the data
          const responseData = await response.json();
          if (!response.ok) {
            return {
              ok: false,
              message: responseData.Reason || "Failed to fetch rooms",
            };
          }

          return { data: responseData, ok: true };
        } catch (error) {
          console.error("Local Deck Server Error:", error);
          return {
            ok: false,
            message: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },

      joinRoom: async (
        roomId: number,
        roomSecret?: string
      ): Promise<ApiResponse<JoinRoomResponse>> => {
        try {
          const url = roomSecret
            ? `${API_ENDPOINTS.LOCAL_DECK_SERVER}/join-room/${roomId}/${roomSecret}`
            : `${API_ENDPOINTS.LOCAL_DECK_SERVER}/join-room/${roomId}`;

          const response = await fetch(url, {
            method: "GET",
          });

          // Parse the response once and reuse the data
          const responseData = await response.json();
          if (!response.ok) {
            return {
              ok: false,
              message: responseData.Reason || "Failed to join room",
            };
          }

          return { data: responseData, ok: true };
        } catch (error) {
          console.error("Local Deck Server Error:", error);
          return {
            ok: false,
            message: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    },
  },

  // ============================================
  // CARDS SEARCH ENDPOINTS
  // ============================================
  cards: {
    /**
     * Get all cards from the database
     * @returns Promise with all cards data
     */
    getAll: async (): Promise<ApiResponse<Card[]>> => {
      try {
        return await fetchApi<Card[]>("cards/all", {
          method: "GET",
        });
      } catch (error) {
        console.error("Get All Cards Error:", error);
        return {
          ok: false,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },

    search: async (
      params?: CardsSearchParams
    ): Promise<ApiResponse<CardsSearchResponse>> => {
      try {
        const method = params?.method || "GET";

        // Separate method from search params
        const { method: _, ...searchParams } = params || {};

        if (method === "POST") {
          // POST: Send all params as JSON body
          const body: Record<string, any> = {};

          // Text search
          if (searchParams?.q) body.q = searchParams.q;
          if (searchParams?.desc) body.desc = searchParams.desc;

          // ID / Alias - handle array or single value
          if (searchParams?.id !== undefined) {
            body.id = Array.isArray(searchParams.id)
              ? searchParams.id
              : searchParams.id;
          }

          // Region (normalize to uppercase as per API docs)
          if (searchParams?.region)
            body.region = searchParams.region.toUpperCase();

          // Numeric filters
          if (searchParams?.atkMin !== undefined)
            body.atkMin = searchParams.atkMin;
          if (searchParams?.atkMax !== undefined)
            body.atkMax = searchParams.atkMax;
          if (searchParams?.defMin !== undefined)
            body.defMin = searchParams.defMin;
          if (searchParams?.defMax !== undefined)
            body.defMax = searchParams.defMax;
          if (searchParams?.levelMin !== undefined)
            body.levelMin = searchParams.levelMin;
          if (searchParams?.levelMax !== undefined)
            body.levelMax = searchParams.levelMax;

          // Attribute
          if (searchParams?.attribute) body.attribute = searchParams.attribute;

          // Race
          if (searchParams?.race) body.race = searchParams.race;

          // Type (normalize to uppercase as per API docs)
          if (searchParams?.type) body.type = searchParams.type.toUpperCase();

          // Sets
          if (searchParams?.setcode) body.setcode = searchParams.setcode;
          if (searchParams?.sets) body.sets = searchParams.sets;

          return await fetchApi<CardsSearchResponse>("cards", {
            method: "POST",
            body: JSON.stringify(body),
          });
        } else {
          // GET: Convert params to URL query string
          const queryParams = new URLSearchParams();

          // Text search
          if (searchParams?.q) queryParams.append("q", searchParams.q);
          if (searchParams?.desc) queryParams.append("desc", searchParams.desc);

          // ID / Alias - convert array to pipe-separated string for GET
          if (searchParams?.id !== undefined) {
            const idValue = Array.isArray(searchParams.id)
              ? searchParams.id.join("|")
              : searchParams.id.toString();
            queryParams.append("id", idValue);
          }

          // Region (normalize to uppercase as per API docs)
          if (searchParams?.region)
            queryParams.append("region", searchParams.region.toUpperCase());

          // Numeric filters
          if (searchParams?.atkMin !== undefined)
            queryParams.append("atkMin", searchParams.atkMin.toString());
          if (searchParams?.atkMax !== undefined)
            queryParams.append("atkMax", searchParams.atkMax.toString());
          if (searchParams?.defMin !== undefined)
            queryParams.append("defMin", searchParams.defMin.toString());
          if (searchParams?.defMax !== undefined)
            queryParams.append("defMax", searchParams.defMax.toString());
          if (searchParams?.levelMin !== undefined)
            queryParams.append("levelMin", searchParams.levelMin.toString());
          if (searchParams?.levelMax !== undefined)
            queryParams.append("levelMax", searchParams.levelMax.toString());

          // Attribute
          if (searchParams?.attribute)
            queryParams.append("attribute", searchParams.attribute);

          // Race
          if (searchParams?.race) queryParams.append("race", searchParams.race);

          // Type (normalize to uppercase as per API docs)
          if (searchParams?.type)
            queryParams.append("type", searchParams.type.toUpperCase());

          // Sets
          if (searchParams?.setcode)
            queryParams.append("setcode", searchParams.setcode);
          if (searchParams?.sets) queryParams.append("sets", searchParams.sets);

          const url = `cards${
            queryParams.toString() ? `?${queryParams.toString()}` : ""
          }`;
          return await fetchApi<CardsSearchResponse>(url, {
            method: "GET",
          });
        }
      } catch (error) {
        console.error("Cards Search Error:", error);
        return {
          ok: false,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  },

  // Statistics endpoints
  statistics: {
    getTopPlayers: async (
      region: number,
      limit: number = 64
    ): Promise<ApiResponse<TopPlayersResponse>> => {
      try {
        const queryParams = new URLSearchParams();
        queryParams.append("region", region.toString());
        queryParams.append("limit", limit.toString());

        return await fetchApi<TopPlayersResponse>(
          `top-players?${queryParams.toString()}`,
          { method: "GET" }
        );
      } catch (error) {
        console.error("Get Top Players Error:", error);
        return {
          ok: false,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },

    getInitialStatistics: async (
      params: InitialStatisticsRequest
    ): Promise<ApiResponse<InitialStatisticsResponse>> => {
      try {
        return await fetchApi<InitialStatisticsResponse>("initial-statistics", {
          method: "POST",
          body: JSON.stringify(params),
        });
      } catch (error) {
        console.error("Get Initial Statistics Error:", error);
        return {
          ok: false,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  },
};

// Backward compatibility
export { fetchApi as default };
