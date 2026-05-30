'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export default function CreatePodcast() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_premium: false,
    price: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (user === null) {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }
    } else if (user.role !== 'artist' && user.role !== 'studio' && user.role !== 'admin') {
      router.push('/creator/onboarding');
      return;
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data } = await api.post('/studio/podcasts', formData);
      router.push(`/studio/podcasts`);
    } catch (err) {
      console.error('Failed to create podcast', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-32">
      <h1 className="text-3xl font-bold text-white mb-8">Create New Podcast Channel</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6 bg-white/5 p-8 rounded-2xl border border-white/10">
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">Podcast Title *</label>
          <input
            type="text"
            required
            className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-white"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            placeholder="E.g., Island Sounds Discussions"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">Description</label>
          <textarea
            className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-white h-32"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="What is this channel about?"
          />
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="is_premium"
            className="w-5 h-5 rounded border-white/20 bg-black/50 text-primary focus:ring-primary focus:ring-offset-black"
            checked={formData.is_premium}
            onChange={(e) => setFormData({...formData, is_premium: e.target.checked})}
          />
          <label htmlFor="is_premium" className="text-white/80 font-medium">
            Premium Channel (Subscribers Only)
          </label>
        </div>

        {formData.is_premium && (
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Price ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-white"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
            />
          </div>
        )}

        <div className="pt-4 flex space-x-4">
          <button 
            type="button" 
            onClick={() => router.back()}
            className="px-6 py-3 rounded-full border border-white/20 text-white hover:bg-white/10 transition"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="flex-1 bg-primary hover:bg-primary-hover text-black font-bold px-6 py-3 rounded-full transition disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Channel'}
          </button>
        </div>
      </form>
    </div>
  );
}
