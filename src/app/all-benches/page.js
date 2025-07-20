'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { hasValidAuth, getCurrentUser, verifyAuth, logout } from '../../lib/auth';
import { getAllBenches, updateBench, deleteBench as deleteBenchRecord } from '../../lib/api';
import FallingChairs from '../components/FallingChairs';

export default function AllBenches() {
  const router = useRouter();
  const [benches, setBenches] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState('');
  const [saving, setSaving] = useState(false);

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

  const deleteBench = async (id) => {
    if (!confirm('Are you sure you want to delete this bench record?')) {
      return;
    }

          try {
        await deleteBenchRecord(id);
        
        // Remove from local state
      setBenches(benches.filter(bench => bench.id !== id));
      
      // Also remove from localStorage backup
      const updatedBenches = benches.filter(bench => bench.id !== id);
      localStorage.setItem('benchmarked-data', JSON.stringify(updatedBenches));
      
    } catch (error) {
      console.error('Failed to delete bench record:', error);
      
      if (error.message.includes('authentication') || error.message.includes('token')) {
        alert('Your session has expired. Please sign in again.');
        logout();
        router.push('/login');
      } else {
        alert('Failed to delete bench record. Please try again.');
      }
    }
  };

  const startEdit = (bench) => {
    setEditingId(bench.id);
    setEditForm({
      location: bench.location,
      loggedBy: bench.loggedBy,
      latitude: bench.latitude || 0,
      longitude: bench.longitude || 0
    });
  };

  const saveEdit = async () => {
    setSaving(true);
    
    try {
      const updates = {
        location: editForm.location,
        latitude: parseFloat(editForm.latitude) || 0,
        longitude: parseFloat(editForm.longitude) || 0
      };

      const updatedBench = await updateBench(editingId, updates);
      
      // Update local state
      setBenches(benches.map(bench => 
        bench.id === editingId ? updatedBench : bench
      ));
      
      // Update localStorage backup
      const updatedBenches = benches.map(bench => 
        bench.id === editingId ? updatedBench : bench
      );
      localStorage.setItem('benchmarked-data', JSON.stringify(updatedBenches));
      
      setEditingId(null);
      setEditForm({});
      
    } catch (error) {
      console.error('Failed to update bench record:', error);
      
      if (error.message.includes('authentication') || error.message.includes('token')) {
        alert('Your session has expired. Please sign in again.');
        logout();
        router.push('/login');
      } else {
        alert('Failed to update bench record. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp.replace(' CT', ''));
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatTime = (timestamp) => {
    const timePart = timestamp.split(' ').slice(-2).join(' '); // Get "5:30 PM CT"
    return timePart;
  };

  const formatCoordinate = (coord) => {
    return coord ? coord.toFixed(4) : '0.0000';
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 flex flex-col">
      <FallingChairs />
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-16 flex-grow relative z-10">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-16">
          <button 
            onClick={() => router.push('/')}
            className="text-white/80 hover:text-white text-sm mb-4 transition-colors duration-200"
          >
            ← Back to home
          </button>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold text-white mb-4 tracking-wide">
            bench-marked!
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-white/90 font-medium">
            track where ur ass have sat on 😊
          </p>
          <div className="mt-4 text-white/50 text-sm">
            🗄️ MongoDB Database • {benches.length} record{benches.length !== 1 ? 's' : ''} total
            {dataLoading && (
              <span className="ml-3">
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white/60"></div>
              </span>
            )}
          </div>
        </div>

        {/* Data Error */}
        {dataError && (
          <div className="text-center mb-8">
            <div className="bg-red-600/20 border border-red-400/20 rounded-lg py-3 px-4 text-red-200 text-sm max-w-2xl mx-auto">
              ⚠️ {dataError}
            </div>
          </div>
        )}

        {/* Table Container with proper scrolling */}
        <div className="w-full">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden" style={{ minWidth: '800px' }}>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-purple-300/50">
                    <th className="px-3 sm:px-4 py-3 sm:py-4 text-left text-white font-semibold text-sm sm:text-lg whitespace-nowrap">
                      date
                    </th>
                    <th className="px-3 sm:px-4 py-3 sm:py-4 text-left text-white font-semibold text-sm sm:text-lg whitespace-nowrap">
                      time
                    </th>
                    <th className="px-3 sm:px-4 py-3 sm:py-4 text-left text-white font-semibold text-sm sm:text-lg whitespace-nowrap">
                      location
                    </th>
                    <th className="px-3 sm:px-4 py-3 sm:py-4 text-left text-white font-semibold text-sm sm:text-lg whitespace-nowrap">
                      latitude
                    </th>
                    <th className="px-3 sm:px-4 py-3 sm:py-4 text-left text-white font-semibold text-sm sm:text-lg whitespace-nowrap">
                      longitude
                    </th>
                    <th className="px-3 sm:px-4 py-3 sm:py-4 text-left text-white font-semibold text-sm sm:text-lg whitespace-nowrap">
                      Account create
                    </th>
                    <th className="px-3 sm:px-4 py-3 sm:py-4 text-left text-white font-semibold text-sm sm:text-lg whitespace-nowrap">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {benches.map((bench) => (
                    <tr key={bench.id} className="border-b border-purple-300/30 hover:bg-white/5 transition-colors">
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-white/90 text-xs sm:text-sm whitespace-nowrap">
                        {formatDate(bench.timestamp)}
                      </td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-white/90 text-xs sm:text-sm whitespace-nowrap">
                        {formatTime(bench.timestamp)}
                      </td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-white/90 text-xs sm:text-sm">
                        {editingId === bench.id ? (
                          <input
                            type="text"
                            value={editForm.location}
                            onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                            className="bg-white/20 text-white placeholder-white/60 border border-white/30 rounded-lg px-2 py-1 w-full min-w-[150px] focus:outline-none focus:border-white/60 text-xs sm:text-sm"
                            placeholder="Location"
                            disabled={saving}
                          />
                        ) : (
                          <span className="max-w-[120px] sm:max-w-[200px] block truncate" title={bench.location}>
                            {bench.location}
                          </span>
                        )}
                      </td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-white/90 text-xs sm:text-sm font-mono whitespace-nowrap">
                        {editingId === bench.id ? (
                          <input
                            type="number"
                            step="0.0001"
                            value={editForm.latitude}
                            onChange={(e) => setEditForm({...editForm, latitude: e.target.value})}
                            className="bg-white/20 text-white placeholder-white/60 border border-white/30 rounded-lg px-2 py-1 w-full min-w-[100px] focus:outline-none focus:border-white/60 text-xs sm:text-sm"
                            placeholder="Latitude"
                            disabled={saving}
                          />
                        ) : (
                          formatCoordinate(bench.latitude)
                        )}
                      </td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-white/90 text-xs sm:text-sm font-mono whitespace-nowrap">
                        {editingId === bench.id ? (
                          <input
                            type="number"
                            step="0.0001"
                            value={editForm.longitude}
                            onChange={(e) => setEditForm({...editForm, longitude: e.target.value})}
                            className="bg-white/20 text-white placeholder-white/60 border border-white/30 rounded-lg px-2 py-1 w-full min-w-[100px] focus:outline-none focus:border-white/60 text-xs sm:text-sm"
                            placeholder="Longitude"
                            disabled={saving}
                          />
                        ) : (
                          formatCoordinate(bench.longitude)
                        )}
                      </td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-white/90 text-xs sm:text-sm whitespace-nowrap">
                        {bench.loggedBy}
                      </td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                        {editingId === bench.id ? (
                          <div className="flex space-x-1 sm:space-x-2">
                            <button
                              onClick={saveEdit}
                              disabled={saving}
                              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-2 sm:px-3 py-1 rounded-lg font-medium transition-colors text-xs sm:text-sm"
                            >
                              {saving ? (
                                <div className="flex items-center space-x-1">
                                  <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                                  <span className="hidden sm:inline">saving</span>
                                </div>
                              ) : (
                                'save'
                              )}
                            </button>
                            <button
                              onClick={cancelEdit}
                              disabled={saving}
                              className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-2 sm:px-3 py-1 rounded-lg font-medium transition-colors text-xs sm:text-sm"
                            >
                              cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex space-x-1 sm:space-x-2">
                            <button
                              onClick={() => startEdit(bench)}
                              className="bg-white/90 hover:bg-white text-purple-700 px-2 sm:px-3 py-1 rounded-lg font-medium transition-colors text-xs sm:text-sm"
                            >
                              edit
                            </button>
                            <button
                              onClick={() => deleteBench(bench.id)}
                              className="bg-red-600 hover:bg-red-700 text-white px-2 sm:px-3 py-1 rounded-lg font-medium transition-colors text-xs sm:text-sm"
                            >
                              del
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {benches.length === 0 && !dataLoading && (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-white/70 text-sm sm:text-lg">
                        No bench records found. Go back and log your first bench!
                      </td>
                    </tr>
                  )}
                  {dataLoading && (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-white/70 text-sm sm:text-lg">
                        <div className="flex items-center justify-center space-x-3">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white/60"></div>
                          <span>Loading bench records from MongoDB...</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="text-center mt-8 sm:mt-12">
          <button
            onClick={() => router.push('/')}
            className="bg-red-600 hover:bg-red-700 text-white text-base sm:text-lg font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-2xl shadow-2xl transition-all duration-200 transform hover:scale-105"
          >
            Log New Bench Location
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-white/60 text-sm relative z-10">
        🤓 vibe-coded in Houston rip
      </footer>
    </div>
  );
} 