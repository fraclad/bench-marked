'use client'

// Helper function to get the correct API base path
function getApiBasePath() {
  return process.env.NODE_ENV === 'production' ? '/app/bench-marked/api' : '/api';
}

// Check if user has valid authentication
export function hasValidAuth() {
  if (typeof window === 'undefined') return false;
  
  const token = localStorage.getItem('benchmarked-token');
  const expiresAt = localStorage.getItem('benchmarked-expires-at');
  
  if (!token || !expiresAt) return false;
  
  return Date.now() < parseInt(expiresAt);
}

// Get current authenticated user info
export function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  
  if (!hasValidAuth()) return null;
  
  return {
    username: localStorage.getItem('benchmarked-username'),
    token: localStorage.getItem('benchmarked-token')
  };
}

// Check if current user is read-only (cannot perform CRUD operations)
export function isReadOnlyUser() {
  const user = getCurrentUser();
  if (!user) return true; // No user = read only
  
  // "user" username is read-only
  return user.username?.toLowerCase() === 'user';
}

// Verify token with server
export async function verifyAuth() {
  const user = getCurrentUser();
  if (!user) return false;
  
  try {
    const response = await fetch(`${getApiBasePath()}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      }
    });
    
    return response.ok;
  } catch (error) {
    console.error('Auth verification failed:', error);
    return false;
  }
}

// Clear authentication data
export function logout() {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('benchmarked-token');
  localStorage.removeItem('benchmarked-username'); 
  localStorage.removeItem('benchmarked-expires-at');
}
