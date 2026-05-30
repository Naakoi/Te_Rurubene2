'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Library, Check } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { usePlayerStore } from '@/store/playerStore';
import { useCartStore } from '@/store/cartStore';
import api from '@/lib/axios';

export default function Home() {
  const { user, setUser } = useAuthStore();
  const { addItem } = useCartStore();
  const [wallet, setWallet] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);

  useEffect(() => {
    api.get('/api/tracks')
      .then(res => setTracks(res.data))
      .catch(err => {
          console.log('Failed to fetch tracks');
          setTracks([]);
      });

    if (user) {
      api.get('/api/wallet')
        .then(res => setWallet(res.data))
        .catch(err => console.log('Failed to fetch wallet'));
    }
  }, [user, setUser]);

  const { setCurrentMedia } = usePlayerStore();

  const handleAddToCart = (track: any) => {
    addItem({
        id: track.id,
        type: 'track',
        name: track.title,
        price: Number(track.price) > 0 ? Number(track.price) : 0.99,
        image_url: track.cover_url,
        quantity: 1,
        creator_id: track.artist_id,
        creator_name: track.artist?.name || track.artist?.user?.name
    });
  };

  const handleAddFreeToLibrary = async (track: any) => {
    try {
      await api.post('/api/checkout', {
        items: [{ id: track.id, type: 'track', price: 0 }],
        total: 0
      });
      setTracks((prev: any[]) => prev.map((t: any) => t.id === track.id ? { ...t, is_purchased: true } : t));
    } catch (err: any) {
      console.error('Free library add failed:', err);
      alert(err.response?.data?.message || 'Failed to add to library. Please try again.');
    }
  };

  return (
    <div className="p-8">
      <header className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold">Discover</h1>
        {user ? (
          <div className="flex items-center space-x-6">
            <Link href="/wallet" className="text-right hidden sm:block hover:opacity-80 transition">
              <p className="text-sm text-muted-foreground">Balance</p>
              <p className="text-lg font-bold text-primary">${Number(wallet?.balance || 0).toFixed(2)}</p>
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-muted-foreground">Hello, {user?.name || 'User'}</span>
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                {(user?.name || 'User').charAt(0)}
              </div>
            </div>
          </div>
        ) : (
          <Link href="/login" className="px-6 py-2 bg-primary text-primary-foreground rounded-full font-semibold hover:bg-primary/90 transition">
            Log In
          </Link>
        )}
      </header>

      <section>
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">Trending Now</h2>
            <span className="text-xs text-primary/60 font-bold uppercase tracking-widest cursor-pointer hover:text-primary transition">View All</span>
        </div>
        <div className="media-grid">
          {tracks.length > 0 ? tracks.map(track => (
            <div key={track.id} className="media-card group">

              {/* ── Thumbnail with play overlay ── */}
              <div
                className="media-card-thumb cursor-pointer"
                onClick={() => setCurrentMedia({
                  id: track.id,
                  title: track.title,
                  artist: track.artist,
                  studio: track.artist?.studio,
                  type: 'audio',
                  stream_url: track.file_url || track.audio_file_path,
                  cover_url: track.cover_url,
                  price: track.price,
                  is_purchased: track.is_purchased
                })}
              >
                {track.cover_url ? (
                  <img src={track.cover_url} alt={track.title} />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-blue-600" />
                )}
                {/* Play overlay — only inside the thumb */}
                <div className="play-overlay">
                  <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30 scale-90 group-hover:scale-100 transition-transform duration-300">
                    <span className="text-primary-foreground text-lg ml-0.5">▶</span>
                  </div>
                </div>
              </div>

              {/* ── Info ── */}
              <div className="flex-1 px-1">
                <h3 className="media-card-title">{track.title}</h3>
                <Link
                  href={`/marketplace/stores/artist/${track.artist?.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="media-card-artist hover:text-primary transition"
                >
                  {track.artist?.name || 'Unknown Artist'}
                </Link>
              </div>

              {/* ── Cart / Library button — separate from hover thumb ── */}
              <div className="px-1 mt-2">
                {track.is_purchased ? (
                  <Link
                    href="/library"
                    onClick={(e) => e.stopPropagation()}
                    className="w-full block text-center py-1.5 bg-green-500/10 text-green-500 text-[10px] font-bold rounded-lg border border-green-500/20 hover:bg-green-500 hover:text-white transition"
                  >
                    IN LIBRARY
                  </Link>
                ) : Number(track.price) === 0 ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAddFreeToLibrary(track); }}
                    className="w-full px-3 py-1.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded-lg border border-blue-500/20 hover:bg-blue-500 hover:text-white transition flex items-center justify-between"
                  >
                    <Library size={12} />
                    <span>ADD TO LIBRARY</span>
                  </button>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAddToCart(track); }}
                    className="w-full px-3 py-1.5 bg-primary/10 text-primary text-[10px] font-bold rounded-lg border border-primary/20 hover:bg-primary hover:text-primary-foreground transition flex items-center justify-between"
                  >
                    <ShoppingCart size={12} />
                    <span>${Number(track.price).toFixed(2)} AUD</span>
                  </button>
                )}
              </div>

            </div>
          )) : (
            <div className="col-span-full py-12 text-center glass-card rounded-2xl border-dashed">
                <p className="text-muted-foreground">No tracks found. Get the party started by uploading some music!</p>
            </div>
          )}
        </div>
      </section>

      <section className="mt-16">
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Recommended for You</h2>
            <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20">AI POWERED</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map(i => (
                <div key={i} className="glass flex items-center p-4 rounded-2xl hover:bg-white/5 transition cursor-pointer">
                    <div className="w-16 h-16 bg-secondary rounded-lg mr-4"></div>
                    <div className="flex-1">
                        <h4 className="font-bold">Discovery Mix {i}</h4>
                        <p className="text-sm text-muted-foreground">Based on your recent listening</p>
                    </div>
                    <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition">▶</button>
                </div>
            ))}
        </div>
      </section>
    </div>
  );
}
