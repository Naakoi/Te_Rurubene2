'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Radio, Globe, Zap, Play } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';

export default function RadioPage() {
  const [stations, setStations] = useState<any[]>([]);
  const { setCurrentMedia } = usePlayerStore();

  useEffect(() => {
    api.get('/api/radio-stations')
      .then(res => setStations(res.data))
      .catch(err => console.log('Failed to fetch stations'));
  }, []);

  const handlePlay = (station: any) => {
    setCurrentMedia({
        id: station.id,
        title: station.name,
        artist: { name: station.genre || 'Live Radio' },
        type: 'audio',
        stream_url: station.stream_url,
        cover_url: ''
    });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-3xl font-bold">Radio Stations</h1>
        <div className="flex items-center space-x-2 text-red-500 font-bold animate-pulse">
            <Zap size={20} fill="currentColor" />
            <span className="text-sm">LIVE NOW</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {stations.length > 0 ? stations.map(station => (
          <div 
            key={station.id} 
            onClick={() => handlePlay(station)}
            className="glass-card rounded-2xl p-6 hover:border-primary/50 transition cursor-pointer group"
          >
            <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition relative">
                <Radio size={32} />
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition rounded-2xl flex items-center justify-center">
                    <Play size={24} fill="currentColor" />
                </div>
            </div>
            <h3 className="text-xl font-bold mb-1">{station.name}</h3>
            <div className="flex items-center text-xs text-muted-foreground mb-4">
                <Globe size={12} className="mr-1" />
                <span>{station.location || 'Pacific'}</span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{station.frequency || 'Streaming Online'}</p>
          </div>
        )) : (
            <div className="col-span-full py-20 text-center glass-card rounded-3xl border-dashed">
                <p className="text-muted-foreground">Connecting to the islands...</p>
            </div>
        )}
      </div>
    </div>
  );
}
