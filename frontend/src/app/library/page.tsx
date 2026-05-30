'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import Link from 'next/link';
import { Play, Music, Heart, Share2, MoreHorizontal } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';

export default function LibraryPage() {
  const [tracks, setTracks] = useState<any[]>([]);
  const { setCurrentMedia } = usePlayerStore();

  useEffect(() => {
    api.get('/api/my-tracks')
      .then(res => setTracks(res.data))
      .catch(err => console.log('Failed to fetch my tracks'));
  }, []);

  return (
    <div className="p-8">
      <div className="flex items-center space-x-4 mb-10">
          <div className="p-3 bg-primary/20 text-primary rounded-2xl">
              <Music size={24} />
          </div>
          <h1 className="text-3xl font-bold">My Library</h1>
      </div>

      <div className="space-y-2">
        {tracks.length > 0 ? (
            <div className="glass-card rounded-3xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-xs font-bold uppercase text-muted-foreground border-b border-white/10">
                        <tr>
                            <th className="px-6 py-4 w-16">#</th>
                            <th className="px-6 py-4">Title</th>
                            <th className="px-6 py-4">Artist</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {tracks.map((track, index) => (
                            <tr key={track.id} className="hover:bg-white/5 transition group">
                                <td className="px-6 py-4 text-muted-foreground font-mono">{index + 1}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 bg-secondary rounded-lg overflow-hidden relative">
                                            {track.cover_url && <img src={track.cover_url} className="w-full h-full object-cover" />}
                                            <button 
                                                onClick={() => setCurrentMedia({ id: track.id, title: track.title, artist: track.artist, type: 'audio', stream_url: track.file_url || track.audio_file_path, cover_url: track.cover_url, is_purchased: true })}
                                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                                            >
                                                <Play size={16} fill="currentColor" />
                                            </button>
                                        </div>
                                        <span className="font-bold">{track.title}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <Link 
                                      href={`/marketplace/stores/artist/${track.artist?.id}`}
                                      className="text-muted-foreground hover:text-primary transition"
                                    >
                                        {track.artist?.name}
                                    </Link>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end space-x-4 text-muted-foreground">
                                        <button className="hover:text-primary transition"><Heart size={18} /></button>
                                        <button className="hover:text-primary transition"><Share2 size={18} /></button>
                                        <button className="hover:text-primary transition"><MoreHorizontal size={18} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ) : (
            <div className="py-20 text-center glass-card rounded-3xl border-dashed">
                <p className="text-muted-foreground mb-6">Your library is empty. Start collecting the best island sounds!</p>
                <button className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-bold hover:scale-105 transition">
                    Browse Marketplace
                </button>
            </div>
        )}
      </div>
    </div>
  );
}
