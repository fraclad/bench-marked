'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { hasValidAuth, getCurrentUser, verifyAuth, logout, isReadOnlyUser } from '../../lib/auth';
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

  const deleteBench = async (id) => {
    if (!canEdit) {
      alert('You do not have permission to delete records.');
      return;
    }

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
    if (!canEdit) {
      alert('You do not have permission to edit records.');
      return;
    }

    setEditingId(bench.id);
    setEditForm({
      location: bench.location,
      loggedBy: bench.loggedBy,
      latitude: bench.latitude || 0,
      longitude: bench.longitude || 0
    });
  };

  const saveEdit = async () => {
    if (!canEdit) {
      alert('You do not have permission to edit records.');
      return;
    }

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
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timestamp) => {
    const timePart = timestamp.split(' ').slice(-2).join(' '); // Get "5:30 PM CT"
    return timePart;
  };

  const formatCoordinate = (coord) => {
    return coord ? coord.toFixed(4) : '—';
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

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <FallingChairs />
      
      {/* Header bar */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-sm transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            ← Back
          </button>
          <div className="h-4 w-px" style={{ background: 'var(--border)' }}></div>
          <span className="font-serif text-xl" style={{ color: 'var(--text-primary)' }}>All entries</span>
        </div>
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {benches.length} record{benches.length !== 1 ? 's' : ''}
          {!canEdit && <span className="ml-2 text-xs px-2 py-0.5 rounded" style={{ background: 'var(--border)', color: 'var(--text-secondary)' }}>view only</span>}
        </div>
      </header>

      <main className="flex-grow relative z-10 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Error */}
          {dataError && (
            <div className="mb-6">
              <div className="rounded-lg py-3 px-5 text-sm" style={{ background: 'rgba(196, 92, 79, 0.15)', color: 'var(--danger)', border: '1px solid rgba(196, 92, 79, 0.3)' }}>
                {dataError}
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--border)' }}>
            <table className="w-full" style={{ minWidth: '800px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Lat</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Long</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>By</th>
                  {canEdit && <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {benches.map((bench, index) => (
                  <tr 
                    key={bench.id} 
                    className="transition-colors"
                    style={{ 
                      background: index % 2 === 0 ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                      borderBottom: '1px solid var(--border)'
                    }}
                  >
                    <td className="px-4 py-3 text-sm whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                      {formatDate(bench.timestamp)}
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                      {formatTime(bench.timestamp)}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>
                      {editingId === bench.id ? (
                        <input
                          type="text"
                          value={editForm.location}
                          onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                          className="w-full px-2 py-1 rounded text-sm focus:outline-none"
                          style={{ 
                            background: 'var(--bg-card)', 
                            color: 'var(--text-primary)',
                            border: '1px solid var(--accent)'
                          }}
                          placeholder="Location"
                          disabled={saving}
                        />
                      ) : (
                        <span className="max-w-[200px] block truncate" title={bench.location}>
                          {bench.location}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                      {editingId === bench.id ? (
                        <input
                          type="number"
                          step="0.0001"
                          value={editForm.latitude}
                          onChange={(e) => setEditForm({...editForm, latitude: e.target.value})}
                          className="w-24 px-2 py-1 rounded text-sm focus:outline-none"
                          style={{ 
                            background: 'var(--bg-card)', 
                            color: 'var(--text-primary)',
                            border: '1px solid var(--accent)'
                          }}
                          disabled={saving}
                        />
                      ) : (
                        formatCoordinate(bench.latitude)
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                      {editingId === bench.id ? (
                        <input
                          type="number"
                          step="0.0001"
                          value={editForm.longitude}
                          onChange={(e) => setEditForm({...editForm, longitude: e.target.value})}
                          className="w-24 px-2 py-1 rounded text-sm focus:outline-none"
                          style={{ 
                            background: 'var(--bg-card)', 
                            color: 'var(--text-primary)',
                            border: '1px solid var(--accent)'
                          }}
                          disabled={saving}
                        />
                      ) : (
                        formatCoordinate(bench.longitude)
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                      {bench.loggedBy}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        {editingId === bench.id ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={saveEdit}
                              disabled={saving}
                              className="px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50"
                              style={{ background: 'var(--success)', color: 'white' }}
                            >
                              {saving ? '...' : 'Save'}
                            </button>
                            <button
                              onClick={cancelEdit}
                              disabled={saving}
                              className="px-3 py-1 rounded text-sm font-medium transition-colors"
                              style={{ background: 'var(--border)', color: 'var(--text-secondary)' }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => startEdit(bench)}
                              className="px-3 py-1 rounded text-sm font-medium transition-colors"
                              style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                              onMouseEnter={(e) => e.target.style.borderColor = 'var(--text-muted)'}
                              onMouseLeave={(e) => e.target.style.borderColor = 'var(--border)'}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteBench(bench.id)}
                              className="px-3 py-1 rounded text-sm font-medium transition-colors"
                              style={{ background: 'rgba(196, 92, 79, 0.15)', color: 'var(--danger)', border: '1px solid rgba(196, 92, 79, 0.3)' }}
                              onMouseEnter={(e) => e.target.style.background = 'var(--danger)'}
                              onMouseLeave={(e) => e.target.style.background = 'rgba(196, 92, 79, 0.15)'}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {benches.length === 0 && !dataLoading && (
                  <tr>
                    <td colSpan={canEdit ? 7 : 6} className="px-6 py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                      No bench records found. Go back and log your first bench!
                    </td>
                  </tr>
                )}
                {dataLoading && (
                  <tr>
                    <td colSpan={canEdit ? 7 : 6} className="px-6 py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                      <div className="flex items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-transparent" style={{ borderTopColor: 'var(--accent)' }}></div>
                        <span>Loading records...</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Action */}
          {canEdit && (
            <div className="text-center mt-8">
              <button
                onClick={() => router.push('/')}
                className="px-8 py-3 text-base font-medium rounded-lg transition-all duration-200"
                style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
                onMouseEnter={(e) => e.target.style.background = 'var(--accent-hover)'}
                onMouseLeave={(e) => e.target.style.background = 'var(--accent)'}
              >
                Log new bench
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 text-sm" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
        made in Houston
      </footer>
    </div>
  );
}
