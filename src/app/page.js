'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { hasValidAuth, getCurrentUser, verifyAuth, logout } from '../lib/auth';
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
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 flex items-center justify-center">
        <FallingChairs />
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Get last 3 records for display
  const recentBenches = benches.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 flex flex-col">
      <FallingChairs />
      <div className="container mx-auto px-6 py-16 flex-grow relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-4 tracking-wide">
            bench-marked!
          </h1>
          <p className="text-xl md:text-2xl text-white/90 font-medium">
            Track where ur ass have sat on 😊
          </p>
          
          {/* Current User Display */}
          {currentUser && (
            <div className="mt-4 flex flex-col items-center space-y-2">
              <div className="flex items-center justify-center space-x-4">
                <span className="text-white/80 text-lg">
                  Logged in as: <strong>{currentUser}</strong>
                </span>
                <button 
                  onClick={handleLogout}
                  className="text-red-200 hover:text-red-100 text-sm underline transition-colors duration-200"
                >
                  Sign out
                </button>
              </div>
              <div className="text-white/50 text-xs">
                🗄️ Connected to MongoDB • {benches.length} record{benches.length !== 1 ? 's' : ''} loaded
              </div>
            </div>
          )}
        </div>

        {/* Main Action Button */}
        <div className="text-center mb-20">
          <button
            onClick={logCurrentBench}
            disabled={isLogging}
            className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-xl font-semibold py-6 px-12 rounded-2xl shadow-2xl transition-all duration-200 transform hover:scale-105 disabled:scale-100"
          >
            {isLogging ? (
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                <span>Getting your location...</span>
              </div>
            ) : (
              'log current bench location'
            )}
          </button>
        </div>

        {/* Data Error */}
        {dataError && (
          <div className="text-center mb-8">
            <div className="bg-red-600/20 border border-red-400/20 rounded-lg py-3 px-4 text-red-200 text-sm">
              ⚠️ {dataError}
            </div>
          </div>
        )}

        {/* Previous Benches */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-white mb-8">
            Previous benches
            {dataLoading && (
              <span className="ml-3 text-sm text-white/60">
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white/60"></div>
              </span>
            )}
          </h2>
          
          <div className="space-y-4 mb-8">
            {recentBenches.map((bench) => (
              <div
                key={bench.id}
                className="text-white/90 text-lg cursor-pointer hover:text-white transition-colors duration-200"
                onClick={navigateToAllBenches}
              >
                {bench.timestamp} {bench.location} - logged by {bench.loggedBy}
              </div>
            ))}
            
            {benches.length === 0 && !dataLoading && (
              <p className="text-white/70 text-lg italic">
                No benches logged yet. Start by logging your current location!
              </p>
            )}
          </div>

          {/* See All Link */}
          {benches.length > 3 && (
            <button 
              className="text-white/80 hover:text-white text-lg underline transition-colors duration-200"
              onClick={navigateToAllBenches}
            >
              (see all)
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-white/60 text-sm relative z-10">
        🤓 vibe-coded in Houston rip
      </footer>
    </div>
  );
}
