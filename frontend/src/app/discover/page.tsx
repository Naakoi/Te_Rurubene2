'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import Link from 'next/link';
import { Sparkles, TrendingUp, Music, User, Play, Search, Zap, Film, ShoppingCart, Library, Check } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import { useCartStore } from '@/store/cartStore';
import OfflineView from '@/components/OfflineView';

export default function DiscoverPage() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const { setCurrentMedia, playNext, addToQueue } = usePlayerStore();
  const { addItem } = useCartStore();

  useEffect(() => {
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

  const handleAddToCart = (track: any) => {
    addItem({
        id: track.id,
        type: 'track',
        name: track.title,
        price: Number(track.price),
        image_url: track.cover_url,
        quantity: 1,
        creator_id: track.artist_id,
        creator_name: track.artist?.name || track.artist?.user?.name
    });
  };

  const handleAddFreeToLibrary = async (track: any, setTracks?: (fn: (prev: any[]) => any[]) => void, tracksState?: any[]) => {
    try {
      await api.post('/api/checkout', {
        items: [{ id: track.id, type: 'track', price: 0 }],
        total: 0
      });
      if (setTracks) {
        setTracks((prev: any[]) => prev.map((t: any) => t.id === track.id ? { ...t, is_purchased: true } : t));
      }
    } catch (err: any) {
      console.error('Free library add failed:', err);
      alert(err.response?.data?.message || 'Failed to add to library. Please try again.');
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    api.get(`/api/search/semantic?q=${searchQuery}`)
      .then(res => setSearchResults(res.data.results))
      .catch(err => console.error("Search failed:", err))
      .finally(() => setIsSearching(false));
  };

  useEffect(() => {
    if (isOffline) return;

    // Public Content
    api.get('/api/videos')
        .then(res => setVideos(res.data))
        .catch(() => console.log('Public videos fetch failed'));

    // Personalized Content (Requires Auth)
    api.get('/api/recommendations')
        .then(res => {
          if (res.data && res.data.length > 0) {
            setRecommendations(res.data);
          } else {
            // Fallback to trending tracks if no personal recommendations
            api.get('/api/tracks').then(r => setRecommendations(r.data));
          }
        })
        .catch(() => {
          console.log('Personalized recommendations skipped (Guest Mode)');
          api.get('/api/tracks').then(r => setRecommendations(r.data)).catch(() => {});
        })
        .finally(() => setLoading(false));
  }, [isOffline]);
  const handleSmartPlaylist = (mood: string) => {
    api.post('/api/smart-playlist', { mood })
      .then(res => {
          if (res.data.tracks.length > 0) {
              const track = res.data.tracks[0];
              setCurrentMedia({
                id: track.id,
                title: track.title,
                artist: track.artist,
                type: 'audio',
                stream_url: track.file_url || track.audio_file_path,
                cover_url: track.cover_url
              });
              alert(`AI generated a ${mood} playlist for you!`);
          }
      });
  };

  if (isOffline) {
    return <OfflineView pageName="AI Discover" description="AI Recommendations, smart playlists, and video channels require an active internet connection. You can still listen to your downloaded music in your library." />;
  }

  return (
    <div className="p-8">
      <header className="mb-12">
        <div className="flex items-center space-x-3 mb-2">
            <Sparkles className="text-primary animate-pulse" size={24} />
            <span className="text-primary font-bold uppercase tracking-widest text-xs">AI Discovery</span>
        </div>
        <h1 className="text-4xl font-black">Experience the Pacific</h1>
        <p className="text-muted-foreground mt-2">Personalized sounds tailored to your vibe.</p>
      </header>

      {/* Smart Discovery Tools */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
              { mood: 'Chill', color: 'bg-blue-500', icon: <Music size={24} />, desc: 'Relaxing island melodies' },
              { mood: 'Energetic', color: 'bg-orange-500', icon: <Zap size={24} />, desc: 'High-energy dance hits' },
              { mood: 'Traditional', color: 'bg-green-500', icon: <TrendingUp size={24} />, desc: 'Pure cultural heritage' }
          ].map((tool) => (
            <div 
                key={tool.mood}
                onClick={() => handleSmartPlaylist(tool.mood)}
                className="glass-card p-8 rounded-3xl group hover:border-primary/50 transition cursor-pointer relative overflow-hidden"
            >
                <div className={`absolute -right-10 -top-10 w-32 h-32 ${tool.color} opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition`}></div>
                <div className={`${tool.color}/20 text-white w-12 h-12 rounded-2xl flex items-center justify-center mb-6`}>
                    {tool.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">Smart {tool.mood}</h3>
                <p className="text-sm text-muted-foreground">{tool.desc}</p>
            </div>
          ))}
      </div>

      {/* AI Recommendations Section */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold flex items-center space-x-3">
                <TrendingUp className="text-primary" size={24} />
                <span>Recommended for You</span>
            </h2>
        </div>

        {loading ? (
            <div className="media-grid">
                {[1,2,3,4,5,6,7,8,9,10].map(i => (
                  <div key={i} className="media-card animate-pulse">
                    <div className="media-card-thumb bg-white/5"></div>
                    <div className="h-4 bg-white/5 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-white/5 rounded w-1/2"></div>
                  </div>
                ))}
            </div>
        ) : (
            <div className="media-grid">
                {recommendations.map(track => (
                    <div 
                        key={track.id}
                        className="media-card group"
                    >
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
                            {track.cover_url && <img src={track.cover_url} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition space-x-2">
                                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:scale-110 transition">
                                    <Play size={20} fill="currentColor" />
                                </div>
                            </div>
                        </div>
                        <div className="mt-3">
                           <h3 className="media-card-title hover:underline cursor-pointer">{track.title}</h3>
                           <Link 
                             href={`/marketplace/stores/artist/${track.artist?.id}`}
                             onClick={(e) => e.stopPropagation()}
                             className="media-card-artist hover:text-primary transition inline-block"
                           >
                               {track.artist?.name}
                           </Link>
                           {track.is_purchased ? (
                             <div className="w-full mt-3 px-3 py-1.5 bg-green-500/10 text-green-400 text-[10px] font-bold rounded-lg border border-green-500/20 flex items-center justify-between">
                               <Check size={12} />
                               <span>IN LIBRARY</span>
                             </div>
                           ) : Number(track.price) === 0 ? (
                             <button
                               onClick={(e) => { e.stopPropagation(); handleAddFreeToLibrary(track, setRecommendations, recommendations); }}
                               className="w-full mt-3 px-3 py-1.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded-lg border border-blue-500/20 hover:bg-blue-500 hover:text-white transition flex items-center justify-between group/btn"
                             >
                               <Library size={12} className="group-hover/btn:scale-110 transition" />
                               <span>ADD TO LIBRARY</span>
                             </button>
                           ) : (
                             <button
                               onClick={(e) => { e.stopPropagation(); handleAddToCart(track); }}
                               className="w-full mt-3 px-3 py-1.5 bg-primary/10 text-primary text-[10px] font-bold rounded-lg border border-primary/20 hover:bg-primary hover:text-primary-foreground transition flex items-center justify-between group/btn"
                             >
                               <ShoppingCart size={12} className="group-hover/btn:scale-110 transition" />
                               <span>${Number(track.price).toFixed(2)} AUD</span>
                             </button>
                           )}
                        </div>
                    </div>
                ))}
            </div>
        )}
      </section>

      {/* Pacific Originals (Videos) */}
      <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold flex items-center space-x-3">
                  <Play className="text-primary" size={24} />
                  <span>Pacific Originals</span>
              </h2>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {videos.length > 0 ? videos.map(video => (
                  <div key={video.id} className="group">
                      <div className="aspect-video mb-4 rounded-2xl overflow-hidden glass-card border-white/10 group-hover:border-primary/50 transition duration-300 relative">
                          {video.thumbnail_url || video.cover_url ? (
                              <img src={video.thumbnail_url || video.cover_url} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                          ) : (
                              <div className="w-full h-full bg-secondary flex items-center justify-center">
                                  <Film size={48} className="text-muted-foreground/20" />
                              </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition space-x-4">
                              <button 
                                  onClick={() => setCurrentMedia({
                                      id: video.id,
                                      title: video.title,
                                      artist: video.artist,
                                      type: 'video',
                                      stream_url: `${api.defaults.baseURL}/api/videos/stream/${video.id}`,
                                      cover_url: video.thumbnail_url || video.cover_url
                                  })}
                                  className="w-16 h-16 rounded-full bg-primary flex items-center justify-center hover:scale-110 transition"
                              >
                                  <Play size={32} fill="currentColor" />
                              </button>
                              <button 
                                  onClick={() => playNext({
                                      id: video.id,
                                      title: video.title,
                                      artist: video.artist,
                                      type: 'video',
                                      stream_url: `${api.defaults.baseURL}/api/videos/stream/${video.id}`,
                                      cover_url: video.thumbnail_url || video.cover_url
                                  })}
                                  className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition"
                                  title="Play Next"
                              >
                                  <Zap size={24} />
                              </button>
                          </div>
                      </div>
                      <div className="flex space-x-3">
                          <div className="w-10 h-10 rounded-full bg-secondary flex-shrink-0 overflow-hidden border border-white/10">
                              {video.artist?.avatar_url ? (
                                  <img src={video.artist.avatar_url} className="w-full h-full object-cover" />
                              ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-primary/20 text-primary">
                                      <User size={20} />
                                  </div>
                              )}
                          </div>
                          <div className="flex-1 overflow-hidden">
                              <h3 className="font-bold text-base leading-snug group-hover:text-primary transition line-clamp-2">{video.title}</h3>
                              <Link 
                                 href={`/marketplace/stores/artist/${video.artist?.id}`}
                                 onClick={(e) => e.stopPropagation()}
                                 className="text-sm text-muted-foreground mt-1 hover:text-primary transition inline-block"
                               >
                                   {video.artist?.name}
                               </Link>
                              <div className="flex items-center text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-semibold">
                                  <span>{video.is_premium ? 'Premium' : 'Free'} Content</span>
                              </div>
                          </div>
                      </div>
                  </div>
              )) : (
                  <div className="col-span-full glass-card p-12 text-center rounded-3xl border-dashed">
                      <p className="text-muted-foreground">No videos available yet. Check back soon for exclusive content!</p>
                  </div>
              )}
          </div>
      </section>

      {/* Semantic Search Promo */}
      <div className="glass-card rounded-3xl p-10 bg-gradient-to-br from-primary/20 to-blue-600/10 border-primary/20">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold mb-4">Can't find what you're looking for?</h2>
            <p className="text-muted-foreground mb-8">Try our AI-powered semantic search. Instead of just song titles, try searching for "upbeat reggae for a beach party" or "soulful tunes for a rainy night."</p>
            <form onSubmit={handleSearch} className="flex items-center bg-white/10 rounded-2xl p-2 pl-6">
                <Search className="text-muted-foreground mr-4" size={20} />
                <input 
                    type="text" 
                    placeholder="Describe your mood..." 
                    className="bg-transparent border-none outline-none flex-1 text-lg py-2"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button 
                    type="submit" 
                    disabled={isSearching}
                    className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold hover:scale-105 transition disabled:opacity-50"
                >
                    {isSearching ? 'Searching...' : 'Find Vibes'}
                </button>
            </form>
          </div>
      </div>

      {/* Search Results Display */}
      {searchResults.length > 0 && (
          <section className="mt-16">
              <h2 className="text-2xl font-bold mb-8">Search Results</h2>
              <div className="media-grid">
                {searchResults.map(track => (
                    <div 
                        key={track.id}
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
                        className="media-card group"
                    >
                        <div className="media-card-thumb">
                            {track.cover_url && <img src={track.cover_url} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition space-x-2">
                                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:scale-110 transition">
                                    <Play size={20} fill="currentColor" />
                                </div>
                            </div>
                        </div>
                        <h3 className="media-card-title">{track.title}</h3>
                        <Link 
                            href={`/marketplace/stores/artist/${track.artist?.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="media-card-artist hover:text-primary transition inline-block"
                         >
                             {track.artist?.name}
                         </Link>
                          {track.is_purchased ? (
                            <div className="w-full mt-3 px-3 py-1.5 bg-green-500/10 text-green-400 text-[10px] font-bold rounded-lg border border-green-500/20 flex items-center justify-between">
                              <Check size={12} />
                              <span>IN LIBRARY</span>
                            </div>
                          ) : Number(track.price) === 0 ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleAddFreeToLibrary(track, setSearchResults, searchResults); }}
                              className="w-full mt-3 px-3 py-1.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded-lg border border-blue-500/20 hover:bg-blue-500 hover:text-white transition flex items-center justify-between group/btn"
                            >
                              <Library size={12} className="group-hover/btn:scale-110 transition" />
                              <span>ADD TO LIBRARY</span>
                            </button>
                          ) : (
                            <button onClick={(e) => { e.stopPropagation(); handleAddToCart(track); }} className="w-full mt-3 px-3 py-1.5 bg-primary/10 text-primary text-[10px] font-bold rounded-lg border border-white/10 hover:bg-primary hover:text-primary-foreground transition flex items-center justify-between group/btn"><ShoppingCart size={12} className="group-hover/btn:scale-110 transition" /><span>${Number(track.price).toFixed(2)} AUD</span></button>
                          )}
                    </div>
                ))}
            </div>
          </section>
      )}
    </div>
  );
}
