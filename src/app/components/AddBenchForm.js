'use client'

import { useState } from 'react';

export default function AddBenchForm({ onAdd, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    rating: 5,
    dateVisited: new Date().toISOString().split('T')[0], // Today's date
    tags: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.location.trim()) {
      alert('Please fill in the bench name and location!');
      return;
    }

    const bench = {
      ...formData,
      rating: parseInt(formData.rating),
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
    };

    onAdd(bench);
    
    // Reset form
    setFormData({
      name: '',
      location: '',
      description: '',
      rating: 5,
      dateVisited: new Date().toISOString().split('T')[0],
      tags: ''
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <span className="mr-3">➕</span>
          Add New Bench
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🪑 Bench Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                placeholder="e.g., Central Park Bench"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📍 Location *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                placeholder="e.g., Central Park, NYC"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📝 Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                placeholder="What made this bench special? Great view? Perfect for reading?"
                rows="4"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ⭐ Rating
              </label>
              <select
                name="rating"
                value={formData.rating}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
              >
                <option value={1}>⭐ 1 Star - Meh</option>
                <option value={2}>⭐⭐ 2 Stars - Okay</option>
                <option value={3}>⭐⭐⭐ 3 Stars - Good</option>
                <option value={4}>⭐⭐⭐⭐ 4 Stars - Great</option>
                <option value={5}>⭐⭐⭐⭐⭐ 5 Stars - Amazing!</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📅 Date Visited
              </label>
              <input
                type="date"
                name="dateVisited"
                value={formData.dateVisited}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🏷️ Tags
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                placeholder="peaceful, scenic, busy, shaded, sunny (comma separated)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Separate multiple tags with commas
              </p>
            </div>

            {/* Photo Upload Placeholder */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📸 Photo (Coming Soon!)
              </label>
              <div className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500">
                <div className="text-4xl mb-2">📸</div>
                <p className="text-sm">Photo upload feature coming soon!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex space-x-4 pt-6 border-t border-gray-200">
          <button
            type="submit"
            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-lg font-semibold transition-colors shadow-lg flex items-center justify-center"
          >
            <span className="mr-2">🪑</span>
            Add Bench to Collection
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Fun Facts */}
      <div className="mt-6 p-4 bg-green-50 rounded-lg">
        <p className="text-sm text-green-700">
          💡 <strong>Fun Fact:</strong> The average person sits on a bench for 15-30 minutes. 
          Make each sitting count by tracking the memorable ones!
        </p>
      </div>
    </div>
  );
} 