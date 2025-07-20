'use client'

// API utility functions for bench data CRUD operations

// Helper function to get the correct API base path
function getApiBasePath() {
  // In production with basePath, API routes are prefixed
  return process.env.NODE_ENV === 'production' ? '/app/bench-marked/api' : '/api';
}

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

// Get all bench entries
export async function getAllBenches() {
  const result = await makeAuthenticatedRequest(`${getApiBasePath()}/benchdata`);
  return result.benches || [];
}

// Create a new bench entry
export async function createBench(benchData) {
  const result = await makeAuthenticatedRequest(`${getApiBasePath()}/benchdata`, {
    method: 'POST',
    body: JSON.stringify(benchData)
  });
  return result.data || result; // Return the data property or fallback to full result
}

// Update a bench entry
export async function updateBench(id, benchData) {
  const result = await makeAuthenticatedRequest(`${getApiBasePath()}/benchdata/${id}`, {
    method: 'PUT',
    body: JSON.stringify(benchData)
  });
  return result.data || result; // Return the data property or fallback to full result
}

// Delete a bench entry
export async function deleteBench(id) {
  const result = await makeAuthenticatedRequest(`${getApiBasePath()}/benchdata/${id}`, {
    method: 'DELETE'
  });
  return result.data || result; // Return the data property or fallback to full result
}

// Get a single bench entry
export async function getBench(id) {
  const result = await makeAuthenticatedRequest(`${getApiBasePath()}/benchdata/${id}`);
  return result.data || result; // Return the data property or fallback to full result
}
