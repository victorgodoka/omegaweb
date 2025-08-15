import { Navigate } from "react-router";

const CatchDiscordError = () => {
  // Extract OAuth parameters from Discord callback URL
  const extractDiscordParams = () => {
    const currentUrl = window.location.href;
    
    // Handle different URL formats that Discord might return
    let searchParams = '';
    
    // Case 1: Parameters in hash fragment (most common with hash routing)
    if (window.location.hash.includes('access_token')) {
      const hashPart = window.location.hash.substring(1); // Remove #
      searchParams = hashPart.includes('?') ? hashPart.split('?')[1] : hashPart;
    }
    // Case 2: Parameters in regular query string
    else if (window.location.search) {
      searchParams = window.location.search.substring(1); // Remove ?
    }
    // Case 3: Malformed URL that needs cleaning
    else if (currentUrl.includes('#%2F%3F=&')) {
      const cleanedUrl = currentUrl.replace('#%2F%3F=&', '?&');
      const url = new URL(cleanedUrl);
      searchParams = url.search.substring(1);
    }
    
    if (!searchParams) return null;
    
    // Parse the parameters
    const params = new URLSearchParams(searchParams);
    
    // Check if we have the required OAuth parameters
    const accessToken = params.get('access_token');
    const tokenType = params.get('token_type');
    const expiresIn = params.get('expires_in');
    
    if (accessToken && tokenType && expiresIn) {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('token_type', tokenType);
      localStorage.setItem('expires_in', expiresIn);  
      localStorage.setItem('scope', params.get('scope') || '');
      localStorage.setItem('state', params.get('state') || '');
      return {
        access_token: accessToken,
        token_type: tokenType,
        expires_in: expiresIn,
        scope: params.get('scope') || '',
        state: params.get('state') || ''
      };
    }
    
    return null;
  };

  const discordParams = extractDiscordParams();
  
  if (discordParams) {
    console.log('Discord OAuth params extracted:', discordParams);
    return <Navigate to={`/discord`} replace />;
  } else {
    console.warn('No valid Discord OAuth parameters found in URL:', window.location.href);
    return <Navigate to="/not-found" replace />;
  }
}

export default CatchDiscordError