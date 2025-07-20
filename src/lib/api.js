'use client'

// API utility functions for bench data CRUD operations

async function makeAuthenticatedRequest(url, options = {}) {
  const token = localStorage.getItem('benchmarked-token');
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    },
    ...options
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP error! status: ${response.status}`);
  }

  return data;
}

// Fetch all bench records
export async function getBenchData() {
  try {
    const result = await makeAuthenticatedRequest('/api/benchdata');
    return result.data || [];
  } catch (error) {
    console.error('Error fetching bench data:', error);
    throw error;
  }
}

// Create new bench record
export async function createBenchRecord(benchData) {
  try {
    const result = await makeAuthenticatedRequest('/api/benchdata', {
      method: 'POST',
      body: JSON.stringify(benchData)
    });
    return result.data;
  } catch (error) {
    console.error('Error creating bench record:', error);
    throw error;
  }
}

// Update existing bench record
export async function updateBenchRecord(id, updates) {
  try {
    const result = await makeAuthenticatedRequest(`/api/benchdata/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    return result.data;
  } catch (error) {
    console.error('Error updating bench record:', error);
    throw error;
  }
}

// Delete bench record
export async function deleteBenchRecord(id) {
  try {
    const result = await makeAuthenticatedRequest(`/api/benchdata/${id}`, {
      method: 'DELETE'
    });
    return result;
  } catch (error) {
    console.error('Error deleting bench record:', error);
    throw error;
  }
}

// Get single bench record by ID
export async function getBenchRecord(id) {
  try {
    const result = await makeAuthenticatedRequest(`/api/benchdata/${id}`);
    return result.data;
  } catch (error) {
    console.error('Error fetching bench record:', error);
    throw error;
  }
} 