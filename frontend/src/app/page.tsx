'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Library, Check, Play, Music, Users, Shield, ArrowRight, Disc, Mic, Store, Globe } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { usePlayerStore } from '@/store/playerStore';
import { useCartStore } from '@/store/cartStore';
import api from '@/lib/axios';
import OfflineView from '@/components/OfflineView';

export default function Home() {
  const { user, setUser } = useAuthStore();
  const { addItem } = useCartStore();
  const [wallet, setWallet] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Connection tracking
    const updateOnlineStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  useEffect(() => {
    if (isOffline) return; // Skip fetching if offline

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
  }, [user, setUser, isOffline]);

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

  if (!mounted) return null;

  if (isOffline && user) {
    return <OfflineView pageName="Home Feed" description="Your home feed and recommendations require an active internet connection. You can still listen to your downloaded music in your library." />;
  }

  if (!user) {
    return <LandingPage />;
  }

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

function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-32 overflow-hidden flex flex-col items-center justify-center text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-[#0a0d14] to-[#0a0d14] -z-10"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 blur-[120px] rounded-full"></div>
        
        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 animate-fade-in-up">
          <Globe className="text-primary" size={16} />
          <span className="text-xs font-bold tracking-widest uppercase text-white/80">The Voice of the Pacific</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight animate-fade-in-up animation-delay-100 max-w-4xl mx-auto leading-tight">
          Discover the Heartbeat <br className="hidden md:block" /> 
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Of The Islands</span>
        </h1>
        
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in-up animation-delay-200">
          Stream, discover, and support authentic Pacific Island artists. Experience a cultural music platform built for true connection and fair creator support.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-300 w-full px-4">
          <Link href="/register" className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground font-bold rounded-full hover:scale-105 hover:shadow-[0_0_20px_rgba(0,255,255,0.3)] transition-all duration-300 flex items-center justify-center space-x-2">
            <span>Start Listening Free</span>
            <ArrowRight size={18} />
          </Link>
          <Link href="/creator/join" className="w-full sm:w-auto px-8 py-4 bg-white/5 text-white font-bold rounded-full hover:bg-white/10 border border-white/10 transition-all duration-300">
            I am a Creator
          </Link>
        </div>
      </section>

      {/* How it works grid */}
      <section className="py-20 px-8 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How Te Rurubene Works</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">An ecosystem designed to empower artists and give listeners an unmatched cultural experience.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-card p-8 rounded-3xl hover:-translate-y-2 transition-all duration-300">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20">
                <Music className="text-primary" size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">Discover & Stream</h3>
              <p className="text-muted-foreground text-sm">Explore an exclusive catalog of Pacific music, podcasts, and videos. Use our AI-powered discovery to find your perfect island vibe.</p>
            </div>
            <div className="glass-card p-8 rounded-3xl hover:-translate-y-2 transition-all duration-300">
              <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20">
                <Store className="text-blue-400" size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">Support Directly</h3>
              <p className="text-muted-foreground text-sm">Buy tracks, digital merch, and concert tickets directly from artists. Every purchase goes to the creators you love.</p>
            </div>
            <div className="glass-card p-8 rounded-3xl hover:-translate-y-2 transition-all duration-300">
              <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center mb-6 border border-green-500/20">
                <Shield className="text-green-400" size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">Secure Wallet</h3>
              <p className="text-muted-foreground text-sm">Top up your secure in-app wallet via Visa/Mastercard. Enjoy seamless one-click checkouts and manage your purchases safely.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Meaning of Te Rurubene */}
      <section className="py-24 px-8 bg-white/5 border-t border-white/5 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 w-[500px] h-[500px] bg-primary/5 blur-[150px] rounded-full pointer-events-none"></div>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold tracking-widest uppercase">
              Our Identity
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
              What is <span className="text-primary italic">Te Rurubene?</span>
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-primary to-transparent rounded-full"></div>
            <p className="text-lg text-white/80 leading-relaxed font-light">
              In traditional Kiribati (Gilbertese) culture, <strong className="font-bold text-white">"Te Rurubene"</strong> refers to a specific group of musical assistants. Historically, they work closely alongside a master composer (<em className="italic">te kainikamaen</em>).
            </p>
            <p className="text-lg text-white/80 leading-relaxed font-light">
              By singing newly composed songs back to the creator, they serve as human "recorders"—learning, refining, and eventually teaching these songs to the wider public. Our platform embodies this tradition, acting as the digital <em className="italic">Rurubene</em> to help Pacific artists record, refine, and share their voices with the world.
            </p>
          </div>
          <div className="flex-1 w-full relative">
            <div className="aspect-square w-full max-w-md mx-auto relative group">
              {/* Abstract woven pattern / graphic representation */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-blue-600/30 rounded-[3rem] rotate-6 group-hover:rotate-12 transition-transform duration-700 ease-out"></div>
              <div className="absolute inset-0 bg-white/5 border border-white/10 rounded-[3rem] backdrop-blur-sm -rotate-3 group-hover:rotate-0 transition-transform duration-700 ease-out flex items-center justify-center p-8">
                 <div className="w-full h-full border-2 border-dashed border-primary/40 rounded-[2rem] flex flex-col items-center justify-center text-center space-y-4 p-6 relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 to-transparent"></div>
                   <Disc size={64} className="text-primary animate-[spin_10s_linear_infinite]" />
                   <h3 className="text-2xl font-black italic tracking-tighter z-10">TE RURUBENE</h3>
                   <p className="text-sm text-primary font-bold tracking-widest uppercase z-10">The Human Recorders</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-8 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-64 bg-primary/20 blur-[120px] rounded-full pointer-events-none"></div>
        <h2 className="text-4xl font-black mb-6 relative z-10">Ready to dive in?</h2>
        <p className="text-muted-foreground mb-10 max-w-lg mx-auto relative z-10">Join thousands of listeners supporting Pacific culture. Your journey starts here.</p>
        <div className="flex items-center justify-center space-x-4 relative z-10">
          <Link href="/register" className="px-8 py-4 bg-primary text-primary-foreground font-bold rounded-full hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
            Create Free Account
          </Link>
          <Link href="/login" className="px-8 py-4 bg-transparent border border-white/20 text-white font-bold rounded-full hover:bg-white/5 transition-colors">
            Log In
          </Link>
        </div>
      </section>

    </div>
  );
}
