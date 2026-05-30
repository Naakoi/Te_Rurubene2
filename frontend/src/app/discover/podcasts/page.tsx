'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import Link from 'next/link';
import { Mic, TrendingUp, Compass } from 'lucide-react';

export default function PodcastDiscovery() {
  const [data, setData] = useState<any>({ categories: [], trending: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/podcasts/discover');
        setData(response.data);
      } catch (err) {
        console.error('Failed to load discovery data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) return <div className="p-12 text-center text-white/50">Discovering podcasts...</div>;

  return (
    <div className="max-w-7xl mx-auto px-8 pb-32">
      <div className="mb-12 pt-8">
        <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Podcasts</h1>
        <p className="text-white/60 text-lg">Deep discussions, island news, and cultural stories.</p>
      </div>

      {/* Trending Section */}
      <section className="mb-16">
        <div className="flex items-center space-x-3 mb-6">
          <TrendingUp className="text-primary" size={24} />
          <h2 className="text-2xl font-bold text-white">Trending in the Pacific</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {data.trending.map((podcast: any) => (
            <Link href={`/podcast/${podcast.id}`} key={podcast.id} className="group cursor-pointer">
              <div className="aspect-square bg-white/5 rounded-2xl overflow-hidden mb-4 shadow-lg border border-white/10 group-hover:border-white/30 transition relative">
                {podcast.cover_image ? (
                  <img src={podcast.cover_image} alt={podcast.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Mic size={48} className="text-white/10" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-black">
                    <Mic size={24} />
                  </div>
                </div>
              </div>
              <h3 className="text-white font-bold truncate group-hover:text-primary transition">{podcast.title}</h3>
              <p className="text-white/50 text-sm truncate">{podcast.studio?.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Categories Section */}
      <section>
        <div className="flex items-center space-x-3 mb-6">
          <Compass className="text-primary" size={24} />
          <h2 className="text-2xl font-bold text-white">Browse by Category</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {data.categories.map((category: any) => (
            <Link 
              href={`/discover/podcasts/category/${category.slug}`} 
              key={category.id}
              className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 hover:border-white/30 rounded-xl p-6 transition group"
            >
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary transition">{category.name}</h3>
              <p className="text-white/50 text-sm font-medium">{category.podcasts_count} Channels</p>
            </Link>
          ))}
          {data.categories.length === 0 && (
            <div className="col-span-full text-white/50 py-4">No categories created yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}
