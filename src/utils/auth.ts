// src/utils/auth.ts
import { api, API_ENDPOINTS } from './Api';

export interface LoginResponse {
  success: boolean;
  token?: string;
  expiresIn?: string;
  message?: string;
}

export interface VerifyResponse {
  success: boolean;
  user?: {
    id: string;
    iat: number;
    exp: number;
  };
  message?: string;
}

/**
 * Token management utilities
 */
export class AuthManager {
  private static readonly TOKEN_KEY = 'omega_auth_token';
  private static readonly USER_ID_KEY = 'omega_user_id';

  /**
   * Login with user ID and get JWT token
   */
  static async login(userId: string): Promise<LoginResponse> {
    try {
      const response = await api.main.post('auth/login', { userId });

      if (response.ok && response.success && response.data?.token) {
        this.setToken(response.data.token);
        this.setUserId(userId);
        return {
          success: true,
          token: response.data.token,
          expiresIn: response.data.expiresIn,
        };
      } else {
        return {
          success: false,
          message: response.message || 'Login failed',
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Network error during login',
      };
    }
  }

  /**
   * Set token in localStorage
   */
  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Set user ID in localStorage
   */
  static setUserId(userId: string): void {
    localStorage.setItem(this.USER_ID_KEY, userId);
  }

  /**
   * Get stored token from localStorage
   */
  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Get stored user ID from localStorage
   */
  static getUserId(): string | null {
    return localStorage.getItem(this.USER_ID_KEY);
  }

  /**
   * Check if user is logged in (has token)
   */
  static isLoggedIn(): boolean {
    return this.getToken() !== null;
  }

  /**
   * Verify if current token is valid
   */
  static async verifyToken(): Promise<VerifyResponse> {
    const token = this.getToken();
    
    if (!token) {
      return {
        success: false,
        message: 'No token found',
      };
    }

    try {
      const response = await api.main.get('auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.success) {
        // Token is invalid, clear stored data
        this.logout();
      }

      return {
        success: response.success || false,
        user: response.data?.user,
        message: response.message,
      };
    } catch (error) {
      console.error('Token verification error:', error);
      return {
        success: false,
        message: 'Network error during token verification',
      };
    }
  }

  /**
   * Logout - clear stored token and user data
   */
  static logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_ID_KEY);
  }

  /**
   * Get authorization header for API requests
   */
  static getAuthHeader(): { Authorization: string } | {} {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

/**
 * Higher-order function to make authenticated API requests
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const authHeaders = AuthManager.getAuthHeader();
  const fullUrl = url.startsWith('http') ? url : `${API_ENDPOINTS.MAIN}/${url.replace(/^\//, '')}`;

  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
  });

  // If request fails with 401, token might be expired
  if (response.status === 401) {
    AuthManager.logout();
    // You might want to redirect to login or show a message
    console.warn('Authentication failed - token may be expired');
  }

  return response;
}
