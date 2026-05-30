'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { Mic, Plus, Settings, PlayCircle, BarChart2 } from 'lucide-react';
import Link from 'next/link';

export default function StudioPodcasts() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [podcasts, setPodcasts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    // Check if studio role exists, else redirect to onboarding
    if (user.role !== 'studio' && user.role !== 'artist') {
      router.push('/creator/onboarding');
      return;
    }

    const fetchPodcasts = async () => {
      try {
        const { data } = await api.get('/studio/podcasts');
        setPodcasts(data);
      } catch (err) {
        console.error('Failed to load podcasts', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPodcasts();
  }, [user, router]);

  if (isLoading) return <div className="p-8 text-center text-white/50">Loading podcasts...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-32">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Podcasts</h1>
          <p className="text-white/60">Manage your channels, series, and episodes.</p>
        </div>
        <Link href="/studio/podcasts/create" className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-full font-bold transition flex items-center">
          <Plus size={20} className="mr-2" />
          Create Channel
        </Link>
      </div>

      {podcasts.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <Mic size={48} className="mx-auto text-white/20 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No Podcasts Yet</h2>
          <p className="text-white/60 mb-6 max-w-md mx-auto">Start your own radio show, discussion series, or storytelling channel to reach audiences across the Pacific.</p>
          <Link href="/studio/podcasts/create" className="inline-block bg-white text-black px-8 py-3 rounded-full font-bold hover:scale-105 transition">
            Start a Podcast
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {podcasts.map((podcast: any) => (
            <div key={podcast.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition group">
              <div className="aspect-video bg-white/10 relative">
                {podcast.cover_image ? (
                  <img src={podcast.cover_image} alt={podcast.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Mic size={40} className="text-white/20" />
                  </div>
                )}
                {podcast.is_premium && (
                  <span className="absolute top-4 right-4 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded">
                    PREMIUM
                  </span>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-1 truncate">{podcast.title}</h3>
                <p className="text-white/50 text-sm line-clamp-2 mb-4">{podcast.description}</p>
                
                <div className="flex items-center justify-between border-t border-white/10 pt-4">
                  <div className="flex space-x-3">
                    <Link href={`/studio/podcasts/${podcast.id}/episodes/new`} className="text-white/60 hover:text-white transition" title="Upload Episode">
                      <PlayCircle size={20} />
                    </Link>
                    <Link href={`/studio/podcasts/${podcast.id}/analytics`} className="text-white/60 hover:text-white transition" title="Analytics">
                      <BarChart2 size={20} />
                    </Link>
                    <Link href={`/studio/podcasts/${podcast.id}/edit`} className="text-white/60 hover:text-white transition" title="Settings">
                      <Settings size={20} />
                    </Link>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 bg-white/10 rounded-full text-white/60">
                    {podcast.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
