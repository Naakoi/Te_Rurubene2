'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { 
    ShoppingCart, ArrowLeft, Tag, ShoppingBag, Music, Play, Video, 
    LayoutGrid, List, Search, ArrowUpDown, ChevronRight, Mic,
    Edit, Trash2, Settings, Calendar, Send, UserPlus, Info, Library, Check
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { usePlayerStore } from '@/store/playerStore';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';

export default function StorefrontPage() {
  const { type, id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'title'>('latest');
  const [activeProductTab, setActiveProductTab] = useState('All');
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquirySent, setInquirySent] = useState(false);
  const [buyingTicket, setBuyingTicket] = useState<any>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [relatedCreators, setRelatedCreators] = useState<any[]>([]);
  
  const { user } = useAuthStore();
  const { addItem } = useCartStore();
  const { setCurrentMedia } = usePlayerStore();

  const isOwner = useMemo(() => {
    if (!user || !data?.creator) return false;
    if (type === 'artist') return (user as any).artist?.id === Number(id);
    if (type === 'studio') return (user as any).studio?.id === Number(id);
    return false;
  }, [user, data, type, id]);

  useEffect(() => {
    fetchData();
    fetchRelated();
  }, [type, id]);

  const fetchRelated = () => {
      api.get('/api/stores').then(res => {
          // Get 4 random stores excluding current
          const filtered = res.data.filter((s: any) => s.id !== Number(id) || s.store_type !== type);
          setRelatedCreators(filtered.sort(() => 0.5 - Math.random()).slice(0, 4));
      });
  };

  const fetchData = () => {
    setLoading(true);
    api.get(`/api/storefront/${type}/${id}`)
      .then(res => setData(res.data))
      .catch(err => console.error('Failed to fetch storefront', err))
      .finally(() => setLoading(false));
  };

  const handleBuyProduct = async (product: any) => {
      addItem({
          id: product.id,
          type: 'product',
          name: product.name,
          price: Number(product.price),
          image_url: product.image_url,
          quantity: 1,
          creator_id: Number(id),
          creator_name: data.creator.user?.name
      });
  };

  const handleBuyTrack = async (track: any) => {
      addItem({
          id: track.id,
          type: 'track',
          name: track.title,
          price: Number(track.price) > 0 ? Number(track.price) : 0.99,
          image_url: track.cover_url,
          quantity: 1,
          creator_id: track.artist_id,
          creator_name: track.artist?.user?.name || track.artist?.name
      });
  };

  const handleAddFreeToLibrary = async (track: any) => {
    try {
      await api.post('/api/checkout', {
        items: [{ id: track.id, type: 'track', price: 0 }],
        total: 0
      });
      // Update local state tracks' is_purchased status
      setData((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          tracks: prev.tracks.map((t: any) => t.id === track.id ? { ...t, is_purchased: true } : t)
        };
      });
    } catch (err: any) {
      console.error('Free library add failed:', err);
      alert(err.response?.data?.message || 'Failed to add to library. Please try again.');
    }
  };

  const handleDeleteProduct = async (productId: number) => {
      if (!confirm('Are you sure you want to delete this product?')) return;
      try {
          await api.delete(`/api/products/${productId}`);
          fetchData(); // Refresh
      } catch (err) {
          console.error('Failed to delete product', err);
          alert('Failed to delete product');
      }
  };

  const handleBuyTicket = async (event: any) => {
      try {
          const res = await api.post(`/api/events/${event.id}/tickets`);
          setPurchaseSuccess(true);
          setBuyingTicket(null);
          alert('Ticket purchased successfully! Check your email for the QR code.');
      } catch (err: any) {
          console.error('Failed to buy ticket', err);
          alert(err.response?.data?.message || 'Failed to purchase ticket. Check your wallet balance.');
      }
  };

  const handleSendInquiry = (e: React.FormEvent) => {
      e.preventDefault();
      setInquirySent(true);
      setTimeout(() => {
          setShowInquiryModal(false);
          setInquirySent(false);
      }, 2000);
  };

  const handlePlayTrack = (track: any) => {
      setCurrentMedia({
          id: track.id,
          title: track.title,
          artist: track.artist,
          type: 'audio',
          stream_url: track.file_url || track.audio_file_path,
          cover_url: track.cover_url,
          price: track.price,
          is_purchased: track.is_purchased
      });
  };

  // Filter and Sort Tracks
  const filteredTracks = useMemo(() => {
    if (!data?.tracks) return [];
    let filtered = data.tracks.filter((t: any) => 
        t.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (sortBy === 'title') filtered.sort((a: any, b: any) => a.title.localeCompare(b.title));
    if (sortBy === 'oldest') filtered.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    if (sortBy === 'latest') filtered.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return filtered;
  }, [data, searchQuery, sortBy]);

  // Filter and Sort Videos
  const filteredVideos = useMemo(() => {
    if (!data?.videos) return [];
    let filtered = data.videos.filter((v: any) => 
        v.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (sortBy === 'title') filtered.sort((a: any, b: any) => a.title.localeCompare(b.title));
    if (sortBy === 'oldest') filtered.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    if (sortBy === 'latest') filtered.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return filtered;
  }, [data, searchQuery, sortBy]);

  // Group products by category
  const productCategories = useMemo(() => {
      if (!data?.products) return ['All'];
      const categories = ['All', ...(Array.from(new Set(data.products.map((p: any) => p.category || 'Other'))) as string[])];
      return categories;
  }, [data]);

  const filteredProducts = useMemo(() => {
      if (!data?.products) return [];
      if (activeProductTab === 'All') return data.products;
      return data.products.filter((p: any) => (p.category || 'Other') === activeProductTab);
  }, [data, activeProductTab]);

  if (loading) return (
      <div className="p-8 space-y-10 animate-pulse">
          <div className="h-40 bg-white/5 rounded-3xl"></div>
          <div className="h-10 w-64 bg-white/5 rounded-full"></div>
          <div className="grid grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => <div key={i} className="aspect-square bg-white/5 rounded-2xl"></div>)}
          </div>
      </div>
  );

  if (!data) return <div className="p-20 text-center">Creator not found</div>;

  const { creator } = data;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-12 glass-card p-10 rounded-[3rem] border border-white/5 relative overflow-hidden flex flex-col md:flex-row items-center md:items-end space-y-6 md:space-y-0 md:space-x-10">
          <div className="w-40 h-40 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-black text-6xl shadow-2xl relative z-10">
              {creator.user?.name?.charAt(0)}
          </div>
          <div className="relative z-10 text-center md:text-left">
              <div className="flex items-center space-x-3 mb-2 justify-center md:justify-start">
                <Link href="/marketplace/stores" className="p-2 glass rounded-full hover:text-primary transition mr-2">
                    <ArrowLeft size={16} />
                </Link>
                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full border border-primary/20">Verified {type}</span>
              </div>
              <h1 className="text-5xl font-black tracking-tighter mb-2">{creator.user?.name}</h1>
              <p className="text-muted-foreground text-lg max-w-xl">{creator.bio || 'Official Te Rurubene Storefront.'}</p>
          </div>
          {isOwner && (
              <div className="absolute top-10 right-10 flex space-x-4">
                  <Link href="/studio/store" className="bg-primary text-primary-foreground px-6 py-2 rounded-full font-bold flex items-center space-x-2 shadow-xl hover:scale-105 transition">
                      <Settings size={18} />
                      <span>Manage My Store</span>
                  </Link>
              </div>
          )}
      </div>

      {/* SEARCH & CONTROL BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                  type="text" 
                  placeholder="Search music and videos..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-12 pr-4 focus:border-primary outline-none transition"
              />
          </div>
          <div className="flex items-center space-x-4">
              <div className="flex items-center bg-white/5 rounded-full p-1 border border-white/10">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-full transition ${viewMode === 'grid' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-white'}`}
                  >
                      <LayoutGrid size={18} />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-full transition ${viewMode === 'list' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-white'}`}
                  >
                      <List size={18} />
                  </button>
              </div>
              <div className="relative group">
                  <select 
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="appearance-none bg-white/5 border border-white/10 rounded-full py-2 px-10 text-sm font-bold outline-none cursor-pointer hover:bg-white/10 transition"
                  >
                      <option value="latest">Latest</option>
                      <option value="oldest">Oldest</option>
                      <option value="title">A-Z</option>
                  </select>
                  <ArrowUpDown size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
              </div>
          </div>
      </div>

      {/* SHOWCASE SECTIONS (Top Part) */}
      <div className="space-y-16 mb-20">
          {/* MUSIC SHOWCASE */}
          {filteredTracks.length > 0 && (
              <section>
                  <div className="flex items-center justify-between mb-8">
                      <h2 className="text-2xl font-black tracking-tight flex items-center space-x-3">
                          <Music className="text-primary" />
                          <span>Music Showcase</span>
                      </h2>
                  </div>

                  {viewMode === 'grid' ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                          {filteredTracks.map((track: any) => (
                              <div key={track.id} className="group cursor-pointer" onClick={() => handlePlayTrack(track)}>
                                  <div className="aspect-square rounded-2xl bg-secondary relative overflow-hidden mb-3 shadow-lg">
                                      {track.cover_url ? (
                                          <img src={track.cover_url} alt={track.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                                      ) : (
                                          <div className="w-full h-full bg-gradient-to-br from-primary/40 to-blue-600/40"></div>
                                      )}
                                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition space-x-4">
                                          <div className="p-3 bg-primary rounded-full hover:scale-110 transition shadow-lg">
                                              <Play size={24} fill="white" />
                                          </div>
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); handleBuyTrack(track); }}
                                            className="p-3 bg-white text-black rounded-full hover:scale-110 transition shadow-lg"
                                          >
                                              <ShoppingCart size={24} />
                                          </button>
                                      </div>
                                  </div>
                                  <h3 className="font-bold text-sm truncate group-hover:text-primary transition">{track.title}</h3>
                                  <div className="flex flex-col space-y-1">
                                      <Link 
                                        href={`/marketplace/stores/artist/${track.artist_id}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-[10px] text-muted-foreground uppercase tracking-widest hover:text-primary transition"
                                      >
                                          {track.artist?.user?.name || 'Various Artists'}
                                      </Link>
                                      {track.is_purchased ? (
                                          <div className="mt-2 w-full px-2 py-1 bg-green-500/10 text-green-500 text-[10px] font-bold rounded-lg border border-green-500/20 flex items-center justify-between">
                                              <Check size={12} />
                                              <span>IN LIBRARY</span>
                                          </div>
                                      ) : Number(track.price) === 0 ? (
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); handleAddFreeToLibrary(track); }}
                                            className="mt-2 w-full px-2 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded-lg border border-blue-500/20 hover:bg-blue-500 hover:text-white transition flex items-center justify-between group/btn"
                                          >
                                              <Library size={12} className="group-hover/btn:scale-110 transition" />
                                              <span>ADD TO LIBRARY</span>
                                          </button>
                                      ) : (
                                          <button onClick={(e) => { e.stopPropagation(); handleBuyTrack(track); }} className="mt-2 w-full px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-lg border border-primary/20 hover:bg-primary hover:text-primary-foreground transition flex items-center justify-between group/btn"><ShoppingCart size={12} className="group-hover/btn:scale-110 transition" /><span>${(Number(track.price) > 0 ? Number(track.price) : 0.99).toFixed(2)}</span></button>
                                      )}
                                  </div>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <div className="space-y-2">
                          {filteredTracks.map((track: any) => (
                              <div 
                                  key={track.id} 
                                  className="glass flex items-center p-4 rounded-2xl border border-white/5 hover:bg-white/5 transition group cursor-pointer"
                                  onClick={() => handlePlayTrack(track)}
                              >
                                  <div className="w-12 h-12 rounded-lg bg-secondary mr-6 overflow-hidden relative flex-shrink-0">
                                      {track.cover_url ? <img src={track.cover_url} alt={track.title} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-primary/20"></div>}
                                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><Play size={16} fill="white" /></div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <h3 className="font-bold truncate">{track.title}</h3>
                                      <Link 
                                        href={`/marketplace/stores/artist/${track.artist_id}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-xs text-muted-foreground hover:text-primary transition inline-block"
                                      >
                                          {track.artist?.user?.name || 'Various Artists'}
                                      </Link>
                                  </div>
                                  <div className="flex items-center space-x-4">
                                      <span className="text-sm font-black text-white">
                                          {Number(track.price) === 0 ? 'Free' : `$${Number(track.price).toFixed(2)}`}
                                      </span>
                                      {track.is_purchased ? (
                                          <div className="px-3 py-1 bg-green-500/10 text-green-500 text-[10px] font-bold uppercase rounded-full border border-green-500/20">
                                              Owned
                                          </div>
                                      ) : Number(track.price) === 0 ? (
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); handleAddFreeToLibrary(track); }}
                                            className="px-3 py-1.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded-lg border border-blue-500/20 hover:bg-blue-500 hover:text-white transition flex items-center space-x-3 group/btn"
                                          >
                                              <Library size={14} className="group-hover/btn:scale-110 transition" />
                                              <span>ADD TO LIBRARY</span>
                                          </button>
                                      ) : (
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); handleBuyTrack(track); }}
                                            className="px-3 py-1.5 bg-primary/10 text-primary text-[10px] font-bold rounded-lg border border-primary/20 hover:bg-primary hover:text-primary-foreground transition flex items-center space-x-3 group/btn"
                                          >
                                              <ShoppingCart size={14} className="group-hover/btn:scale-110 transition" />
                                              <span className="border-l border-primary/30 pl-3">${Number(track.price).toFixed(2)}</span>
                                          </button>
                                      )}
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </section>
          )}

          {/* VIDEO SHOWCASE */}
          {filteredVideos.length > 0 && (
              <section>
                  <div className="flex items-center justify-between mb-8">
                      <h2 className="text-2xl font-black tracking-tight flex items-center space-x-3">
                          <Video className="text-primary" />
                          <span>Video Productions</span>
                      </h2>
                  </div>

                  <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1'} gap-6`}>
                      {filteredVideos.map((video: any) => (
                          <div key={video.id} className={`group cursor-pointer ${viewMode === 'list' ? 'flex items-center space-x-6 glass p-4 rounded-2xl border border-white/5' : ''}`}>
                              <div className={`${viewMode === 'list' ? 'w-48 h-28' : 'aspect-video'} bg-black rounded-2xl overflow-hidden relative flex-shrink-0 shadow-xl`}>
                                   {video.thumbnail_url ? <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" /> : <div className="w-full h-full bg-gray-900"></div>}
                                   <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center"><Play size={20} fill="white" /></div></div>
                              </div>
                              <div className="mt-4 flex-1">
                                  <h3 className="font-bold text-lg group-hover:text-primary transition">{video.title}</h3>
                                  <p className="text-sm text-muted-foreground line-clamp-1">{video.description || 'Professional production.'}</p>
                              </div>
                          </div>
                      ))}
                  </div>
              </section>
          )}
      </div>

      {/* PRODUCTS SECTION (With Tabs) */}
      <section className="mb-20">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <h2 className="text-2xl font-black tracking-tight flex items-center space-x-3">
                  <ShoppingBag className="text-primary" />
                  <span>Store Products</span>
              </h2>
              {/* CATEGORY TABS */}
              <div className="flex items-center space-x-2 bg-white/5 p-1 rounded-xl border border-white/10 overflow-x-auto no-scrollbar">
                  {productCategories.map(cat => (
                      <button 
                        key={cat}
                        onClick={() => setActiveProductTab(cat)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${activeProductTab === cat ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-white'}`}
                      >
                          {cat}
                      </button>
                  ))}
              </div>
          </div>

          {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredProducts.map((product: any) => (
                      <div key={product.id} className="glass-card group rounded-2xl border border-white/5 overflow-hidden flex flex-col h-full hover:border-primary/20 transition-all duration-500">
                          <div className="aspect-square bg-secondary relative overflow-hidden">
                              {product.image_url ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" /> : <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary/20"><ShoppingBag size={48} /></div>}
                              <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md border border-white/10 flex items-center space-x-1">
                                  <Tag size={12} className="text-primary" />
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-white">{product.category || 'Item'}</span>
                              </div>
                          </div>
                          <div className="p-5 flex-1 flex flex-col justify-between">
                              <div>
                                  <div className="flex justify-between items-start mb-2">
                                      <h3 className="font-bold text-lg group-hover:text-primary transition">{product.name}</h3>
                                      {isOwner && (
                                          <div className="flex items-center space-x-2">
                                              <Link href={`/studio/store?edit=${product.id}`} className="p-1.5 glass rounded-lg hover:text-primary transition">
                                                  <Edit size={14} />
                                              </Link>
                                              <button 
                                                onClick={() => handleDeleteProduct(product.id)}
                                                className="p-1.5 glass rounded-lg hover:text-red-500 transition"
                                              >
                                                  <Trash2 size={14} />
                                              </button>
                                          </div>
                                      )}
                                  </div>
                                  <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{product.description}</p>
                              </div>
                              <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                                  <button 
                                      onClick={() => handleBuyProduct(product)} 
                                      className="w-full mt-4 px-4 py-2.5 bg-primary text-primary-foreground text-[10px] font-black rounded-xl hover:bg-primary/90 transition flex items-center justify-between group/btn shadow-lg shadow-primary/20"
                                  >
                                      <ShoppingCart size={14} className="group-hover/btn:scale-110 transition" />
                                      <span>${Number(product.price).toFixed(2)} AUD</span>
                                  </button>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          ) : (
              <div className="py-20 text-center glass rounded-3xl border-dashed border-2 border-white/10">
                  <p className="text-muted-foreground">No items found in this category.</p>
              </div>
          )}
      </section>

      {/* CTA */}
      <div className="py-20 text-center glass rounded-[4rem] border border-white/5 relative overflow-hidden">
          <div className="relative z-10">
              <h2 className="text-4xl font-black mb-6 italic tracking-tighter">Production Inquiries?</h2>
              <p className="text-muted-foreground text-xl mb-10">Collaborate with {creator.user?.name} on your next project.</p>
              <button 
                onClick={() => setShowInquiryModal(true)}
                className="bg-primary text-primary-foreground px-10 py-4 rounded-full font-black text-lg hover:scale-105 transition shadow-2xl shadow-primary/30"
              >
                  CONTACT FOR PRODUCTION
              </button>
          </div>
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-primary/20 blur-[120px] rounded-full"></div>
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-600/20 blur-[120px] rounded-full"></div>
      </div>

      {/* UPCOMING EVENTS */}
      {data.events?.length > 0 && (
          <section className="mt-20">
              <h2 className="text-2xl font-black tracking-tight flex items-center space-x-3 mb-10">
                  <Calendar className="text-primary" />
                  <span>Upcoming Events & Shows</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {data.events.map((event: any) => (
                      <div key={event.id} className="glass p-8 rounded-3xl border border-white/5 hover:border-primary/30 transition group">
                          <div className="flex justify-between items-start mb-6">
                              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black flex-col">
                                  <span className="text-xs uppercase">{new Date(event.event_date).toLocaleString('default', { month: 'short' })}</span>
                                  <span className="text-xl">{new Date(event.event_date).getDate()}</span>
                              </div>
                              <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-muted-foreground border border-white/10">{event.location || 'Virtual'}</span>
                          </div>
                          <h3 className="text-xl font-black mb-2 group-hover:text-primary transition">{event.title}</h3>
                          <p className="text-sm text-muted-foreground mb-8 line-clamp-2">{event.description}</p>
                          <div className="flex items-center justify-between pt-6 border-t border-white/5">
                              <span className="text-lg font-black">${Number(event.ticket_price).toFixed(2)}</span>
                              <button 
                                onClick={() => setBuyingTicket(event)}
                                className="px-6 py-2 bg-primary text-primary-foreground rounded-full text-xs font-black hover:scale-105 transition shadow-lg shadow-primary/20"
                              >
                                  GET TICKET
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
          </section>
      )}

      {/* RELATED CREATORS */}
      {relatedCreators.length > 0 && (
          <section className="mt-32">
              <h2 className="text-2xl font-black tracking-tight flex items-center space-x-3 mb-10">
                  <UserPlus className="text-primary" />
                  <span>Explore Other Creators</span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {relatedCreators.map((s: any) => (
                      <Link key={`${s.store_type}-${s.id}`} href={`/marketplace/stores/${s.store_type}/${s.id}`} className="glass p-6 rounded-[2rem] border border-white/5 hover:bg-white/5 transition text-center group">
                          <div className="w-20 h-20 bg-gradient-to-br from-primary/40 to-blue-600/40 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-black shadow-xl group-hover:scale-110 transition">
                              {s.user?.name?.charAt(0)}
                          </div>
                          <h4 className="font-bold text-sm truncate">{s.user?.name}</h4>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{s.store_type}</span>
                      </Link>
                  ))}
              </div>
          </section>
      )}

      {/* INQUIRY MODAL */}
      {showInquiryModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setShowInquiryModal(false)}></div>
              <div className="glass-card w-full max-w-lg p-10 rounded-[3rem] border border-white/10 relative z-10 shadow-2xl animate-in fade-in zoom-in duration-300">
                  <h2 className="text-3xl font-black mb-2 flex items-center space-x-4 italic tracking-tighter">
                      <Send className="text-primary" />
                      <span>Direct Inquiry</span>
                  </h2>
                  <p className="text-muted-foreground mb-8">Send a production request directly to {creator.user?.name}.</p>
                  
                  {inquirySent ? (
                      <div className="py-10 text-center animate-bounce">
                          <div className="w-20 h-20 bg-green-500 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg shadow-green-500/20">
                              <Send className="text-white" />
                          </div>
                          <h3 className="text-2xl font-black">Inquiry Sent!</h3>
                          <p className="text-muted-foreground">We'll get back to you soon.</p>
                      </div>
                  ) : (
                      <form onSubmit={handleSendInquiry} className="space-y-6">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Project Type</label>
                              <select className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 outline-none focus:border-primary transition font-bold">
                                  <option>Music Production</option>
                                  <option>Video Production</option>
                                  <option>Live Performance</option>
                                  <option>Collaboration</option>
                              </select>
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Your Message</label>
                              <textarea 
                                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 outline-none focus:border-primary transition min-h-[150px]"
                                  placeholder="Describe your vision..."
                                  required
                              ></textarea>
                          </div>
                          <button type="submit" className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black text-lg hover:bg-primary/90 transition shadow-xl shadow-primary/20">
                              SEND MESSAGE
                          </button>
                      </form>
                  )}
              </div>
          </div>
      )}

      {/* TICKET BUY MODAL */}
      {buyingTicket && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setBuyingTicket(null)}></div>
              <div className="glass-card w-full max-w-md p-10 rounded-[3rem] border border-white/10 relative z-10 shadow-2xl">
                  <div className="flex items-center space-x-4 mb-8">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                          <Calendar size={24} />
                      </div>
                      <div>
                          <h2 className="text-2xl font-black italic tracking-tighter">Confirm Ticket</h2>
                          <p className="text-xs text-muted-foreground uppercase tracking-widest">{buyingTicket.title}</p>
                      </div>
                  </div>

                  <div className="space-y-6 mb-10">
                      <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Price</span>
                          <span className="font-black text-lg">${Number(buyingTicket.ticket_price).toFixed(2)} AUD</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Date</span>
                          <span className="font-bold">{new Date(buyingTicket.event_date).toLocaleDateString()}</span>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-start space-x-3">
                          <Info className="text-primary mt-1" size={16} />
                          <p className="text-[10px] text-muted-foreground leading-relaxed">
                              This ticket will be added to your digital vault. A unique QR code will be generated for entry. Tickets are non-refundable.
                          </p>
                      </div>
                  </div>

                  <div className="flex space-x-4">
                      <button 
                        onClick={() => setBuyingTicket(null)}
                        className="flex-1 py-3 glass rounded-2xl font-bold hover:bg-white/10 transition"
                      >
                          CANCEL
                      </button>
                      <button 
                        onClick={() => handleBuyTicket(buyingTicket)}
                        className="flex-[2] py-3 bg-primary text-primary-foreground rounded-2xl font-black hover:bg-primary/90 transition shadow-xl shadow-primary/20"
                      >
                          PURCHASE NOW
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
