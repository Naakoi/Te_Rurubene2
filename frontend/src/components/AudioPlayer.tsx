'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import api from '@/lib/axios';
import { usePlayerStore } from '@/store/playerStore';
import { useCartStore } from '@/store/cartStore';
import {
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX,
  Maximize2, Minimize2, X, Music2, Film, Loader2, ListMusic, Trash2, PictureInPicture, Zap
} from 'lucide-react';
import type Hls from 'hls.js';
import Link from 'next/link';

export default function UnifiedMediaPlayer() {
  const { currentMedia, isPlaying, setIsPlaying, nextMedia, prevMedia, queue, removeFromQueue, clearQueue, setCurrentMedia } = usePlayerStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const HlsRef = useRef<typeof Hls | null>(null);

  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [isPip, setIsPip] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [isLowBandwidth, setIsLowBandwidth] = useState(false);
  const [showPurchasePrompt, setShowPurchasePrompt] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fmt = (s: number) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        await containerRef.current.requestFullscreen().catch(err => console.error(err));
      } else {
        setIsFullscreen(true); // Fallback to CSS fullscreen
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen().catch(err => console.error(err));
      } else {
        setIsFullscreen(false); // Fallback
      }
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!currentMedia) { setResolvedUrl(null); return; }
    setShowPurchasePrompt(false);
    setIsLoading(true);
    setResolvedUrl(null);

    const url = currentMedia.stream_url;
    if (url.endsWith('.m3u8') || url.includes('.mp3') || url.includes('.mp4')) {
      setResolvedUrl(url);
      setIsLoading(false);
      return;
    }

    fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('auth_token') : ''}`
      }
    })
      .then(r => r.json())
      .then(data => {
        setResolvedUrl(data.stream_url || url);
      })
      .catch(() => setResolvedUrl(url))
      .finally(() => setIsLoading(false));

    // Track history when media starts playing (only for authenticated users)
    if (typeof window !== 'undefined' && localStorage.getItem('auth_token')) {
      api.post('/api/player/history/add', {
        media_type: currentMedia.type,
        media_id: currentMedia.id
      }).catch(err => console.error('Failed to track history', err));
    }
    
  }, [currentMedia]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !resolvedUrl) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const loadHls = async () => {
      const HlsModule = (await import('hls.js')).default;
      HlsRef.current = HlsModule;

      if (resolvedUrl.includes('.m3u8') && HlsModule.isSupported()) {
        const hls = new HlsModule({ startLevel: -1 });
        hls.loadSource(resolvedUrl);
        hls.attachMedia(video);
        hls.on(HlsModule.Events.MANIFEST_PARSED, () => {
          if (isPlaying) video.play().catch(() => {});
        });
        hls.on(HlsModule.Events.ERROR, (_, data) => {
          if (data.fatal) console.error('HLS fatal error:', data);
        });
        hlsRef.current = hls;
      } else {
        // Fallback for native Safari HLS and simple audio files (.mp3, .mp4)
        video.src = resolvedUrl;
        if (isPlaying) video.play().catch(() => {});
      }
    };

    loadHls();
  }, [resolvedUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !resolvedUrl) return;
    if (isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = muted;
    }
  }, [volume, muted]);

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    
    let time = v.currentTime;
    
    // Playback limit logic
    if (
      currentMedia &&
      currentMedia.type === 'audio' &&
      Number(currentMedia.price) > 0 &&
      !currentMedia.is_purchased
    ) {
      if (time >= 15) {
        time = 15;
        v.currentTime = 15;
        v.pause();
        setIsPlaying(false);
        setShowPurchasePrompt(true);
      }
    }
    
    setCurrentTime(time);
    setDuration(v.duration || 0);
    setProgress(v.duration ? (time / v.duration) * 100 : 0);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    let targetTime = pct * duration;
    
    if (
      currentMedia &&
      currentMedia.type === 'audio' &&
      Number(currentMedia.price) > 0 &&
      !currentMedia.is_purchased
    ) {
      if (targetTime >= 15) {
        targetTime = 15;
        setShowPurchasePrompt(true);
      }
    }
    
    v.currentTime = targetTime;
  };

  const handleSeekBarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pct = parseFloat(e.target.value) / 100;
    if (!videoRef.current || !duration) return;
    
    let targetTime = pct * duration;
    
    if (
      currentMedia &&
      currentMedia.type === 'audio' &&
      Number(currentMedia.price) > 0 &&
      !currentMedia.is_purchased
    ) {
      if (targetTime >= 15) {
        targetTime = 15;
        setShowPurchasePrompt(true);
      }
    }
    
    videoRef.current.currentTime = targetTime;
  };

  const handleDirectPurchase = async () => {
    if (!currentMedia) return;
    setIsPurchasing(true);
    try {
      const price = Number(currentMedia.price) > 0 ? Number(currentMedia.price) : 0.99;
      await api.post('/api/checkout', {
        items: [{
          id: currentMedia.id,
          type: 'track',
          price: price
        }],
        total: price
      });
      alert('Track purchased successfully! Enjoy the full song.');
      
      // Update local currentMedia state
      currentMedia.is_purchased = true;
      setShowPurchasePrompt(false);
      
      // Resume playback
      setIsPlaying(true);
      if (videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || 'Purchase failed. Please check your wallet balance.';
      alert(msg);
    } finally {
      setIsPurchasing(false);
    }
  };

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  }, [isPlaying]);

  if (!currentMedia) {
    return null; // Hide the player completely when empty for a clean top-level layout
  }

  const isVideo = currentMedia.type === 'video';

  return (
    <div ref={containerRef} className="w-full shrink-0 flex flex-col bg-gradient-to-r from-[#070a10] via-[#0a1122] to-[#0a0d14] z-50 shadow-[0_10px_40px_rgba(0,0,0,0.6),0_2px_20px_rgba(0,180,216,0.1)] border-b border-[#00e5ff]/20 relative">
        {/* Fullscreen Large Centered Play/Pause (Only show when interacting in fullscreen) */}
        {isVideo && isFullscreen && showControls && (
          <div className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-none">
             <button 
               onClick={() => setIsPlaying(!isPlaying)}
               className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center text-white backdrop-blur-sm hover:scale-110 transition group pointer-events-auto"
             >
               {isPlaying 
                 ? <Pause size={48} fill="currentColor" className="group-hover:scale-95 transition" /> 
                 : <Play size={48} fill="currentColor" className="ml-2 group-hover:scale-95 transition" />}
             </button>
             <button 
                onClick={() => setIsFullscreen(false)}
                className="absolute top-8 right-8 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition backdrop-blur-md pointer-events-auto"
              >
                <Minimize2 size={24} />
              </button>
          </div>
        )}

        {/* Floating Metadata for PiP / Mini-player (Bottom Right) */}
        {isVideo && isPip && !isFullscreen && (
          <div className="fixed bottom-[110px] right-8 z-[91] pointer-events-none max-w-[200px] md:max-w-[250px]">
             <div className="bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center space-x-3">
                   <div className="w-10 h-10 rounded-md overflow-hidden shrink-0 shadow-lg">
                      {currentMedia.cover_url ? (
                        <img src={currentMedia.cover_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-primary flex items-center justify-center"><Music2 size={16} className="text-white" /></div>
                      )}
                   </div>
                   <div className="min-w-0">
                      <p className="text-white text-sm font-bold truncate leading-tight">{currentMedia.title}</p>
                      <Link 
                        href={`/marketplace/stores/artist/${currentMedia.artist?.id}`}
                        className="text-white/70 text-xs truncate mt-0.5 hover:text-primary transition"
                      >
                          {currentMedia.artist?.name || currentMedia.artist?.user?.name}
                      </Link>
                      {currentMedia.studio && (
                        <p className="text-primary text-[10px] font-bold truncate uppercase tracking-wider mt-1">{currentMedia.studio.name}</p>
                      )}
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* ── Single Video Element for Both Inline and Fullscreen ── */}
      <video
        ref={videoRef}
        className={
          isLowBandwidth 
            ? "w-0 h-0 absolute opacity-0 pointer-events-none"
            : isVideo && isFullscreen
            ? "fixed inset-0 w-screen h-screen object-contain bg-black z-[100]"
            : isVideo && isPip
            ? "fixed bottom-24 right-6 w-72 md:w-80 aspect-video bg-black rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[90] object-cover cursor-pointer hover:scale-[1.02] transition duration-300 overflow-hidden border border-white/10"
            : isVideo
            ? "w-full aspect-video max-h-[25vh] lg:max-h-[35vh] object-contain bg-black cursor-pointer hover:bg-black/90 transition"
            : "w-0 h-0 absolute opacity-0 pointer-events-none"
        }
        onClick={() => { if (isVideo && !isFullscreen) setIsPlaying(!isPlaying); }}
        onDoubleClick={() => { if (isVideo && !isFullscreen) toggleFullscreen(); }}
        onTimeUpdate={handleTimeUpdate}
        onEnded={nextMedia}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        playsInline
      />

      {/* Inline Loader (for Video) */}
      {isVideo && !isFullscreen && !isPip && isLoading && (
        <div className="absolute top-0 left-0 right-0 aspect-video max-h-[25vh] lg:max-h-[35vh] flex items-center justify-center pointer-events-none z-10">
           <Loader2 size={48} className="text-white animate-spin opacity-70" />
        </div>
      )}

      {/* PIP Close/Expand Buttons (Only shown when PIP is active) */}
      {isVideo && isPip && !isFullscreen && (
          <div className="fixed bottom-[116px] right-8 z-[91] pointer-events-none flex justify-end space-x-2">
             <button 
                className="pointer-events-auto bg-black/60 hover:bg-black p-2 rounded-full text-white backdrop-blur-md transition shadow-lg"
                onClick={() => setIsPip(false)}
                title="Restore to Top"
             >
                 <Maximize2 size={16} />
             </button>
          </div>
      )}

      {/* ── Fullscreen Video Controls Modal ── */}
      {isVideo && isFullscreen && (
        <div
          className="fixed inset-0 z-[101] flex flex-col"
          onMouseMove={resetControlsTimer}
          onClick={resetControlsTimer}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Loader2 size={48} className="text-white animate-spin opacity-70" />
            </div>
          )}

          <div
            className={`absolute inset-0 flex flex-col justify-between p-8 transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 30%, rgba(0,0,0,0.5) 100%)' }}
          >
            <div className="flex justify-between items-start pointer-events-auto">
              <div className="max-w-2xl">
                <p className="text-white font-bold text-2xl tracking-tight mb-1 drop-shadow-md">{currentMedia.title}</p>
                <Link 
                  href={`/marketplace/stores/artist/${currentMedia.artist?.id}`}
                  className="text-white/70 text-base font-medium drop-shadow-md hover:text-primary transition"
                >
                    {currentMedia.artist?.name || currentMedia.artist?.user?.name}
                </Link>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-lg flex items-center justify-center hover:bg-white/20 hover:scale-105 transition cursor-pointer border border-white/5 shadow-xl"
              >
                <X size={24} className="text-white" />
              </button>
            </div>

            <div className="space-y-6 pointer-events-auto max-w-4xl mx-auto w-full mb-4">
              <div className="flex items-center justify-between space-x-4">
                 <span className="text-sm font-medium text-white/70 min-w-[45px] tabular-nums">{fmt(currentTime)}</span>
                 <div className="relative w-full h-6 flex items-center group cursor-pointer">
                    <input
                        type="range" min="0" max="100" step="0.1" value={progress}
                        onChange={handleSeekBarChange}
                        className="w-full absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full h-1.5 bg-white/20 rounded-full pointer-events-none overflow-hidden">
                        <div className="h-full bg-white group-hover:bg-primary transition-colors rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                    <div
                        className="absolute w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none -ml-2"
                        style={{ left: `${progress}%` }}
                    />
                 </div>
                 <span className="text-sm font-medium text-white/70 min-w-[45px] text-right tabular-nums">{fmt(duration)}</span>
              </div>

              <div className="flex items-center justify-center space-x-8">
                  <button onClick={(e) => { e.stopPropagation(); prevMedia(); }} className="text-white/60 hover:text-white hover:scale-110 transition">
                    <SkipBack size={32} fill="currentColor" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }}
                    className="w-20 h-20 rounded-full bg-white flex items-center justify-center hover:scale-105 transition shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                  >
                    {isPlaying
                      ? <Pause size={36} fill="black" className="text-black" />
                      : <Play size={36} fill="black" className="text-black ml-1.5" />}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); nextMedia(); }} className="text-white/60 hover:text-white hover:scale-110 transition">
                    <SkipForward size={32} fill="currentColor" />
                  </button>
              </div>
              
              <div className="absolute bottom-12 right-12 flex items-center space-x-6">
                  <div className="flex items-center space-x-3 group">
                      <button onClick={(e) => { e.stopPropagation(); setMuted(!muted); }} className="text-white/60 hover:text-white transition">
                        {muted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                      </button>
                      <div className="w-28 flex items-center h-6 relative opacity-0 group-hover:opacity-100 transition-opacity">
                          <input
                              type="range" min="0" max="1" step="0.01" value={muted ? 0 : volume}
                              onClick={(e) => e.stopPropagation()}
                              onChange={e => { setVolume(parseFloat(e.target.value)); setMuted(false); }}
                              className="w-full absolute opacity-0 cursor-pointer z-10 h-full"
                          />
                          <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                              <div className="h-full bg-white hover:bg-primary transition-colors" style={{ width: `${(muted ? 0 : volume) * 100}%` }} />
                          </div>
                      </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setIsFullscreen(false); }} className="text-white/60 hover:text-white hover:scale-110 transition">
                    <Minimize2 size={28} />
                  </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Global Player Bar (Professional Layout) ── */}
      <div className={`h-24 px-4 md:px-8 select-none flex items-center justify-between ${isFullscreen ? 'hidden' : ''}`}>
        
        {/* Left: Media info */}
        <div className="flex items-center space-x-4 min-w-0 flex-1 md:w-1/3 justify-start">
          <button 
             onClick={() => { setCurrentMedia(null); setIsPlaying(false); setIsPip(false); }} 
             className="w-8 h-8 rounded-full hover:bg-white/10 items-center justify-center text-muted-foreground hover:text-white transition shrink-0"
             title="Close Player"
          >
             <X size={20} />
          </button>
          {/* Always show thumbnail for reference in the bar */}
          <div className="relative w-14 h-14 rounded-md overflow-hidden bg-secondary shrink-0 shadow-md">
            {currentMedia.cover_url ? (
              <img src={currentMedia.cover_url} alt={currentMedia.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                <Music2 size={20} className="text-white" />
              </div>
            )}
            {isLoading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 backdrop-blur-[2px]">
                <Loader2 size={18} className="text-white animate-spin" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex flex-col justify-center">
            <p className="font-bold text-[15px] truncate hover:text-primary cursor-pointer tracking-tight leading-tight">{currentMedia.title}</p>
            <div className="flex items-center space-x-1.5 mt-0.5 overflow-hidden">
               <Link 
                 href={`/marketplace/stores/artist/${currentMedia.artist?.id}`}
                 className="text-[13px] text-muted-foreground truncate hover:text-primary hover:underline transition"
               >
                   {currentMedia.artist?.name || currentMedia.artist?.user?.name}
               </Link>
               {currentMedia.studio && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
                    <p className="text-[12px] text-primary/80 truncate font-medium">{currentMedia.studio.name} Studio</p>
                  </>
               )}
            </div>
          </div>
        </div>

        {/* Center: Controls & Progress */}
        <div className="flex flex-col items-center justify-center flex-1 max-w-[722px] px-4 md:w-1/3">
          <div className="flex items-center space-x-6 mb-2">
            <button onClick={prevMedia} className="text-muted-foreground hover:text-white transition active:scale-90 hover:scale-105">
              <SkipBack size={20} fill="currentColor" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-110 transition hover:shadow-[0_0_20px_rgba(var(--primary),0.4)] shadow-lg"
            >
              {isPlaying
                ? <Pause size={20} fill="currentColor" />
                : <Play size={20} fill="currentColor" className="ml-0.5" />}
            </button>
            <button onClick={nextMedia} className="text-muted-foreground hover:text-white transition active:scale-90 hover:scale-105">
              <SkipForward size={20} fill="currentColor" />
            </button>
          </div>

          <div className="flex items-center w-full space-x-3">
            <span className="text-[12px] font-medium text-muted-foreground min-w-[35px] text-right tabular-nums">{fmt(currentTime)}</span>
            <div className="relative w-full h-4 flex items-center group cursor-pointer">
              <input
                type="range" min="0" max="100" step="0.1" value={progress}
                onChange={handleSeekBarChange}
                className="w-full absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              <div className="w-full h-1 bg-white/20 rounded-full pointer-events-none overflow-hidden">
                 <div className="h-full bg-white group-hover:bg-primary transition-colors rounded-full" style={{ width: `${progress}%` }} />
              </div>
              <div
                className="absolute w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none -ml-1.5"
                style={{ left: `${progress}%` }}
              />
            </div>
            <span className="text-[12px] font-medium text-muted-foreground min-w-[35px] tabular-nums">{fmt(duration)}</span>
          </div>
        </div>

        {/* Right: Extra Controls */}
        <div className="flex items-center space-x-5 min-w-0 flex-1 md:w-1/3 justify-end text-muted-foreground relative">
          <button 
             onClick={() => setShowPlaylist(!showPlaylist)} 
             className={`hover:text-white transition hover:scale-110 ${showPlaylist ? 'text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]' : ''}`} 
             title="Queue"
          >
             <ListMusic size={18} />
          </button>
          
          {isVideo && (
            <button 
              onClick={() => setIsLowBandwidth(!isLowBandwidth)} 
              className={`hover:text-white transition hover:scale-110 ${isLowBandwidth ? 'text-primary' : ''}`} 
              title="Low Bandwidth (Audio Only)"
            >
               <Zap size={18} />
            </button>
          )}

          {isVideo && (
            <button onClick={() => setIsPip(!isPip)} className={`hover:text-white transition hidden md:block hover:scale-110 ${isPip ? 'text-primary' : ''}`} title="Miniplayer">
               <PictureInPicture size={18} />
            </button>
          )}

          {isVideo && (
            <button onClick={toggleFullscreen} className="hover:text-white transition hidden md:block hover:scale-110 bg-white/5 p-2 rounded-full border border-white/10 hover:bg-white/10" title="Fullscreen">
               <Maximize2 size={16} />
            </button>
          )}
          <div className="flex items-center space-x-2 group">
            <button onClick={() => setMuted(!muted)} className="hover:text-white transition hover:scale-110">
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <div className="w-24 flex items-center h-4 relative">
                <input
                    type="range" min="0" max="1" step="0.01" value={muted ? 0 : volume}
                    onChange={e => { setVolume(parseFloat(e.target.value)); setMuted(false); }}
                    className="w-full absolute opacity-0 cursor-pointer z-10 h-full"
                />
                <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white group-hover:bg-primary transition-colors" style={{ width: `${(muted ? 0 : volume) * 100}%` }} />
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Playlist/Queue Dropdown (Overlay) ── */}
      {showPlaylist && !isFullscreen && (
         <div className="absolute top-[100%] right-4 md:right-8 w-[calc(100%-2rem)] md:w-96 max-h-[60vh] bg-background/95 backdrop-blur-3xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] z-[60] flex flex-col overflow-hidden rounded-b-2xl rounded-tl-2xl mt-2 animate-in slide-in-from-top-4 fade-in duration-200">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5 shrink-0">
               <h3 className="font-bold text-sm tracking-tight flex items-center space-x-2">
                  <ListMusic size={16} className="text-primary" />
                  <span>Up Next</span>
               </h3>
               {queue.length > 0 && (
                  <button onClick={clearQueue} className="text-xs text-red-400 hover:text-red-300 transition flex items-center space-x-1 px-2 py-1 bg-red-400/10 rounded-md">
                     <Trash2 size={12} />
                     <span>Clear</span>
                  </button>
               )}
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
               {queue.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center">
                     <Music2 size={32} className="opacity-20 mb-3" />
                     <p>Your queue is empty</p>
                     <p className="text-xs opacity-60 mt-1">Add tracks from Discover or Library</p>
                  </div>
               ) : (
                  queue.map((item, index) => {
                     const isPlayingThis = currentMedia?.id === item.id && currentMedia?.type === item.type;
                     return (
                        <div 
                           key={`${item.type}-${item.id}-${index}`}
                           onClick={() => setCurrentMedia(item)}
                           className={`flex items-center space-x-3 p-2 rounded-xl cursor-pointer transition group ${isPlayingThis ? 'bg-primary/20 border border-primary/30' : 'hover:bg-white/5 border border-transparent'}`}
                        >
                           <div className="w-10 h-10 bg-secondary rounded-md overflow-hidden relative shrink-0 shadow-sm border border-white/5">
                              {item.cover_url ? (
                                 <img src={item.cover_url} className="w-full h-full object-cover" />
                              ) : (
                                 <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/50 to-blue-600/50">
                                    <Music2 size={14} className="text-white" />
                                 </div>
                              )}
                              {isPlayingThis && (
                                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <Play size={16} className="text-primary animate-pulse" fill="currentColor" />
                                 </div>
                              )}
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold truncate tracking-tight ${isPlayingThis ? 'text-primary' : 'group-hover:text-white'}`}>{item.title}</p>
                              <Link 
                                 href={`/marketplace/stores/artist/${item.artist?.id}`}
                                 onClick={(e) => e.stopPropagation()}
                                 className="text-xs text-muted-foreground truncate hover:text-primary transition block"
                              >
                                  {item.artist?.name || item.artist?.user?.name}
                              </Link>
                           </div>
                           <button 
                              onClick={(e) => { e.stopPropagation(); removeFromQueue(item.id); }}
                              className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition shrink-0"
                              title="Remove from queue"
                           >
                              <X size={16} />
                           </button>
                        </div>
                     );
                  })
               )}
            </div>
         </div>
      )}

      {/* ── Premium Track Purchase Prompt (Overlay) ── */}
      {showPurchasePrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-md bg-gradient-to-b from-[#0a122c] to-[#050716] p-8 rounded-[2.5rem] border border-[#00e5ff]/20 shadow-2xl shadow-[#00e5ff]/10 text-center animate-in zoom-in-95 duration-300">
            {/* Close Button */}
            <button 
              onClick={() => setShowPurchasePrompt(false)} 
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-muted-foreground hover:text-white transition"
            >
              <X size={20} />
            </button>

            {/* Glowing Icon Container */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-[#00b4d8] p-0.5 shadow-lg shadow-primary/30 flex items-center justify-center">
              <div className="w-18 h-18 bg-[#050716] rounded-full flex items-center justify-center">
                <Music2 size={36} className="text-primary animate-pulse" />
              </div>
            </div>

            <h3 className="text-2xl font-black italic tracking-tighter text-white mb-2">UNLOCK FULL SONG</h3>
            <p className="text-muted-foreground text-sm px-4 mb-6 leading-relaxed">
              You are listening to a 15-second preview of <span className="text-white font-bold">{currentMedia?.title}</span>. Purchase this track to enjoy the full premium sound.
            </p>

            {/* Track Info Box */}
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 mb-8 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-secondary overflow-hidden shrink-0 border border-white/10 shadow-md">
                {currentMedia?.cover_url ? (
                  <img src={currentMedia.cover_url} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold"><Music2 size={16} /></div>
                )}
              </div>
              <div className="text-left min-w-0 flex-1">
                <p className="text-white font-bold truncate text-sm leading-tight">{currentMedia?.title}</p>
                <p className="text-muted-foreground text-xs truncate mt-0.5">{currentMedia?.artist?.name}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-primary font-black text-lg">${Number(currentMedia?.price || 0.99).toFixed(2)}</span>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">AUD</p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <button 
                onClick={handleDirectPurchase}
                disabled={isPurchasing}
                className="w-full py-4 bg-primary text-primary-foreground font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition disabled:opacity-50 flex items-center justify-center space-x-3"
              >
                {isPurchasing ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>PROCESSING...</span>
                  </>
                ) : (
                  <>
                    <Zap size={18} fill="currentColor" />
                    <span>BUY NOW WITH WALLET</span>
                  </>
                )}
              </button>
              
              <button 
                onClick={() => {
                  if (currentMedia) {
                    useCartStore.getState().addItem({
                      id: currentMedia.id,
                      type: 'track',
                      name: currentMedia.title,
                      price: Number(currentMedia.price) > 0 ? Number(currentMedia.price) : 0.99,
                      image_url: currentMedia.cover_url,
                      quantity: 1,
                      creator_name: currentMedia.artist?.name
                    });
                    setShowPurchasePrompt(false);
                  }
                }}
                className="w-full py-4 glass text-white font-bold rounded-2xl hover:bg-white/10 transition active:scale-95"
              >
                ADD TO CART
              </button>
            </div>
            
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-6">
              SECURE DEBIT VIA TE RURUBENE PREPAID WALLET
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
