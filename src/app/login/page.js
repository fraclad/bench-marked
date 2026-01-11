'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FallingChairs from '../components/FallingChairs';

// Helper function to get the correct API base path
function getApiBasePath() {
  return process.env.NODE_ENV === 'production' ? '/app/bench-marked/api' : '/api';
}

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Call authentication API
      const response = await fetch(`${getApiBasePath()}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Save authentication data
        localStorage.setItem('benchmarked-token', data.token);
        localStorage.setItem('benchmarked-username', data.username);
        localStorage.setItem('benchmarked-expires-at', (Date.now() + data.expiresIn).toString());
        
        // Redirect to home
        router.push('/');
      } else {
        setError(data.error || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Connection error. Please check your internet and try again.');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <FallingChairs />
      
      <main className="flex-grow flex items-center justify-center px-6 relative z-10">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-4xl">🪑</span>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl mb-3" style={{ color: 'var(--text-primary)' }}>
              bench-marked
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Sign in to continue
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg text-base focus:outline-none transition-all"
                style={{ 
                  background: 'var(--bg-card)', 
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)'
                }}
                placeholder="Username"
                required
                autoComplete="username"
                onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg text-base focus:outline-none transition-all"
                style={{ 
                  background: 'var(--bg-card)', 
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)'
                }}
                placeholder="Password"
                required
                autoComplete="current-password"
                onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div 
                className="rounded-lg py-3 px-4 text-sm"
                style={{ 
                  background: 'rgba(196, 92, 79, 0.15)', 
                  color: 'var(--danger)',
                  border: '1px solid rgba(196, 92, 79, 0.3)'
                }}
              >
                {error}
              </div>
            )}

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg text-base font-medium transition-all duration-200 disabled:opacity-60"
              style={{ 
                background: 'var(--accent)', 
                color: 'var(--bg-primary)'
              }}
              onMouseEnter={(e) => { if (!isLoading) e.target.style.background = 'var(--accent-hover)' }}
              onMouseLeave={(e) => e.target.style.background = 'var(--accent)'}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-transparent" style={{ borderTopColor: 'var(--bg-primary)' }}></span>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Info */}
          <div className="mt-8 text-center space-y-2">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Session expires after 30 minutes of inactivity
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 text-sm" style={{ color: 'var(--text-muted)' }}>
        made in Houston
      </footer>
    </div>
  );
}
