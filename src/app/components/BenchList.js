'use client'

import { useState } from 'react';

export default function BenchList({ benches, onDelete, onUpdate }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const startEdit = (bench) => {
    setEditingId(bench.id);
    setEditForm({
      name: bench.name,
      location: bench.location,
      description: bench.description,
      rating: bench.rating,
      dateVisited: bench.dateVisited,
      tags: bench.tags.join(', ')
    });
  };

  const saveEdit = () => {
    const updatedBench = {
      ...editForm,
      tags: editForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      rating: parseInt(editForm.rating)
    };
    onUpdate(editingId, updatedBench);
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const getRatingStars = (rating) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (benches.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <span className="mr-3">🪑</span>
        Your Bench Collection ({benches.length})
      </h2>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {benches.map((bench) => (
          <div
            key={bench.id}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {editingId === bench.id ? (
              // Edit Form
              <div className="space-y-4">
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Bench name"
                />
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Location"
                />
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Description"
                  rows="3"
                />
                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={editForm.rating}
                    onChange={(e) => setEditForm({...editForm, rating: e.target.value})}
                    className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value={1}>⭐ 1 Star</option>
                    <option value={2}>⭐⭐ 2 Stars</option>
                    <option value={3}>⭐⭐⭐ 3 Stars</option>
                    <option value={4}>⭐⭐⭐⭐ 4 Stars</option>
                    <option value={5}>⭐⭐⭐⭐⭐ 5 Stars</option>
                  </select>
                  <input
                    type="date"
                    value={editForm.dateVisited}
                    onChange={(e) => setEditForm({...editForm, dateVisited: e.target.value})}
                    className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <input
                  type="text"
                  value={editForm.tags}
                  onChange={(e) => setEditForm({...editForm, tags: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Tags (comma separated)"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={saveEdit}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    💾 Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    ❌ Cancel
                  </button>
                </div>
              </div>
            ) : (
              // Display Mode
              <div>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-gray-800">{bench.name}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => startEdit(bench)}
                      className="text-blue-500 hover:text-blue-700 transition-colors"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDelete(bench.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-600">
                    <span className="mr-2">📍</span>
                    <span className="text-sm">{bench.location}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <span className="mr-2">📅</span>
                    <span className="text-sm">{formatDate(bench.dateVisited)}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="text-lg">{getRatingStars(bench.rating)}</span>
                    <span className="ml-2 text-sm text-gray-600">({bench.rating}/5)</span>
                  </div>
                </div>
                
                <p className="text-gray-700 text-sm mb-4">{bench.description}</p>
                
                {bench.tags && bench.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {bench.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 