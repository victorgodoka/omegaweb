// src/hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react';
import { AuthManager, type LoginResponse, type VerifyResponse } from '../utils/auth';

export interface UseAuthReturn {
  isLoggedIn: boolean;
  isLoading: boolean;
  userId: string | null;
  token: string | null;
  login: (userId: string) => Promise<LoginResponse>;
  logout: () => void;
  verifyToken: () => Promise<VerifyResponse>;
}

/**
 * Custom hook for authentication management
 */
export function useAuth(): UseAuthReturn {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = AuthManager.getToken();
      const storedUserId = AuthManager.getUserId();

      if (storedToken && storedUserId) {
        // Verify token is still valid
        const verification = await AuthManager.verifyToken();
        
        if (verification.success) {
          setIsLoggedIn(true);
          setUserId(storedUserId);
          setToken(storedToken);
        } else {
          // Token is invalid, clear everything
          AuthManager.logout();
          setIsLoggedIn(false);
          setUserId(null);
          setToken(null);
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (userIdInput: string): Promise<LoginResponse> => {
    setIsLoading(true);
    
    try {
      const response = await AuthManager.login(userIdInput);
      
      if (response.success && response.token) {
        setIsLoggedIn(true);
        setUserId(userIdInput);
        setToken(response.token);
      }
      
      return response;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    AuthManager.logout();
    setIsLoggedIn(false);
    setUserId(null);
    setToken(null);
  }, []);

  const verifyToken = useCallback(async (): Promise<VerifyResponse> => {
    return await AuthManager.verifyToken();
  }, []);

  return {
    isLoggedIn,
    isLoading,
    userId,
    token,
    login,
    logout,
    verifyToken,
  };
}
