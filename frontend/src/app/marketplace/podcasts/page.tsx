'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Play, Clock, Share2 } from 'lucide-react';

export default function PodcastsPage() {
  const [podcasts, setPodcasts] = useState<any[]>([]);

  useEffect(() => {
    api.get('/api/podcasts')
      .then(res => setPodcasts(res.data))
      .catch(err => console.log('Failed to fetch podcasts'));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-10">Podcasts</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {podcasts.length > 0 ? podcasts.map(podcast => (
          <div key={podcast.id} className="glass-card rounded-3xl p-6 flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-40 h-40 bg-secondary rounded-2xl shrink-0 overflow-hidden relative group">
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <button className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center scale-75 group-hover:scale-100 transition duration-300">
                        <Play size={20} fill="currentColor" />
                    </button>
                </div>
            </div>
            <div className="flex-1 flex flex-col justify-between">
                <div>
                    <h2 className="text-xl font-bold mb-2">{podcast.title}</h2>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{podcast.description}</p>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary uppercase tracking-widest">{podcast.episodes?.length || 0} Episodes</span>
                    <div className="flex space-x-2">
                        <button className="p-2 glass rounded-lg hover:text-primary transition"><Share2 size={16} /></button>
                    </div>
                </div>
            </div>
          </div>
        )) : (
            <div className="col-span-2 py-20 text-center glass-card rounded-3xl border-dashed">
                <p className="text-muted-foreground">No podcasts available at the moment.</p>
            </div>
        )}
      </div>
    </div>
  );
}
