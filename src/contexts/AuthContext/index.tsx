import { createContext, type Dispatch, useContext, type FC, type ReactNode, useReducer, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router'; 
import { authReducer } from './authReducer';

export const AuthContext = createContext<{
  user: User;
  isLoading: boolean;
  error: string | null;
  logout: () => void;
  dispatch: Dispatch<UserActions>;
} | null>(null);

export const useAuthContext = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthContext must be used inside the AuthProvider');
  }

  return context;
};

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const getStoredUser = (): User | null => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        return JSON.parse(storedUser) as User;
      }
    } catch (error) {
      console.error('Erro ao carregar usuário do localStorage:', error);
      setError('Erro ao carregar dados do usuário.');
    }
    return null;
  };

  const [user, dispatch] = useReducer(authReducer, getStoredUser() || {
    id: '0',
    username: '0',
    displayname: '0',
    avatar: '0',
  });

  const logout = useCallback(() => {
    dispatch({ type: 'LOGOUT' });

    localStorage.removeItem('user');
    localStorage.removeItem('discord_token');
    navigate('/');
  }, [dispatch, navigate]);

  useEffect(() => {
    try {
      if (user.id === '0') {
        localStorage.removeItem('user');
      } else {
        localStorage.setItem('user', JSON.stringify(user));
      }
    } catch (error) {
      console.error('Erro ao salvar usuário no localStorage:', error);
      setError('Erro ao salvar dados do usuário.');
    }
    setIsLoading(false);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isLoading, error, dispatch, logout }}>
      {children}
    </AuthContext.Provider>
  );
};