import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuthContext } from "@/contexts/AuthContext";
import { AuthManager } from "@/utils/auth";
import { api } from "@/utils/Api";
import { Icon } from '@iconify/react';

const Discord = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { dispatch, user } = useAuthContext();
  
  const [loadingState, setLoadingState] = useState<'authenticating' | 'fetching-profile' | 'generating-token' | 'redirecting' | 'error'>('authenticating');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [hasCheckedParams, setHasCheckedParams] = useState(false);

  const isTokenValid = () => {
    const tokenData = JSON.parse(localStorage.getItem('discord_token')!);
    return tokenData && tokenData.expiresAt && tokenData.expiresAt > Date.now();
  };

  const redirectPath = location.state?.from || '/';
  
  // Get OAuth parameters from localStorage (set by CatchDiscord component)
  const getOAuthParams = () => {
    return {
      accessToken: localStorage.getItem('access_token'),
      tokenType: localStorage.getItem('token_type'),
      expiresIn: localStorage.getItem('expires_in'),
      scope: localStorage.getItem('scope'),
      state: localStorage.getItem('state')
    };
  };

  const { accessToken, tokenType, expiresIn } = getOAuthParams();

  // Clean up localStorage after getting the values
  const cleanupOAuthParams = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
    localStorage.removeItem('expires_in');
    localStorage.removeItem('scope');
    localStorage.removeItem('state');
  };

  useEffect(() => {
    window.history.replaceState({}, document.title, window.location.pathname);
  }, []);

  useEffect(() => {
    // Skip if we're dealing with an already logged-in user
    if (user && user.id && user.id !== '0') {
      return;
    }

    // Wait a moment for localStorage parameters to be available
    if (!hasCheckedParams) {
      const timer = setTimeout(() => {
        setHasCheckedParams(true);
      }, 100); // Give 100ms for localStorage to be set by CatchDiscord
      
      return () => clearTimeout(timer);
    }

    if (!tokenType || !accessToken || !expiresIn) {
      setLoadingState('error');
      setErrorMessage('Invalid authentication parameters. Please try logging in again.');
      setTimeout(() => navigate('/'), 3000);
      return;
    }

    const fetchUserData = async () => {
      try {
        setLoadingState('authenticating');
        
        const discordResponse = await api.external.discord.getUser(accessToken, tokenType);
        console.log(discordResponse)
        if (!discordResponse.ok) {
          throw new Error('Failed to fetch Discord user data.');
        }

        const discordData = discordResponse.data;
        setLoadingState('fetching-profile');

        const playerResponse = await api.external.duelistsUnite.getPlayer(discordData.id);
        if (!playerResponse.ok) {
          throw new Error('Failed to fetch user profile data.');
        }

        const playerData = playerResponse.data;
        // Check if we have valid player data with the new response format
        const profile = playerData?.success && playerData?.id ? playerData : null;

        dispatch({
          type: 'SET_USER',
          payload: {
            id: discordData.id,
            username: discordData.username,
            displayname: discordData.global_name || discordData.username,
            avatar: profile?.avatar || discordData.avatar,
            profile,
          },
        });

        setLoadingState('generating-token');
        
        // Generate JWT token using Discord ID as user ID
        try {
          const jwtResponse = await AuthManager.login(discordData.id);
          if (!jwtResponse.success) {
            console.warn('JWT token generation failed:', jwtResponse.message);
            // Continue without JWT token - user can still use Discord features
            // JWT token will be generated when they try to use calculator features
          }
        } catch (jwtError) {
          console.warn('JWT token generation error:', jwtError);
          // Continue without JWT token - this is not a critical failure
        }

        const tokenExpiration = Date.now() + parseInt(expiresIn) * 1000;
        localStorage.setItem('discord_token', JSON.stringify({
          accessToken,
          tokenType,
          expiresAt: tokenExpiration,
        }));

        // Clean up OAuth parameters from localStorage after successful login
        cleanupOAuthParams();

        setLoadingState('redirecting');
        setTimeout(() => navigate(redirectPath), 1000);
      } catch (error) {
        console.error('Error during login:', error);
        setLoadingState('error');
        setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred during login.');
        setTimeout(() => navigate('/'), 5000);
      }
    };

    if (!isTokenValid()) {
      fetchUserData();
    } else {
      // If Discord token is valid but we need to ensure JWT token exists
      const handleExistingToken = async () => {
        if (user && user.id) {
          // Check if JWT token exists and is valid
          const jwtToken = AuthManager.getToken();
          if (!jwtToken) {
            // Generate JWT token for existing Discord user
            try {
              const jwtResponse = await AuthManager.login(user.id);
              if (!jwtResponse.success) {
                console.error('Failed to generate JWT token for existing user:', jwtResponse.message);
              }
            } catch (jwtError) {
              console.error('Error generating JWT token for existing user:', jwtError);
            }
          }
        }
        navigate(redirectPath);
      };
      
      handleExistingToken();
    }

  }, [accessToken, tokenType, expiresIn, dispatch, navigate, location.state, user, hasCheckedParams]);

  useEffect(() => {
    // Skip if we're in the middle of OAuth flow (have OAuth parameters)
    if (accessToken || tokenType || expiresIn) {
      return;
    }

    if (user && user.id && user.id !== '0') {
      // User is logged in, ensure they have a JWT token
      const ensureJWTToken = async () => {
        const jwtToken = AuthManager.getToken();
        if (!jwtToken) {
          try {
            const jwtResponse = await AuthManager.login(user.id);
            if (!jwtResponse.success) {
              console.error('Failed to generate JWT token:', jwtResponse.message);
            }
          } catch (jwtError) {
            console.error('Error generating JWT token:', jwtError);
          }
        }
      };
      
      ensureJWTToken();
      navigate('/');
    }
  }, [user, navigate, accessToken, tokenType, expiresIn]);

  const getLoadingMessage = () => {
    switch (loadingState) {
      case 'authenticating':
        return 'Authenticating with Discord...';
      case 'fetching-profile':
        return 'Fetching your profile...';
      case 'generating-token':
        return 'Setting up your session...';
      case 'redirecting':
        return 'Welcome back! Redirecting...';
      case 'error':
        return 'Authentication Error';
      default:
        return 'Connecting to Discord...';
    }
  };

  const getLoadingIcon = () => {
    if (loadingState === 'error') {
      return 'mdi:alert-circle';
    }
    if (loadingState === 'redirecting') {
      return 'mdi:check-circle';
    }
    return 'mdi:discord';
  };

  const getIconColor = () => {
    if (loadingState === 'error') {
      return 'text-red-400';
    }
    if (loadingState === 'redirecting') {
      return 'text-green-400';
    }
    return 'text-indigo-400';
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-900/50 via-purple-900/50 to-pink-900/50 flex flex-col items-center justify-center z-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-black/50"></div>
      
      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-md mx-auto px-6">
        {/* Discord Icon */}
        <div className="mb-8">
          <Icon 
            icon={getLoadingIcon()} 
            className={`text-8xl ${getIconColor()} ${loadingState === 'error' || loadingState === 'redirecting' ? '' : 'animate-pulse'}`}
          />
        </div>

        {/* Loading Message */}
        <h1 className="text-2xl font-bold text-white mb-4">
          {getLoadingMessage()}
        </h1>

        {/* Loading Description */}
        {loadingState === 'error' ? (
          <div className="text-center">
            <p className="text-red-300 mb-4">{errorMessage}</p>
            <p className="text-gray-300 text-sm">
              Redirecting to home page in a few seconds...
            </p>
          </div>
        ) : loadingState === 'redirecting' ? (
          <p className="text-green-300">
            Authentication successful! Taking you to your destination...
          </p>
        ) : (
          <div className="text-center">
            <p className="text-gray-300 mb-4">
              Please wait while we securely authenticate your Discord account
            </p>
            
            {/* Loading Progress Indicator */}
            <div className="flex items-center justify-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${loadingState === 'authenticating' ? 'bg-indigo-400 animate-bounce' : 'bg-gray-600'}`}></div>
              <div className={`w-2 h-2 rounded-full ${loadingState === 'fetching-profile' ? 'bg-indigo-400 animate-bounce' : 'bg-gray-600'}`} style={{ animationDelay: '0.1s' }}></div>
              <div className={`w-2 h-2 rounded-full ${loadingState === 'generating-token' ? 'bg-indigo-400 animate-bounce' : 'bg-gray-600'}`} style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className="mt-8 p-4 bg-black/30 rounded-lg border border-white/10">
          <div className="flex items-center justify-center mb-2">
            <Icon icon="mdi:shield-check" className="text-green-400 text-xl mr-2" />
            <span className="text-sm font-medium text-white">Secure Authentication</span>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            Your Discord credentials are handled securely. We only access your basic profile information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Discord;