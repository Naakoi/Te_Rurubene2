'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/axios';
import { usePlayerStore } from '@/store/playerStore';
import { Play, Plus, Share2, Mic, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function PodcastChannel() {
  const { id } = useParams();
  const { setCurrentMedia } = usePlayerStore();
  const [podcast, setPodcast] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const fetchPodcast = async () => {
      try {
        const { data } = await api.get(`/podcasts/channel/${id}`);
        setPodcast(data);
      } catch (err) {
        console.error('Failed to load podcast', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPodcast();
  }, [id]);

  if (isLoading) return <div className="p-12 text-center text-white/50">Loading channel...</div>;
  if (!podcast) return <div className="p-12 text-center text-white/50">Podcast not found.</div>;

  const playEpisode = (episode: any) => {
    setCurrentMedia({
      id: episode.id,
      title: episode.title,
      artist: { name: podcast.title },
      type: 'audio',
      stream_url: episode.hls_path || episode.audio_file_path,
      cover_url: podcast.cover_image || undefined,
      is_premium: episode.is_premium ?? false,
    });
  };

  return (
    <div className="pb-32">
      {/* Header Banner */}
      <div className="relative h-80 bg-gradient-to-b from-white/10 to-[#121212] pt-20 px-8 flex items-end pb-8">
        <div className="flex items-end space-x-6 max-w-7xl mx-auto w-full relative z-10">
          <div className="w-48 h-48 rounded-2xl shadow-2xl overflow-hidden bg-white/10 shrink-0">
            {podcast.cover_image ? (
              <img src={podcast.cover_image} alt={podcast.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Mic size={64} className="text-white/20" />
              </div>
            )}
          </div>
          <div className="flex-1 pb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-white/70 mb-2 block">Podcast</span>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tight">{podcast.title}</h1>
            <div className="flex items-center space-x-4 text-sm text-white/80 font-medium">
              <span className="flex items-center hover:underline cursor-pointer">
                {podcast.studio?.name || 'Studio'}
              </span>
              <span>•</span>
              {podcast.is_premium && <span className="bg-yellow-500 text-black px-2 py-0.5 rounded text-xs font-bold">PREMIUM</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 mt-6">
        {/* Actions */}
        <div className="flex items-center space-x-4 mb-10">
          <button 
            onClick={() => podcast.episodes.length > 0 && playEpisode(podcast.episodes[0])}
            className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-black hover:scale-105 transition shadow-lg"
          >
            <Play size={24} fill="currentColor" className="ml-1" />
          </button>
          
          <button 
            onClick={() => setIsFollowing(!isFollowing)}
            className="border border-white/30 hover:border-white text-white px-6 py-2 rounded-full font-bold text-sm tracking-widest transition uppercase flex items-center"
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Main Content: Episodes */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-white mb-6">Episodes</h2>
            
            <div className="space-y-4">
              {podcast.episodes.map((episode: any) => (
                <div key={episode.id} className="bg-white/5 border border-white/5 hover:bg-white/10 transition rounded-2xl p-5 flex space-x-5 group">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-white group-hover:text-primary transition cursor-pointer" onClick={() => playEpisode(episode)}>
                        {episode.title}
                      </h3>
                      {episode.is_premium && (
                        <span className="shrink-0 bg-yellow-500/20 text-yellow-500 text-xs px-2 py-1 rounded font-bold">
                          Premium
                        </span>
                      )}
                    </div>
                    <p className="text-white/60 text-sm line-clamp-2 mb-4 leading-relaxed">
                      {episode.description}
                    </p>
                    <div className="flex items-center space-x-4">
                      <button 
                        onClick={() => playEpisode(episode)}
                        className="bg-white hover:scale-105 transition text-black w-8 h-8 rounded-full flex items-center justify-center"
                      >
                        <Play size={14} fill="currentColor" className="ml-0.5" />
                      </button>
                      <span className="text-xs font-medium text-white/50">
                        {new Date(episode.published_at || episode.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      {episode.duration && (
                        <span className="text-xs font-medium text-white/50">
                          {Math.floor(episode.duration / 60)} min
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {podcast.episodes.length === 0 && (
                <div className="text-white/50 py-8">
                  No episodes have been released yet. Check back soon!
                </div>
              )}
            </div>
          </div>

          {/* Sidebar: About */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">About</h2>
            <p className="text-white/70 text-sm leading-relaxed mb-6">
              {podcast.description || 'No description provided.'}
            </p>
            
            {podcast.category && (
              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-widest text-white/50 mb-2 block">Category</span>
                <span className="inline-block bg-white/10 px-3 py-1 rounded-full text-white/80 text-sm font-medium">
                  {podcast.category.name}
                </span>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
