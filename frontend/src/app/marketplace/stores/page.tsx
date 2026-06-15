'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Store, ArrowRight, User } from 'lucide-react';
import api from '@/lib/axios';
import OfflineView from '@/components/OfflineView';

export default function StoresPage() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');

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

  useEffect(() => {
    if (isOffline) return;

    api.get('/api/stores')
      .then(res => setStores(res.data))
      .catch(err => console.error('Failed to fetch stores', err))
      .finally(() => setLoading(false));
  }, [isOffline]);

  const filteredStores = stores
    .filter(store => 
      store.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.genre?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return (a.user?.name || '').localeCompare(b.user?.name || '');
      }
      if (sortBy === 'genre') {
        return (a.genre || '').localeCompare(b.genre || '');
      }
      return 0;
    });

  if (isOffline) {
    return <OfflineView pageName="Public Stores" description="Public stores and creator merchandise require an active internet connection. You can still listen to your downloaded music in your library." />;
  }

  return (
    <div className="p-8">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Public Stores</h1>
          <p className="text-muted-foreground">Support your favorite Pacific creators directly.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
            {/* Search Bar */}
            <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input 
                    type="text"
                    placeholder="Search stores..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-primary outline-none transition"
                />
            </div>

            {/* Sort Dropdown */}
            <div className="relative w-full sm:w-48">
                <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm focus:border-primary outline-none transition appearance-none cursor-pointer"
                >
                    <option value="name" className="bg-[#0a0d14]">Sort by Name</option>
                    <option value="genre" className="bg-[#0a0d14]">Sort by Genre</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-white/5 rounded-3xl border border-white/10"></div>
          ))}
        </div>
      ) : filteredStores.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStores.map((artist) => (
            <Link key={artist.id} href={`/marketplace/stores/${artist.store_type}/${artist.id}`} className="group">
              <div className="glass-card p-6 rounded-3xl border border-white/5 hover:border-primary/30 transition-all duration-300 relative overflow-hidden h-full flex flex-col justify-between">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg group-hover:scale-110 transition duration-500">
                    {artist.user?.name?.charAt(0) || <User size={32} />}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold group-hover:text-primary transition">{artist.user?.name || 'Unknown Creator'}</h2>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">{artist.genre || 'Pacific Creator'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs font-bold text-primary/60 uppercase tracking-tighter">View Store</span>
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition">
                    <ArrowRight size={16} />
                  </div>
                </div>

                {/* Decoration */}
                <Store size={80} className="absolute -bottom-4 -right-4 opacity-5 group-hover:rotate-12 transition-transform duration-700" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center glass rounded-3xl border-dashed border-2 border-white/10">
          <Store size={48} className="mx-auto mb-4 text-muted-foreground opacity-20" />
          <h3 className="text-xl font-bold mb-2">
            {searchQuery ? 'No matching stores found' : 'No active stores yet'}
          </h3>
          <p className="text-muted-foreground">
            {searchQuery ? 'Try adjusting your search terms.' : 'Check back soon for exclusive creator merchandise!'}
          </p>
        </div>
      )}
    </div>
  );
}
