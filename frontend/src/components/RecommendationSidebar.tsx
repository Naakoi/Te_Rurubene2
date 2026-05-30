'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { usePlayerStore } from '@/store/playerStore';
import { Play, Music, Film, Sparkles, Loader2 } from 'lucide-react';

export default function RecommendationSidebar() {
  const { currentMedia, setCurrentMedia, isPlaying } = usePlayerStore();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentMedia) {
      setLoading(true);
      api.get('/api/recommendations')
        .then(res => setRecommendations(res.data))
        .catch(() => console.log('Recommendations fetch failed'))
        .finally(() => setLoading(false));
    }
  }, [currentMedia?.id]); // Re-fetch when the track changes

  if (!currentMedia) return null;

  return (
    <aside className="w-72 h-full border-l border-white/5 bg-background/50 backdrop-blur-xl flex flex-col hidden xl:flex shrink-0 shadow-[-20px_0_50px_rgba(0,0,0,0.3)]">
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center space-x-2 mb-1">
          <Sparkles className="text-primary" size={16} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">Next Discovery</span>
        </div>
        <h2 className="text-xl font-black text-white">Recommended</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : recommendations.length > 0 ? (
          recommendations.map((item) => (
            <div 
              key={item.id}
              onClick={() => setCurrentMedia({
                id: item.id,
                title: item.title,
                artist: item.artist,
                studio: item.artist?.studio,
                type: 'audio',
                stream_url: item.file_url || item.audio_file_path,
                cover_url: item.cover_url,
                price: item.price,
                is_purchased: item.is_purchased
              })}
              className="group flex items-center space-x-2.5 p-1.5 rounded-lg hover:bg-white/5 transition cursor-pointer border border-transparent hover:border-white/5"
            >
              <div className="relative w-11 h-11 rounded-md overflow-hidden shrink-0 bg-secondary shadow-md">
                {item.cover_url ? (
                  <img src={item.cover_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-blue-600/20">
                    <Music size={14} className="text-primary/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <Play size={12} fill="white" className="text-white" />
                </div>
              </div>
              
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-white truncate leading-tight group-hover:text-primary transition">{item.title}</p>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">{item.artist?.name}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-muted-foreground text-center mt-10">No recommendations found.</p>
        )}
      </div>

      <div className="p-6 bg-gradient-to-t from-background to-transparent">
        <div className="glass-card p-4 rounded-2xl border-primary/20 bg-primary/5">
          <p className="text-[10px] font-bold text-primary uppercase mb-1">AI Insight</p>
          <p className="text-[11px] text-white/70 leading-relaxed italic">
            &quot;Based on your vibe, you might love these upcoming island tracks.&quot;
          </p>
        </div>
      </div>
    </aside>
  );
}
