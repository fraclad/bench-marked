'use client'

// Check if user is authenticated and session is still valid
export async function checkAuth() {
  if (typeof window === 'undefined') return { isAuthenticated: false };

  const token = localStorage.getItem('benchmarked-token');
  const expiresAt = localStorage.getItem('benchmarked-expires-at');
  const username = localStorage.getItem('benchmarked-username');

  // No token or expiration time
  if (!token || !expiresAt) {
    clearAuth();
    return { isAuthenticated: false };
  }

  // Check if token is expired locally first
  const currentTime = Date.now();
  const expiration = parseInt(expiresAt);
  
  if (currentTime >= expiration) {
    clearAuth();
    return { isAuthenticated: false, expired: true };
  }

  // Verify token with server
  try {
    const response = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();

    if (response.ok && data.valid) {
      // Update expiration time if different from server
      if (data.expiresAt) {
        localStorage.setItem('benchmarked-expires-at', data.expiresAt.toString());
      }
      
      return {
        isAuthenticated: true,
        username: data.username || username,
        expiresAt: data.expiresAt
      };
    } else {
      // Token is invalid or expired
      clearAuth();
      return { 
        isAuthenticated: false, 
        expired: data.expired || false 
      };
    }
  } catch (error) {
    console.error('Auth check error:', error);
    // On network error, use local expiration check
    if (currentTime < expiration) {
      return {
        isAuthenticated: true,
        username,
        offline: true
      };
    } else {
      clearAuth();
      return { isAuthenticated: false };
    }
  }
}

// Clear all authentication data
export function clearAuth() {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('benchmarked-token');
  localStorage.removeItem('benchmarked-username');
  localStorage.removeItem('benchmarked-expires-at');
  localStorage.removeItem('benchmarked-authenticated'); // Remove old auth flag if present
}

// Get current user info without API call
export function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  
  const token = localStorage.getItem('benchmarked-token');
  const username = localStorage.getItem('benchmarked-username');
  const expiresAt = localStorage.getItem('benchmarked-expires-at');
  
  if (!token || !expiresAt) return null;
  
  // Check if expired
  if (Date.now() >= parseInt(expiresAt)) {
    clearAuth();
    return null;
  }
  
  return {
    username,
    expiresAt: parseInt(expiresAt)
  };
}

// Check how much time is left in session (in minutes)
export function getSessionTimeLeft() {
  const user = getCurrentUser();
  if (!user) return 0;
  
  const timeLeft = user.expiresAt - Date.now();
  return Math.max(0, Math.floor(timeLeft / (1000 * 60))); // Convert to minutes
}

// Auto logout when session expires
export function startSessionMonitor(onExpired) {
  if (typeof window === 'undefined') return;
  
  const checkInterval = setInterval(() => {
    const timeLeft = getSessionTimeLeft();
    
    if (timeLeft <= 0) {
      clearInterval(checkInterval);
      clearAuth();
      if (onExpired) onExpired();
    }
  }, 60000); // Check every minute
  
  return () => clearInterval(checkInterval);
} 