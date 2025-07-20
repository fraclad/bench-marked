'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FallingChairs from '../components/FallingChairs';

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
      const response = await fetch('/api/auth/login', {
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
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 flex flex-col items-center justify-center">
      <FallingChairs />
      <div className="w-full max-w-md px-6 flex-grow flex flex-col justify-center relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-4 tracking-wide">
            bench-marked!
          </h1>
          <p className="text-xl md:text-2xl text-white/90 font-medium">
            Track where ur ass have sat on 😊
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username Input */}
          <div>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-6 py-4 bg-white/90 text-gray-800 placeholder-gray-500 rounded-2xl text-lg font-medium focus:outline-none focus:ring-4 focus:ring-white/30 transition-all"
              placeholder="username"
              required
              autoComplete="username"
            />
          </div>

          {/* Password Input */}
          <div>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-6 py-4 bg-white/90 text-gray-800 placeholder-gray-500 rounded-2xl text-lg font-medium focus:outline-none focus:ring-4 focus:ring-white/30 transition-all"
              placeholder="password"
              required
              autoComplete="current-password"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-center">
              <p className="text-red-200 text-sm bg-red-600/20 rounded-lg py-3 px-4 border border-red-400/20">
                {error}
              </p>
            </div>
          )}

          {/* Sign In Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-xl font-semibold py-4 px-6 rounded-2xl shadow-2xl transition-all duration-200 transform hover:scale-105 disabled:scale-100"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>

        {/* Demo Info */}
        <div className="mt-12 text-center">
          <p className="text-white/70 text-sm mb-4">Connected to MongoDB</p>
          <div className="space-y-2 text-white/60 text-xs">
            <p>💡 Session expires after 30 minutes of inactivity</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-white/60 text-sm relative z-10">
        🤓 vibe-coded in Houston rip
      </footer>
    </div>
  );
} 