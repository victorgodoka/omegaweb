// API Configuration
export const API_ENDPOINTS = {
  // Main API (omega-server-v3)
  MAIN: import.meta.env.VITE_API_URL || 'http://localhost:3000/v3',
  
  // External APIs
  DUELISTS_UNITE: 'https://duelistsunite.org',
  DUELISTS_UNITE_V3: 'https://duelistsunite.org/omega-web/v3',
  DISCORD: 'https://discord.com/api',
  FORUM: 'https://forum.duelistsunite.org',
  YGOPRODECK: 'https://db.ygoprodeck.com/api/v7',
  OMEGA_DECKS: 'https://duelistsunite.org/omega-api-decks',
  LOCAL_DECK_SERVER: 'http://localhost:9999',
} as const;

// Response types
export interface ApiResponse<T = any> {
  data?: T;
  ok: boolean;
  success?: boolean;
  message?: string;
  status?: number;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

// Enhanced fetch function for main API
export const fetchApi = async <T = any>(
  endpoint: string, 
  options?: RequestInit
): Promise<ApiResponse<T>> => {
  try {
    const url = endpoint.startsWith('http') ? endpoint : `${API_ENDPOINTS.MAIN}/${endpoint.replace(/^\//, '')}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    // Handle 304 Not Modified - no body content
    if (response.status === 304) {
      return { 
        data: undefined as T, 
        ok: false, // Mark as not ok so component knows to force refresh
        success: false,
        message: 'Data not modified - force refresh needed',
        status: response.status 
      };
    }

    const data = await response.json();
    
    if (!response.ok) {
      console.error(`API Error [${response.status}]:`, data.message || response.statusText);
      return { 
        ok: false, 
        success: false, 
        message: data.message || response.statusText,
        status: response.status 
      };
    }

    return { 
      data: data.data || data, 
      ok: true, 
      success: data.success !== undefined ? data.success : true,
      message: data.message,
      status: response.status 
    };
  } catch (error) {
    console.error('Network Error:', error);
    return { 
      ok: false, 
      success: false, 
      message: error instanceof Error ? error.message : 'Network error occurred' 
    };
  }
};

// Specialized API functions
export const api = {
  // Main API endpoints
  main: {
    get: <T = any>(endpoint: string, options?: RequestInit) => 
      fetchApi<T>(endpoint, { ...options, method: 'GET' }),
    
    post: <T = any>(endpoint: string, data?: any, options?: RequestInit) => 
      fetchApi<T>(endpoint, {
        ...options,
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      }),
    
    put: <T = any>(endpoint: string, data?: any, options?: RequestInit) => 
      fetchApi<T>(endpoint, {
        ...options,
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      }),
    
    delete: <T = any>(endpoint: string, options?: RequestInit) => 
      fetchApi<T>(endpoint, { ...options, method: 'DELETE' }),
    
    // Deck analytics endpoint
    getDeckAnalytics: <T = any>(forceUpdate: boolean = false) => 
      fetchApi<T>(`deck-analytics${forceUpdate ? '?update=y' : ''}`, { method: 'GET' }),
    
    // Encode deck arrays to get deck code
    encodeDeck: async (deckData: { main: number[], side: number[], extra: number[] }) => {
      try {
        const response = await fetchApi<any>(`/convert`, { 
          method: 'POST',
          body: JSON.stringify(deckData)
        });
        
        // fetchApi returns ApiResponse<T>, so we just return it directly
        return response;
      } catch (error) {
        console.error('Encode API Error:', error);
        return { ok: false, message: error instanceof Error ? error.message : 'Unknown error' };
      }
    },

    // Decode deck code to get deck data
    decodeDeck: async (deckCode: string) => {
      try {
        const response = await fetchApi<any>(`/convert?code=${encodeURIComponent(deckCode)}`, { 
          method: 'GET' 
        });
        
        // fetchApi returns ApiResponse<T>, so we just return it directly
        return response;
      } catch (error) {
        console.error('Decode API Error:', error);
        return { ok: false, message: error instanceof Error ? error.message : 'Unknown error' };
      }
    },
  },

  // External API helpers
  external: {
    // Duelists Unite API
    duelistsUnite: {
      getPlayer: async (discordId: string) => {
        try {
          const response = await fetch(`${API_ENDPOINTS.DUELISTS_UNITE_V3}/profile?id=${discordId}`);
          if (!response.ok) throw new Error('Failed to fetch player data');
          const result = await response.json();
          
          // Handle the new nested response format
          if (result.success && result.data) {
            return { data: result.data, ok: true };
          } else {
            throw new Error('Invalid response format from server');
          }
        } catch (error) {
          console.error('Duelists Unite API Error:', error);
          return { ok: false, message: error instanceof Error ? error.message : 'Unknown error' };
        }
      },

      // User count by rank for Omega (tapi)
      getUserCount: async () => {
        try {
          const response = await fetch(`${API_ENDPOINTS.DUELISTS_UNITE}/tapi/usercount`);
          if (!response.ok) throw new Error('Failed to fetch user count');
          return { data: await response.json(), ok: true };
        } catch (error) {
          console.error('Duelists Unite API Error:', error);
          return { ok: false, message: error instanceof Error ? error.message : 'Unknown error' };
        }
      },

      getDatabase: async (table: string, bucket?: string) => {
        try {
          const url = `${API_ENDPOINTS.DUELISTS_UNITE}/api/database/read/${table}${bucket ? `?bucket=${bucket}` : ''}`;
          const response = await fetch(url);
          if (!response.ok) throw new Error('Failed to fetch database data');
          return { data: await response.json(), ok: true };
        } catch (error) {
          console.error('Duelists Unite Database Error:', error);
          return { ok: false, message: error instanceof Error ? error.message : 'Unknown error' };
        }
      },
    },

    // Discord API
    discord: {
      getUser: async (token: string, tokenType: string = 'Bearer') => {
        try {
          const response = await fetch(`${API_ENDPOINTS.DISCORD}/users/@me`, {
            headers: { authorization: `${tokenType} ${token}` },
          });
          if (!response.ok) throw new Error('Failed to fetch Discord user data');
          return { data: await response.json(), ok: true };
        } catch (error) {
          console.error('Discord API Error:', error);
          return { ok: false, message: error instanceof Error ? error.message : 'Unknown error' };
        }
      },
    },

    // Forum API
    forum: {
      getPosts: async () => {
        try {
          const response = await fetch(`${API_ENDPOINTS.FORUM}/posts.json`);
          if (!response.ok) throw new Error('Failed to fetch forum posts');
          return { data: await response.json(), ok: true };
        } catch (error) {
          console.error('Forum API Error:', error);
          return { ok: false, message: error instanceof Error ? error.message : 'Unknown error' };
        }
      },

      getCategories: async () => {
        try {
          const response = await fetch(`${API_ENDPOINTS.FORUM}/categories.json`);
          if (!response.ok) throw new Error('Failed to fetch forum categories');
          return { data: await response.json(), ok: true };
        } catch (error) {
          console.error('Forum API Error:', error);
          return { ok: false, message: error instanceof Error ? error.message : 'Unknown error' };
        }
      },
    },

    // YGOPRODeck API
    ygoproDeck: {
      getCardInfo: async (misc: boolean = true, options?: RequestInit) => {
        try {
          const url = `${API_ENDPOINTS.YGOPRODECK}/cardinfo.php${misc ? '?misc=yes' : ''}`;
          const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            ...options,
          });
          if (!response.ok) throw new Error('Failed to fetch card info');
          return { data: await response.json(), ok: true };
        } catch (error) {
          console.error('YGOPRODeck API Error:', error);
          return { ok: false, message: error instanceof Error ? error.message : 'Unknown error' };
        }
      },
    },

    // Omega Decks API
    omegaDecks: {
      convertDeck: async (deckCode: string) => {
        try {
          const token = 'fc251ea703476dea9f037898611a14fa3d3e4cde99f6b3b81b4e25';
          const url = `${API_ENDPOINTS.OMEGA_DECKS}/convert?token=${token}&pretty&list=${encodeURIComponent(deckCode)}`;
          const response = await fetch(url);
          const data = await response.json();
          
          if (!response.ok || !data.success) {
            return { 
              ok: false, 
              data,
              message: data.meta?.error || 'Failed to convert deck' 
            };
          }
          
          return { data, ok: true };
        } catch (error) {
          console.error('Omega Decks API Error:', error);
          return { ok: false, message: error instanceof Error ? error.message : 'Unknown error' };
        }
      },
    },

    // Local Deck Server
    localDeckServer: {
      addDeck: async (deckName: string, code: string) => {
        try {
          const response = await fetch(`${API_ENDPOINTS.LOCAL_DECK_SERVER}/add-deck/${encodeURIComponent(deckName)}/${encodeURIComponent(code)}`, {
            method: 'POST',
          });
          if (!response.ok) throw new Error('Failed to add deck to local server');
          return { data: await response.json(), ok: true };
        } catch (error) {
          console.error('Local Deck Server Error:', error);
          return { ok: false, message: error instanceof Error ? error.message : 'Unknown error' };
        }
      },

      fetchRooms: async () => {
        try {
          const response = await fetch(`${API_ENDPOINTS.LOCAL_DECK_SERVER}/room-list`, {
            method: 'GET',
          });
          
          // Parse the response once and reuse the data
          const responseData = await response.json();
          if (!response.ok) {
            return { 
              ok: false, 
              message: responseData.Reason || 'Failed to fetch rooms',
              code: responseData.Code 
            };
          }
          
          return { data: responseData, ok: true };
        } catch (error) {
          console.error('Local Deck Server Error:', error);
          return { ok: false, message: error instanceof Error ? error.message : 'Unknown error' };
        }
      },

      joinRoom: async (roomId: number, roomSecret?: string) => {
        try {
          const url = roomSecret 
            ? `${API_ENDPOINTS.LOCAL_DECK_SERVER}/join-room/${roomId}/${roomSecret}`
            : `${API_ENDPOINTS.LOCAL_DECK_SERVER}/join-room/${roomId}`;
          
          const response = await fetch(url, {
            method: 'GET',
          });
          
          // Parse the response once and reuse the data
          const responseData = await response.json();
          if (!response.ok) {
            return { 
              ok: false, 
              message: responseData.Reason || 'Failed to join room',
              code: responseData.Code 
            };
          }
          
          return { data: responseData, ok: true };
        } catch (error) {
          console.error('Local Deck Server Error:', error);
          return { ok: false, message: error instanceof Error ? error.message : 'Unknown error' };
        }
      },
    },
  },
};

// Backward compatibility
export { fetchApi as default };
