
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

    // Leaderboard endpoint
    getLeaderboard: async () => {
      try {
        const response = await fetchApi<any>('leaderboard', { method: 'GET' });
        return response;
      } catch (error) {
        console.error('Leaderboard API Error:', error);
        return { ok: false, message: error instanceof Error ? error.message : 'Unknown error' };
      }
    },

    // PDF Generation endpoint
    generatePDF: async (params: Record<string, string>) => {
      try {
        const queryParams = new URLSearchParams(params).toString();
        const url = `${API_ENDPOINTS.MAIN}/pdf/generate?${queryParams}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          const errorData = await response.json();
          return { 
            ok: false, 
            message: errorData.error || 'Failed to generate PDF',
            status: response.status 
          };
        }

        const blob = await response.blob();
        return { 
          ok: true, 
          data: blob,
          status: response.status 
        };
      } catch (error) {
        console.error('PDF Generation Error:', error);
        return { ok: false, message: error instanceof Error ? error.message : 'Unknown error' };
      }
    },

    // Statistics v3 endpoints
    getStatsSummary: async (region?: number) => {
      try {
        const endpoint = region ? `stats/summary?region=${region}` : 'stats/summary';
        return await fetchApi<any>(endpoint, { method: 'GET' });
      } catch (error) {
        console.error('Stats Summary Error:', error);
        return { ok: false, message: error instanceof Error ? error.message : 'Unknown error' };
      }
    },

    getStatsDecks: async (params?: { region?: number; limit?: number; minGames?: number }) => {
      try {
        const queryParams = new URLSearchParams();
        if (params?.region) queryParams.append('region', params.region.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.minGames) queryParams.append('minGames', params.minGames.toString());
        
        const endpoint = `stats/decks${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        return await fetchApi<any>(endpoint, { method: 'GET' });
      } catch (error) {
        console.error('Stats Decks Error:', error);
        return { ok: false, message: error instanceof Error ? error.message : 'Unknown error' };
      }
    },

    getStatsCards: async (params?: { region?: number; limit?: number; minGames?: number; zone?: string }) => {
      try {
        const queryParams = new URLSearchParams();
        if (params?.region) queryParams.append('region', params.region.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.minGames) queryParams.append('minGames', params.minGames.toString());
        if (params?.zone) queryParams.append('zone', params.zone);
        
        const endpoint = `stats/cards${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        return await fetchApi<any>(endpoint, { method: 'GET' });
      } catch (error) {
        console.error('Stats Cards Error:', error);
        return { ok: false, message: error instanceof Error ? error.message : 'Unknown error' };
      }
    },

    getStatsDeck: async (deckName: string, region?: number) => {
      try {
        const endpoint = region 
          ? `stats/deck/${encodeURIComponent(deckName)}?region=${region}`
          : `stats/deck/${encodeURIComponent(deckName)}`;
        return await fetchApi<any>(endpoint, { method: 'GET' });
      } catch (error) {
        console.error('Stats Deck Error:', error);
        return { ok: false, message: error instanceof Error ? error.message : 'Unknown error' };
      }
    },

    updateStats: async () => {
      try {
        return await fetchApi<any>('stats/update', { method: 'POST' });
      } catch (error) {
        console.error('Update Stats Error:', error);
        return { ok: false, message: error instanceof Error ? error.message : 'Unknown error' };
      }
    },

    getLastLogins: async () => {
      try {
        return await fetchApi<any>('lastlogins', { method: 'GET' });
      } catch (error) {
        console.error('Last Logins Error:', error);
        return { ok: false, message: error instanceof Error ? error.message : 'Unknown error' };
      }
    },

    getRankDistribution: async () => {
      try {
        return await fetchApi<any>('rank-distribution', { method: 'GET' });
      } catch (error) {
        console.error('Rank Distribution Error:', error);
        return { ok: false, message: error instanceof Error ? error.message : 'Unknown error' };
      }
    },
  },

  // External API helpers
  external: {
    // Duelists Unite API
    duelistsUnite: {
      // Get player basic data
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

      // Get player profile customization data
      getPlayerCustomization: async (discordId: string) => {
        try {
          const response = await fetch(`${API_ENDPOINTS.DUELISTS_UNITE_V3}/duelist?id=${discordId}`);
          if (!response.ok) {
            if (response.status === 404) return { success: false, data: null };
            throw new Error('Failed to fetch player profile');
          }
          return await response.json();
        } catch (error) {
          console.error('Error fetching player profile:', error);
          return { success: false, data: null };
        }
      },

      // Update player profile customization (FormData for file uploads)
      updatePlayerCustomization: async (formData: FormData) => {
        try {
          const response = await fetch(`${API_ENDPOINTS.DUELISTS_UNITE_V3}/duelist`, {
            method: 'POST',
            body: formData,
            // Don't set Content-Type header - let browser set it with boundary for FormData
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            return { 
              ok: false, 
              success: false,
              message: errorData.error || 'Failed to update profile',
              status: response.status 
            };
          }
          
          const data = await response.json();
          return { 
            ok: true, 
            success: true,
            data,
            status: response.status 
          };
        } catch (error) {
          console.error('Error updating player profile:', error);
          return { 
            ok: false, 
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error' 
          };
        }
      },
      
      // Get player decks and match history with pagination
      getPlayerDecks: async (discordId: string, options?: { tcgPage?: number, genesysPage?: number }) => {
        try {
          const params = new URLSearchParams();
          params.append('id', discordId);
          
          if (options?.tcgPage) {
            params.append('tcgPage', options.tcgPage.toString());
          }
          
          if (options?.genesysPage) {
            params.append('genesysPage', options.genesysPage.toString());
          }
          
          const response = await fetch(`${API_ENDPOINTS.DUELISTS_UNITE_V3}/decks?${params.toString()}`);
          if (!response.ok) {
            throw new Error('Failed to fetch player decks');
          }
          return await response.json();
        } catch (error) {
          console.error('Error fetching player decks:', error);
          return { success: false, data: null };
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

    // GitHub Raw Content
    github: {
      getRawContent: async (url: string) => {
        try {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Failed to fetch GitHub content: ${response.status} ${response.statusText}`);
          }
          return { data: await response.text(), ok: true };
        } catch (error) {
          console.error('GitHub API Error:', error);
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
