'use client';

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Settings, Volume2, VolumeX, Maximize, Play, Pause, Activity } from 'lucide-react';
import api from '@/lib/axios';

interface Props {
    src: string;
    poster?: string;
    title?: string;
    artist?: string;
}

export default function AdaptiveVideoPlayer({ src, poster, title, artist }: Props) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [hls, setHls] = useState<Hls | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(1);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [qualities, setQualities] = useState<any[]>([]);
    const [currentQuality, setCurrentQuality] = useState(-1);
    const [showSettings, setShowSettings] = useState(false);
    const [isLowDataMode, setIsLowDataMode] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const initPlayer = async () => {
            let streamUrl = src;
            if (src.includes('/api/videos/stream/')) {
                try {
                    const response = await api.get(src);
                    streamUrl = response.data.stream_url;
                } catch (err) {
                    return;
                }
            }

            if (Hls.isSupported()) {
                const hlsInstance = new Hls({
                    capLevelToPlayerSize: true,
                    startLevel: isLowDataMode ? 0 : -1,
                });
                hlsInstance.loadSource(streamUrl);
                hlsInstance.attachMedia(video);
                hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
                    setQualities(hlsInstance.levels);
                    setHls(hlsInstance);
                });
                return () => hlsInstance.destroy();
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = streamUrl;
            }
        };

        initPlayer();
    }, [src, isLowDataMode]);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) videoRef.current.pause();
            else videoRef.current.play();
            setIsPlaying(!isPlaying);
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        if (videoRef.current) {
            videoRef.current.volume = val;
            setIsMuted(val === 0);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.currentTime = (val / 100) * videoRef.current.duration;
            setProgress(val);
        }
    };

    const toggleFullscreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    const updateProgress = () => {
        if (videoRef.current) {
            const current = videoRef.current.currentTime;
            const total = videoRef.current.duration;
            setProgress((current / total) * 100);
            setDuration(total);
        }
    };

    return (
        <div ref={containerRef} className="relative group rounded-3xl overflow-hidden bg-black aspect-video glass-card border-white/10 shadow-2xl flex flex-col">
            <video 
                ref={videoRef}
                poster={poster}
                className="w-full h-full object-contain cursor-pointer"
                onClick={togglePlay}
                onTimeUpdate={updateProgress}
                playsInline
            />

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

            {/* Center Play/Pause Indicator (Large) */}
            {!isPlaying && (
                <button onClick={togglePlay} className="absolute inset-0 flex items-center justify-center text-white/80 hover:text-primary transition-all scale-100 active:scale-90">
                    <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                        <Play size={32} fill="currentColor" className="ml-1.5" />
                    </div>
                </button>
            )}

            {/* Controls Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                {/* Timeline Seek Bar */}
                <div className="mb-4 flex items-center space-x-3">
                    <input 
                        type="range" min="0" max="100" step="0.1" value={progress}
                        onChange={handleSeek}
                        className="flex-1 accent-primary h-1.5 rounded-full cursor-pointer bg-white/20 appearance-none"
                    />
                    <span className="text-[10px] font-mono text-white/60">
                        {Math.floor((videoRef.current?.currentTime || 0) / 60)}:{Math.floor((videoRef.current?.currentTime || 0) % 60).toString().padStart(2, '0')}
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button onClick={togglePlay} className="text-white hover:text-primary transition active:scale-90">
                            {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
                        </button>
                        
                        <div className="flex items-center group/volume space-x-2">
                            <button onClick={() => setIsMuted(!isMuted)} className="text-white hover:text-primary transition">
                                {isMuted || volume === 0 ? <VolumeX size={22} /> : <Volume2 size={22} />}
                            </button>
                            <input 
                                type="range" min="0" max="1" step="0.01" value={volume}
                                onChange={handleVolumeChange}
                                className="w-0 group-hover/volume:w-20 transition-all duration-300 accent-white h-1 rounded-full cursor-pointer bg-white/20 appearance-none overflow-hidden"
                            />
                        </div>

                        {isLowDataMode && (
                            <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-orange-500/20 text-orange-500 rounded-full border border-orange-500/30">
                                <Activity size={10} />
                                <span className="text-[9px] font-bold uppercase tracking-widest">Low Data</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* Playback Rate Selector */}
                        <select 
                            value={playbackRate}
                            onChange={(e) => {
                                const rate = parseFloat(e.target.value);
                                setPlaybackRate(rate);
                                if (videoRef.current) videoRef.current.playbackRate = rate;
                            }}
                            className="bg-transparent text-white text-[10px] font-bold outline-none cursor-pointer border border-white/10 rounded px-2 py-1 hover:bg-white/10"
                        >
                            <option value="0.5" className="bg-black text-white">0.5x</option>
                            <option value="1" className="bg-black text-white">1x</option>
                            <option value="1.5" className="bg-black text-white">1.5x</option>
                            <option value="2" className="bg-black text-white">2x</option>
                        </select>

                        <button onClick={() => setShowSettings(!showSettings)} className={`text-white hover:text-primary transition ${showSettings ? 'text-primary' : ''}`}>
                            <Settings size={22} />
                        </button>
                        <button onClick={toggleFullscreen} className="text-white hover:text-primary transition active:scale-90">
                            <Maximize size={22} />
                        </button>
                    </div>
                </div>

                {/* Quality Selector Popover */}
                {showSettings && (
                    <div className="absolute bottom-20 right-6 w-48 glass rounded-2xl p-2 border border-white/10 shadow-2xl z-50">
                        <div className="p-3 border-b border-white/5 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Quality</span>
                            <button 
                                onClick={() => setIsLowDataMode(!isLowDataMode)}
                                className={`text-[9px] px-2 py-1 rounded-md border transition ${isLowDataMode ? 'bg-primary/20 border-primary text-primary' : 'border-white/10 text-muted-foreground'}`}
                            >
                                Low Data
                            </button>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                            <button onClick={() => { if (hls) hls.currentLevel = -1; setCurrentQuality(-1); setShowSettings(false); }} className={`w-full text-left px-4 py-2 text-xs rounded-xl transition ${currentQuality === -1 ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-white/5'}`}>
                                Auto (Adaptive)
                            </button>
                            {qualities.map((q, i) => (
                                <button key={i} onClick={() => { hls!.currentLevel = i; setCurrentQuality(i); setShowSettings(false); }} className={`w-full text-left px-4 py-2 text-xs rounded-xl transition ${currentQuality === i ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-white/5'}`}>
                                    {q.height}p
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
