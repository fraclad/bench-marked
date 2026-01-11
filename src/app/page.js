'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { hasValidAuth, getCurrentUser, verifyAuth, logout, isReadOnlyUser } from '../lib/auth';
import { getAllBenches, createBench } from '../lib/api';
import FallingChairs from './components/FallingChairs';

export default function Home() {
  const router = useRouter();
  const [benches, setBenches] = useState([]);
  const [isLogging, setIsLogging] = useState(false);
  const [currentUser, setCurrentUser] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState('');
  const [canEdit, setCanEdit] = useState(false);

  // Check authentication on component mount
  useEffect(() => {
    const authenticateUser = async () => {
      // Check if user has valid local auth
      if (!hasValidAuth()) {
        router.push('/login');
        return;
      }

      // Get current user info
      const user = getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Verify with server
      const isValid = await verifyAuth();
      if (!isValid) {
        logout();
        router.push('/login');
        return;
      }
      
      setCurrentUser(user.username);
      setCanEdit(!isReadOnlyUser());
      setIsLoading(false);
    };

    authenticateUser();
  }, [router]);

  // Load bench data from MongoDB
  useEffect(() => {
    const loadBenchData = async () => {
      if (isLoading) return;
      
      setDataLoading(true);
      setDataError('');
      
      try {
        const data = await getAllBenches();
        setBenches(data);
      } catch (error) {
        console.error('Error loading bench data:', error);
        setDataError('Failed to load bench data. Please refresh to try again.');
        
        // Check if it's an auth error
        if (error.message.includes('authentication') || error.message.includes('unauthorized')) {
          logout();
          router.push('/login');
        }
      } finally {
        setDataLoading(false);
      }
    };

    loadBenchData();
  }, [isLoading, router]);

  const logCurrentBench = async () => {
    if (!canEdit) {
      alert('You do not have permission to add new records.');
      return;
    }

    setIsLogging(true);
    
    try {
      // Get user's current location
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const { latitude, longitude, accuracy } = position.coords;
      
      // Get location name using reverse geocoding
      let locationName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      
      try {
        const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
        const data = await response.json();
        
        if (data.city && data.principalSubdivision) {
          locationName = `${data.city}, ${data.principalSubdivision}`;
        } else if (data.locality && data.principalSubdivision) {
          locationName = `Near ${data.locality}, ${data.principalSubdivision}`;
        }
      } catch (error) {
        console.log('Could not get location name, using coordinates');
      }

      // Create timestamp
      const now = new Date();
      const timestamp = now.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/Chicago',
        timeZoneName: 'short'
      });

      // Create bench record in MongoDB
      const newBench = await createBench({
        timestamp,
        location: locationName,
        latitude,
        longitude,
        accuracy
      });

      // Update local state
      setBenches(prevBenches => [newBench, ...prevBenches]);
      
      // Also backup to localStorage for offline support
      const updatedBenches = [newBench, ...benches];
      localStorage.setItem('benchmarked-data', JSON.stringify(updatedBenches));
      
    } catch (error) {
      console.error('Error logging bench location:', error);
      
      if (error.message.includes('authentication') || error.message.includes('token')) {
        alert('Your session has expired. Please sign in again.');
        logout();
        router.push('/login');
      } else if (error.message.includes('location')) {
        alert('Could not get your location. Please make sure location services are enabled.');
      } else {
        alert('Failed to log bench location. Please check your connection and try again.');
      }
    } finally {
      setIsLogging(false);
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to sign out?')) {
      logout();
      router.push('/login');
    }
  };

  const navigateToAllBenches = () => {
    router.push('/all-benches');
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <FallingChairs />
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-transparent mx-auto mb-4" style={{ borderTopColor: 'var(--accent)' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Authenticating...</p>
        </div>
      </div>
    );
  }

  // Get last 3 records for display
  const recentBenches = benches.slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <FallingChairs />
      
      {/* Header bar */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">🪑</span>
          <span className="font-serif text-xl" style={{ color: 'var(--text-primary)' }}>bench-marked</span>
        </div>
        {currentUser && (
          <div className="flex items-center gap-4">
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {currentUser}
              {!canEdit && <span className="ml-2 text-xs px-2 py-0.5 rounded" style={{ background: 'var(--border)', color: 'var(--text-secondary)' }}>view only</span>}
            </span>
            <button 
              onClick={handleLogout}
              className="text-sm transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => e.target.style.color = 'var(--danger)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
            >
              sign out
            </button>
          </div>
        )}
      </header>

      <main className="flex-grow relative z-10 px-6 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-20">
            <h1 className="font-serif text-5xl md:text-6xl mb-4" style={{ color: 'var(--text-primary)' }}>
              bench-marked!
            </h1>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              A personal log of everywhere you&apos;ve sat.
            </p>
            <div className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>
              {benches.length} record{benches.length !== 1 ? 's' : ''} • MongoDB
            </div>
          </div>

          {/* Main Action */}
          {canEdit && (
            <div className="text-center mb-20">
              <button
                onClick={logCurrentBench}
                disabled={isLogging}
                className="px-10 py-4 text-lg font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:opacity-60"
                style={{ 
                  background: 'var(--accent)', 
                  color: 'var(--bg-primary)',
                }}
                onMouseEnter={(e) => { if (!isLogging) e.target.style.background = 'var(--accent-hover)' }}
                onMouseLeave={(e) => e.target.style.background = 'var(--accent)'}
              >
                {isLogging ? (
                  <span className="flex items-center gap-3">
                    <span className="animate-spin rounded-full h-5 w-5 border-2 border-transparent" style={{ borderTopColor: 'var(--bg-primary)' }}></span>
                    Getting location...
                  </span>
                ) : (
                  'Log current bench'
                )}
              </button>
            </div>
          )}

          {/* Error */}
          {dataError && (
            <div className="text-center mb-8">
              <div className="inline-block rounded-lg py-3 px-5 text-sm" style={{ background: 'rgba(196, 92, 79, 0.15)', color: 'var(--danger)', border: '1px solid rgba(196, 92, 79, 0.3)' }}>
                {dataError}
              </div>
            </div>
          )}

          {/* Recent Entries */}
          <div>
            <h2 className="text-sm font-medium uppercase tracking-wider mb-6" style={{ color: 'var(--text-muted)' }}>
              Recent entries
              {dataLoading && (
                <span className="ml-2 inline-block animate-spin rounded-full h-3 w-3 border border-transparent" style={{ borderTopColor: 'var(--text-muted)' }}></span>
              )}
            </h2>
            
            <div className="space-y-4">
              {recentBenches.map((bench) => (
                <div
                  key={bench.id}
                  className="p-4 rounded-lg cursor-pointer transition-all duration-200"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                  onClick={navigateToAllBenches}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--text-muted)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{bench.location}</p>
                      <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{bench.timestamp}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded shrink-0" style={{ background: 'var(--border)', color: 'var(--text-secondary)' }}>
                      {bench.loggedBy}
                    </span>
                  </div>
                </div>
              ))}
              
              {benches.length === 0 && !dataLoading && (
                <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                  No benches logged yet. {canEdit ? 'Start by logging your current location!' : 'Check back later for entries.'}
                </p>
              )}
            </div>

            {/* See All */}
            {benches.length > 0 && (
              <div className="text-center mt-8">
                <button 
                  className="text-sm transition-colors"
                  style={{ color: 'var(--accent)' }}
                  onClick={navigateToAllBenches}
                  onMouseEnter={(e) => e.target.style.color = 'var(--accent-hover)'}
                  onMouseLeave={(e) => e.target.style.color = 'var(--accent)'}
                >
                  View all {benches.length} entries →
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 text-sm" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
        made in Houston
      </footer>
    </div>
  );
}
