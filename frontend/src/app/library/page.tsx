'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import Link from 'next/link';
import { Play, Music, ListPlus, Zap, LayoutGrid, List, Clock, DownloadCloud, CheckCircle2, Loader2, CloudOff } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function LibraryPage() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('list');
  const [toast, setToast] = useState<string | null>(null);
  const [offlineTracks, setOfflineTracks] = useState<Record<number, boolean>>({});
  const [downloading, setDownloading] = useState<Record<number, boolean>>({});
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const { setCurrentMedia, addToQueue, playNext, currentMedia } = usePlayerStore();

  const checkOfflineStatuses = async (trackList: any[]) => {
    if (typeof window === 'undefined' || !Array.isArray(trackList)) return;
    const { isTrackOffline } = await import('@/lib/offlineStorage');
    const statuses: Record<number, boolean> = {};
    for (const t of trackList) {
      if (t && t.id) {
        statuses[t.id] = await isTrackOffline(t.id);
      }
    }
    setOfflineTracks(statuses);
  };

  useEffect(() => {
    // Connection listener
    const handleOffline = () => setIsOfflineMode(!navigator.onLine);
    window.addEventListener('online', handleOffline);
    window.addEventListener('offline', handleOffline);
    handleOffline();

    // Try cached
    const cached = localStorage.getItem('rurubene_library_cache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setTracks(parsed);
        checkOfflineStatuses(parsed);
        setLoading(false);
      } catch(e) {}
    }

    api.get('/api/my-tracks')
      .then(res => {
        setTracks(res.data);
        localStorage.setItem('rurubene_library_cache', JSON.stringify(res.data));
        checkOfflineStatuses(res.data);
      })
      .catch(() => {
        if (!navigator.onLine) showToast('You are offline. Showing cached library.');
      })
      .finally(() => setLoading(false));

    return () => {
      window.removeEventListener('online', handleOffline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const buildMedia = (track: any) => ({
    id: track.id,
    title: track.title,
    artist: track.artist,
    type: 'audio' as const,
    stream_url: track.file_url || track.audio_file_path,
    cover_url: track.cover_url,
    is_purchased: true,
    price: track.price,
  });

  const handlePlay = (track: any) => setCurrentMedia(buildMedia(track));
  const handleAddToQueue = (track: any) => { addToQueue(buildMedia(track)); showToast(`"${track.title}" added to queue`); };
  const handlePlayNext = (track: any) => { playNext(buildMedia(track)); showToast(`"${track.title}" will play next`); };

  const handleToggleOffline = async (e: React.MouseEvent, track: any) => {
    e.stopPropagation();
    if (typeof window === 'undefined') return;
    const { isTrackOffline, downloadTrackOffline, removeTrackOffline } = await import('@/lib/offlineStorage');
    const trackId = track.id;
    
    if (offlineTracks[trackId]) {
      // Remove
      await removeTrackOffline(trackId);
      setOfflineTracks(prev => ({ ...prev, [trackId]: false }));
      showToast(`Removed from offline storage`);
    } else {
      // Download
      if (downloading[trackId]) return;
      setDownloading(prev => ({ ...prev, [trackId]: true }));
      try {
        const streamUrl = track.file_url || track.audio_file_path;
        await downloadTrackOffline(trackId, streamUrl);
        setOfflineTracks(prev => ({ ...prev, [trackId]: true }));
        showToast(`Saved for offline listening`);
      } catch (err: any) {
        showToast(`Failed to download: ${err.message || 'Network error'}`);
        console.error('Download error details:', err);
      } finally {
        setDownloading(prev => ({ ...prev, [trackId]: false }));
      }
    }
  };

  return (
    <div className="p-6 md:p-8 relative">

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 bg-primary text-primary-foreground rounded-full font-semibold text-sm shadow-xl shadow-primary/30 animate-in fade-in slide-in-from-top-2 duration-200">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-primary/20 text-primary rounded-2xl relative">
            <Music size={24} />
            {isOfflineMode && <CloudOff size={12} className="absolute -bottom-1 -right-1 text-red-400" />}
          </div>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              My Library 
              {isOfflineMode && <span className="text-[10px] uppercase tracking-widest bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30">Offline</span>}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">{tracks.length} track{tracks.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        {/* View Toggle */}
        <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/10">
          <button
            onClick={() => setView('list')}
            className={`p-2 rounded-lg transition ${view === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-white'}`}
            title="List View"
          >
            <List size={16} />
          </button>
          <button
            onClick={() => setView('grid')}
            className={`p-2 rounded-lg transition ${view === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-white'}`}
            title="Grid View"
          >
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className={view === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4' : 'space-y-2'}>
          {[...Array(8)].map((_, i) => (
            <div key={i} className={`animate-pulse glass-card rounded-2xl ${view === 'grid' ? 'p-3' : 'p-4 flex space-x-4'}`}>
              <div className={`bg-white/5 rounded-xl ${view === 'grid' ? 'aspect-square mb-3' : 'w-12 h-12 shrink-0'}`} />
              {view === 'list' && (
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-white/5 rounded w-2/3" />
                  <div className="h-3 bg-white/5 rounded w-1/3" />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : tracks.length === 0 ? (
        <div className="py-20 text-center glass-card rounded-3xl border-dashed">
          <Music size={48} className="mx-auto text-muted-foreground/20 mb-4" />
          <p className="text-muted-foreground mb-6">Your library is empty. Start collecting the best island sounds!</p>
          <Link href="/discover" className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-bold hover:scale-105 transition inline-block">
            Browse Music
          </Link>
        </div>
      ) : view === 'grid' ? (
        /* ── GRID VIEW ── */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {tracks.map(track => {
            const isActive = currentMedia?.id === track.id && currentMedia?.type === 'audio';
            return (
              <div key={track.id} className={`group relative glass-card rounded-2xl p-3 hover:border-primary/40 transition-all duration-300 flex flex-col ${isActive ? 'border-primary/50 bg-primary/5' : ''}`}>
                {/* Cover */}
                <div className="relative aspect-square rounded-xl overflow-hidden mb-3 shadow-lg cursor-pointer" onClick={() => handlePlay(track)}>
                  {track.cover_url ? (
                    <img src={track.cover_url} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/40 to-blue-900/40 flex items-center justify-center">
                      <Music size={32} className="text-white/40" />
                    </div>
                  )}
                  {/* Play Overlay */}
                  <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition duration-300 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/40 hover:scale-110 transition">
                      <Play size={20} fill="currentColor" className="text-white ml-0.5" />
                    </div>
                  </div>
                  {isActive && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-[9px] font-black tracking-widest px-2 py-0.5 rounded-full uppercase">
                      Playing
                    </div>
                  )}
                  {offlineTracks[track.id] && !isActive && (
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md rounded-full p-1" title="Available Offline">
                      <CheckCircle2 size={12} className="text-primary" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 mb-3">
                  <p className={`font-bold text-sm truncate leading-snug ${isActive ? 'text-primary' : ''}`}>{track.title}</p>
                  <Link href={`/marketplace/stores/artist/${track.artist?.id}`} className="text-xs text-muted-foreground hover:text-primary transition truncate block mt-0.5">
                    {track.artist?.name || 'Unknown Artist'}
                  </Link>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => handlePlayNext(track)}
                    title="Play Next"
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white/5 hover:bg-primary/20 hover:text-primary text-muted-foreground border border-white/10 hover:border-primary/30 transition text-[10px] font-bold uppercase tracking-wide"
                  >
                    <Zap size={11} />
                    <span>Next</span>
                  </button>
                  <button
                    onClick={() => handleAddToQueue(track)}
                    title="Add to Queue"
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white/5 hover:bg-blue-500/20 hover:text-blue-400 text-muted-foreground border border-white/10 hover:border-blue-500/30 transition text-[10px] font-bold uppercase tracking-wide"
                  >
                    <ListPlus size={11} />
                    <span>Queue</span>
                  </button>
                </div>
                {/* Offline Download Button */}
                <button
                    onClick={(e) => handleToggleOffline(e, track)}
                    className={`w-full flex items-center justify-center gap-1 py-1.5 rounded-lg border transition text-[10px] font-bold uppercase tracking-wide ${offlineTracks[track.id] ? 'bg-primary/10 border-primary/30 text-primary hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400' : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-white'}`}
                >
                    {downloading[track.id] ? (
                        <Loader2 size={12} className="animate-spin" />
                    ) : offlineTracks[track.id] ? (
                        <>
                          <CheckCircle2 size={12} className="group-hover:hidden" />
                          <CloudOff size={12} className="hidden group-hover:block" />
                          <span className="group-hover:hidden">Downloaded</span>
                          <span className="hidden group-hover:block">Remove Offline</span>
                        </>
                    ) : (
                        <>
                          <DownloadCloud size={12} />
                          <span>Save Offline</span>
                        </>
                    )}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── LIST VIEW ── */
        <div className="glass-card rounded-3xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[auto_1fr_1fr_auto] gap-4 px-6 py-3 bg-white/5 border-b border-white/10 text-xs font-black uppercase tracking-widest text-muted-foreground/60">
            <span className="w-8 text-center">#</span>
            <span>Title</span>
            <span>Artist</span>
            <span className="text-right flex items-center justify-end gap-1"><Clock size={11} /> Actions</span>
          </div>

          <div className="divide-y divide-white/5">
            {tracks.map((track, index) => {
              const isActive = currentMedia?.id === track.id && currentMedia?.type === 'audio';
              return (
                <div
                  key={track.id}
                  className={`group flex items-center gap-4 px-4 md:px-6 py-3 hover:bg-white/5 transition cursor-pointer ${isActive ? 'bg-primary/10 border-l-2 border-primary' : ''}`}
                >
                  {/* Index / Play Icon */}
                  <div className="w-8 text-center shrink-0">
                    <span className={`text-sm font-mono group-hover:hidden ${isActive ? 'text-primary font-bold hidden' : 'text-muted-foreground'}`}>{index + 1}</span>
                    <button
                      onClick={() => handlePlay(track)}
                      className={`w-full flex items-center justify-center group-hover:flex ${isActive ? 'flex text-primary' : 'hidden text-white'} hover:scale-110 transition`}
                    >
                      <Play size={16} fill="currentColor" />
                    </button>
                  </div>

                  {/* Cover + Title */}
                  <div className="flex items-center gap-3 flex-1 min-w-0" onClick={() => handlePlay(track)}>
                    <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 shadow-md">
                      {track.cover_url ? (
                        <img src={track.cover_url} alt={track.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/40 to-blue-900/40 flex items-center justify-center">
                          <Music size={16} className="text-white/40" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className={`font-bold text-sm truncate leading-tight ${isActive ? 'text-primary' : 'group-hover:text-white'}`}>{track.title}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5 md:hidden">
                        {track.artist?.name}
                      </p>
                    </div>
                  </div>

                  {/* Artist — hidden on mobile */}
                  <div className="hidden md:block flex-1 min-w-0">
                    <Link
                      href={`/marketplace/stores/artist/${track.artist?.id}`}
                      onClick={e => e.stopPropagation()}
                      className="text-sm text-muted-foreground hover:text-primary transition truncate block"
                    >
                      {track.artist?.name || 'Unknown Artist'}
                    </Link>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => handleToggleOffline(e, track)}
                      title={offlineTracks[track.id] ? "Remove Offline" : "Save Offline"}
                      className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border transition text-[10px] font-bold uppercase tracking-wide ${offlineTracks[track.id] ? 'bg-primary/10 border-primary/30 text-primary hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400' : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-white opacity-0 group-hover:opacity-100'}`}
                    >
                      {downloading[track.id] ? (
                          <Loader2 size={11} className="animate-spin" />
                      ) : offlineTracks[track.id] ? (
                          <CheckCircle2 size={11} />
                      ) : (
                          <DownloadCloud size={11} />
                      )}
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handlePlayNext(track); }}
                      title="Play Next"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-primary/20 hover:text-primary text-muted-foreground border border-white/10 hover:border-primary/30 transition text-[10px] font-bold uppercase tracking-wide opacity-0 group-hover:opacity-100"
                    >
                      <Zap size={11} />
                      <span className="hidden sm:inline">Next</span>
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleAddToQueue(track); }}
                      title="Add to Queue"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-blue-500/20 hover:text-blue-400 text-muted-foreground border border-white/10 hover:border-blue-500/30 transition text-[10px] font-bold uppercase tracking-wide opacity-0 group-hover:opacity-100"
                    >
                      <ListPlus size={11} />
                      <span className="hidden sm:inline">Queue</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
