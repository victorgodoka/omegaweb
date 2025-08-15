import { type Dispatch, useContext, type FC, type ReactNode, useReducer, createContext } from 'react';
import { loadingReducer } from './loadingReducer';
import Loading from '@/ui/Loading';

export const LoadingContext = createContext<{
  isLoading: boolean;
  dispatch: Dispatch<LoadingActions>;
} | null>(null);

export const useLoadingContext = () => {
  const context = useContext(LoadingContext);

  if (!context) {
    throw new Error('useLoadingContext must be used inside the LoadingProvider');
  }

  return context;
};

export const LoadingProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, dispatch] = useReducer(loadingReducer, false);

  return (
    <LoadingContext.Provider value={{ isLoading, dispatch }}>
      {isLoading && <Loading />}
      {children}
    </LoadingContext.Provider>
  );
};
