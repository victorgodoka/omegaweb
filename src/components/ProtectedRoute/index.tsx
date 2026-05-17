import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuthContext } from '@/contexts/AuthContext';
import { Icon } from '@iconify/react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for auth to load
    if (isLoading) return;

    // Check if user is logged in (id !== '0' means logged in)
    if (!user || user.id === '0') {
      navigate('/', { state: { from: window.location.hash.slice(1) } });
    }
  }, [user, isLoading, navigate]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <Icon 
            icon="mdi:loading" 
            className="text-6xl text-white animate-spin mx-auto mb-4"
          />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!user || user.id === '0') {
    return null;
  }

  return <>{children}</>;
};
