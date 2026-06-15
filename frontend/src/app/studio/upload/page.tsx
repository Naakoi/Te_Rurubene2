'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Upload, Music, Film, Image as ImageIcon, DollarSign, CheckCircle2, AlertCircle, Loader2, Mic2, Pause, Play, Info, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { useResumableUpload } from '@/hooks/useResumableUpload';

interface AlbumTrackInput {
  id: string;
  title: string;
  file: File | null;
  isPremium: boolean;
  price: string;
}

export default function StudioUpload() {
  const { user } = useAuthStore();
  const router = useRouter();
  
  // Upload Type / Mode
  const [uploadMode, setUploadMode] = useState<'single' | 'album'>('single');
  
  const [title, setTitle] = useState('');
  const [mediaType, setMediaType] = useState<'audio' | 'video'>('audio');
  const [isPremium, setIsPremium] = useState(false);
  const [price, setPrice] = useState('0.00');
  
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  
  // Album Tracks State
  const [albumTracks, setAlbumTracks] = useState<AlbumTrackInput[]>([
    { id: '1', title: '', file: null, isPremium: false, price: '0.00' }
  ]);
  
  // Dynamic standard upload states (since multipart hook is for 1 file only)
  const [standardUploadProgress, setStandardUploadProgress] = useState(0);
  const [standardUploadStatus, setStandardUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  
  const [localErrorMessage, setLocalErrorMessage] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [isArtistVerified, setIsArtistVerified] = useState<boolean | null>(null);
  
  const checkArtistStatus = async () => {
    try {
      const response = await api.get('/api/me');
      if (response.data.user?.role === 'artist' && response.data.user?.artist) {
        setIsArtistVerified(true);
      } else {
        setIsArtistVerified(false);
      }
    } catch (err) {
      setIsArtistVerified(false);
    }
  };

  useEffect(() => {
    if (user === null) {
      const timer = setTimeout(() => {
        if (!localStorage.getItem('auth_token')) {
          router.push('/login');
        }
      }, 1000);
      return () => clearTimeout(timer);
    }

    if (user.role !== 'artist') {
      router.push('/');
      return;
    }

    checkArtistStatus();
  }, [user, router]);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 500 * 1024 * 1024) {
        setLocalErrorMessage('File is too large (Max 500MB).');
        return;
      }
      setMediaFile(file);
      setLocalErrorMessage('');
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setLocalErrorMessage('Cover image is too large (Max 10MB).');
        return;
      }
      setCoverImage(file);
      setLocalErrorMessage('');
    }
  };

  const addAlbumTrack = () => {
    setAlbumTracks([
      ...albumTracks,
      { id: Date.now().toString(), title: '', file: null, isPremium: false, price: '0.00' }
    ]);
  };

  const removeAlbumTrack = (id: string) => {
    if (albumTracks.length <= 1) return;
    setAlbumTracks(albumTracks.filter(t => t.id !== id));
  };

  const updateAlbumTrack = (id: string, field: keyof AlbumTrackInput, value: any) => {
    setAlbumTracks(
      albumTracks.map(t => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const { progress, status: uploadStatus, errorMessage: hookErrorMessage, startUpload, pauseUpload, resumeUpload, resetUpload } = useResumableUpload();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (uploadMode === 'single') {
      if (!title || !mediaFile) {
        setLocalErrorMessage('Title and Media File are required.');
        return;
      }
      setLocalErrorMessage('');
      startUpload({
        file: mediaFile,
        title,
        mediaType,
        isPremium,
        price
      });
    } else {
      // Album Mode
      if (!title) {
        setLocalErrorMessage('Album Title is required.');
        return;
      }
      if (!coverImage) {
        setLocalErrorMessage('Album Cover Image is required.');
        return;
      }
      // Check tracks
      for (let i = 0; i < albumTracks.length; i++) {
        const track = albumTracks[i];
        if (!track.title) {
          setLocalErrorMessage(`Track #${i + 1} must have a title.`);
          return;
        }
        if (!track.file) {
          setLocalErrorMessage(`Track #${i + 1} ("${track.title || 'Untitled'}") must have an audio file.`);
          return;
        }
      }

      setLocalErrorMessage('');
      setStandardUploadStatus('uploading');
      setStandardUploadProgress(0);

      // Create FormData
      const formData = new FormData();
      formData.append('title', title);
      formData.append('cover_image', coverImage);
      
      // Append tracks
      albumTracks.forEach((track, index) => {
        formData.append(`tracks[${index}][title]`, track.title);
        if (track.file) {
          formData.append(`tracks[${index}][file]`, track.file);
        }
        formData.append(`tracks[${index}][is_premium]`, String(track.isPremium));
        formData.append(`tracks[${index}][price]`, track.price);
      });

      api.post('/api/studio/upload-album', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setStandardUploadProgress(percent);
          }
        }
      })
      .then(() => {
        setStandardUploadStatus('success');
        // Reset state
        setTitle('');
        setCoverImage(null);
        setAlbumTracks([
          { id: Date.now().toString(), title: '', file: null, isPremium: false, price: '0.00' }
        ]);
        if (coverInputRef.current) coverInputRef.current.value = '';
      })
      .catch((err: any) => {
        console.error('Album upload failed', err);
        setStandardUploadStatus('error');
        setLocalErrorMessage(err.response?.data?.message || err.message || 'Failed to upload album.');
      });
    }
  };

  useEffect(() => {
    if (uploadStatus === 'error') {
      setLocalErrorMessage(hookErrorMessage);
    } else {
      setLocalErrorMessage('');
    }

    if (uploadStatus === 'success') {
      setTitle('');
      setMediaFile(null);
      setCoverImage(null);
      setIsPremium(false);
      setPrice('0.00');
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  }, [uploadStatus, hookErrorMessage]);

  return (
    <div className="max-w-4xl mx-auto pb-32 relative">
      {/* Onboarding Guard Overlay */}
      {isArtistVerified === false && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-md rounded-2xl" />
          <div className="relative glass-card p-10 rounded-3xl max-w-lg text-center border-primary/30 shadow-[0_0_50px_rgba(0,180,216,0.2)] animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mic2 size={40} className="text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Initialize Artist Profile</h2>
            <p className="text-white/70 mb-8 leading-relaxed">
              Your account is marked as an artist, but your professional profile is not yet initialized. Please complete the onboarding to start uploading.
            </p>
            <button 
              onClick={() => router.push('/creator/join')}
              className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
            >
              Complete Onboarding to Continue
            </button>
          </div>
        </div>
      )}

      {(!user || user.role !== 'artist') && isArtistVerified !== false && (
        <div className="flex flex-col items-center justify-center h-[60vh] text-white/70">
          <AlertCircle size={48} className="mb-4 text-red-500" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p>You must be a verified artist to access the Upload Studio.</p>
        </div>
      )}

      {(user?.role === 'artist' || isArtistVerified === false) && (
        <>
          <div className="mb-8 border-b border-white/10 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Upload Studio</h1>
              <p className="text-white/60">Publish your latest tracks and videos to the world. Set your own price and take control of your earnings.</p>
            </div>
            <Link href="/creator/guide" className="flex items-center space-x-2 text-primary hover:brightness-125 transition bg-primary/10 px-4 py-2 rounded-xl border border-primary/20 text-sm font-bold">
              <Info size={18} />
              <span>View Creator Guide</span>
            </Link>
          </div>

          {/* Upload Mode Selector Toggle */}
          <div className="mb-6 flex bg-background/50 p-1.5 rounded-xl border border-white/5 max-w-md">
            <button
              type="button"
              onClick={() => {
                setUploadMode('single');
                setMediaType('audio');
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all ${
                uploadMode === 'single'
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Single Track / Episode
            </button>
            <button
              type="button"
              onClick={() => {
                setUploadMode('album');
                setMediaType('audio');
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all ${
                uploadMode === 'album'
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Album (Multi-Song)
            </button>
          </div>

          <form onSubmit={handleSubmit} className={`space-y-8 bg-surface p-8 rounded-2xl border border-white/5 ${isArtistVerified === false ? 'opacity-30 pointer-events-none' : ''}`}>
            
            {/* General Info: Album Title or Track Title */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">
                  {uploadMode === 'single' ? 'Title' : 'Album Title'}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={uploadMode === 'single' ? 'e.g. Island Breeze (Original Mix)' : 'e.g. Summer Anthems Vol. 1'}
                  className="w-full bg-background border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-primary transition"
                  required
                />
              </div>

              {uploadMode === 'single' ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Media Type</label>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => setMediaType('audio')}
                      className={`flex-1 flex items-center justify-center space-x-2 p-4 rounded-xl border transition ${mediaType === 'audio' ? 'bg-primary/20 border-primary text-primary' : 'bg-background border-white/10 text-white/60 hover:border-white/30'}`}
                    >
                      <Music size={20} />
                      <span>Audio Track</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaType('video')}
                      className={`flex-1 flex items-center justify-center space-x-2 p-4 rounded-xl border transition ${mediaType === 'video' ? 'bg-primary/20 border-primary text-primary' : 'bg-background border-white/10 text-white/60 hover:border-white/30'}`}
                    >
                      <Film size={20} />
                      <span>Video / Short</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Media Type</label>
                  <div className="flex items-center space-x-2 p-4 bg-background border border-white/10 rounded-xl text-primary font-bold">
                    <Music size={20} />
                    <span>Audio Album (Standard Upload)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Album Cover & Track Files Layout vs Single layout */}
            {uploadMode === 'single' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Media File</label>
                  <div 
                    className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:bg-white/5 transition cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {mediaFile ? (
                      <div className="flex flex-col items-center text-primary">
                        <CheckCircle2 size={32} className="mb-2" />
                        <span className="font-medium text-sm truncate max-w-[200px]">{mediaFile.name}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-white/50">
                        <Upload size={32} className="mb-2" />
                        <span className="text-sm">Click to upload {mediaType === 'audio' ? 'MP3/WAV' : 'MP4/MOV'}</span>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleMediaChange}
                      accept={mediaType === 'audio' ? 'audio/*' : 'video/*'}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Cover Image <span className="text-white/40 text-xs font-normal">(Optional)</span></label>
                  <div 
                    className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:bg-white/5 transition cursor-pointer"
                    onClick={() => coverInputRef.current?.click()}
                  >
                    {coverImage ? (
                      <div className="flex flex-col items-center text-primary">
                        <CheckCircle2 size={32} className="mb-2" />
                        <span className="font-medium text-sm truncate max-w-[200px]">{coverImage.name}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-white/50">
                        <ImageIcon size={32} className="mb-2" />
                        <span className="text-sm">Click to upload PNG/JPG</span>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={coverInputRef}
                      onChange={handleCoverChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            ) : (
              // Album Mode Fields
              <div className="space-y-6">
                {/* Cover image (required for albums) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Album Cover Image <span className="text-red-500">*</span></label>
                  <div 
                    className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:bg-white/5 transition cursor-pointer bg-background/50"
                    onClick={() => coverInputRef.current?.click()}
                  >
                    {coverImage ? (
                      <div className="flex flex-col items-center text-primary">
                        <CheckCircle2 size={32} className="mb-1" />
                        <span className="font-bold text-sm truncate max-w-[300px]">{coverImage.name}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-white/50">
                        <ImageIcon size={32} className="mb-1 text-primary" />
                        <span className="text-sm font-bold">Click to upload Album Cover Artwork (PNG/JPG)</span>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={coverInputRef}
                      onChange={handleCoverChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Tracks list */}
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white flex items-center">
                      <Music size={20} className="mr-2 text-primary" />
                      Tracks in Album ({albumTracks.length})
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {albumTracks.map((track, index) => (
                      <div key={track.id} className="bg-background/40 p-5 rounded-2xl border border-white/5 space-y-4 relative">
                        {albumTracks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeAlbumTrack(track.id)}
                            className="absolute top-4 right-4 text-white/40 hover:text-red-400 transition"
                            title="Remove Track"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}

                        <div className="flex items-center space-x-3 mb-2">
                          <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                            {index + 1}
                          </span>
                          <span className="font-bold text-white/90 text-sm">Track Details</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-white/60">Song Title</label>
                            <input
                              type="text"
                              value={track.title}
                              onChange={(e) => updateAlbumTrack(track.id, 'title', e.target.value)}
                              placeholder="e.g. Sunrise Groove"
                              className="w-full bg-background border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-primary text-sm transition"
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-white/60">Audio File</label>
                            <label className="flex items-center justify-center w-full bg-background border border-white/10 hover:border-white/30 rounded-lg p-3 cursor-pointer text-sm text-white/80 transition-all">
                              <Upload size={16} className="mr-2 text-white/60" />
                              <span className="truncate max-w-[200px] font-medium">
                                {track.file ? track.file.name : 'Choose audio file (MP3/WAV)'}
                              </span>
                              <input
                                type="file"
                                accept="audio/*"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    updateAlbumTrack(track.id, 'file', e.target.files[0]);
                                  }
                                }}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>

                        {/* Track monetization */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-white/60">Track Access</label>
                            <div className="flex items-center space-x-4 bg-background/55 p-2.5 rounded-lg border border-white/5">
                              <label className="flex items-center space-x-2 cursor-pointer text-xs">
                                <input
                                  type="radio"
                                  name={`access-${track.id}`}
                                  checked={!track.isPremium}
                                  onChange={() => updateAlbumTrack(track.id, 'isPremium', false)}
                                  className="w-4 h-4 accent-primary"
                                />
                                <span className="text-white font-medium">Free to Stream</span>
                              </label>
                              <label className="flex items-center space-x-2 cursor-pointer text-xs">
                                <input
                                  type="radio"
                                  name={`access-${track.id}`}
                                  checked={track.isPremium}
                                  onChange={() => updateAlbumTrack(track.id, 'isPremium', true)}
                                  className="w-4 h-4 accent-primary"
                                />
                                <span className="text-white font-medium">Premium</span>
                              </label>
                            </div>
                          </div>

                          {track.isPremium && (
                            <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                              <label className="text-xs font-semibold text-white/60">Track Price (AUD)</label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <span className="text-white/50 text-xs font-bold">$</span>
                                </div>
                                <input
                                  type="number"
                                  min="0.50"
                                  step="0.01"
                                  value={track.price}
                                  onChange={(e) => updateAlbumTrack(track.id, 'price', e.target.value)}
                                  className="w-full bg-background border border-primary/40 rounded-lg py-2.5 pl-7 pr-3 text-white text-sm font-bold focus:outline-none focus:border-primary transition"
                                  required={track.isPremium}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addAlbumTrack}
                    className="w-full py-4 bg-background hover:bg-white/5 text-primary rounded-xl border border-dashed border-primary/30 flex items-center justify-center space-x-2 text-sm font-bold transition-all mt-4"
                  >
                    <Plus size={18} />
                    <span>Add Track to Album</span>
                  </button>
                </div>
              </div>
            )}

            {/* Monetization for single track */}
            {uploadMode === 'single' && (
              <div className="space-y-4 pt-4 border-t border-white/10">
                <h3 className="text-lg font-bold text-white flex items-center"><DollarSign size={20} className="mr-2 text-green-400"/> Monetization</h3>
                <div className="flex items-center space-x-6 bg-background p-4 rounded-xl border border-white/5">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="radio" name="access" checked={!isPremium} onChange={() => setIsPremium(false)} className="w-5 h-5 accent-primary" />
                    <span className="text-white font-medium">Free to Stream</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="radio" name="access" checked={isPremium} onChange={() => setIsPremium(true)} className="w-5 h-5 accent-primary" />
                    <span className="text-white font-medium">Premium Content</span>
                  </label>
                </div>
                {isPremium && (
                  <div className="animate-in fade-in slide-in-from-top-4 space-y-2 mt-4">
                    <label className="text-sm font-medium text-white/80">Purchase Price (AUD)</label>
                    <div className="relative max-w-xs">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-white/50 font-bold">$</span>
                      </div>
                      <input
                        type="number"
                        min="0.50"
                        step="0.01"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full bg-background border border-primary/50 rounded-xl py-4 pl-8 pr-4 text-white text-lg font-bold focus:outline-none focus:border-primary transition"
                        required={isPremium}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Alerts */}
            {((uploadMode === 'single' && uploadStatus === 'error') || (uploadMode === 'album' && standardUploadStatus === 'error') || localErrorMessage) && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl flex items-center">
                <AlertCircle size={20} className="mr-3 shrink-0" />
                <p className="text-sm font-medium">{localErrorMessage || hookErrorMessage}</p>
              </div>
            )}
            
            {((uploadMode === 'single' && uploadStatus === 'success') || (uploadMode === 'album' && standardUploadStatus === 'success')) && (
              <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-4 rounded-xl flex items-center">
                <CheckCircle2 size={20} className="mr-3 shrink-0" />
                <p className="text-sm font-medium">{uploadMode === 'single' ? 'Media uploaded successfully!' : 'Album and tracks uploaded successfully!'}</p>
              </div>
            )}

            {/* Single Mode Upload Progress */}
            {uploadMode === 'single' && (uploadStatus === 'uploading' || uploadStatus === 'paused') && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-white/80 font-medium">
                  <span>Uploading to Cloudflare R2...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="flex justify-center space-x-4 mt-4">
                  {uploadStatus === 'uploading' ? (
                    <button type="button" onClick={pauseUpload} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg flex items-center text-sm font-medium transition">
                      <Pause size={16} className="mr-2"/> Pause
                    </button>
                  ) : (
                    <button type="button" onClick={resumeUpload} className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg flex items-center text-sm font-medium transition">
                      <Play size={16} className="mr-2"/> Resume
                    </button>
                  )}
                  <button type="button" onClick={resetUpload} className="bg-red-500/20 hover:bg-red-500/30 text-red-500 px-4 py-2 rounded-lg flex items-center text-sm font-medium transition">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Album Mode Upload Progress */}
            {uploadMode === 'album' && standardUploadStatus === 'uploading' && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-white/80 font-medium">
                  <span>Uploading Album and Tracks...</span>
                  <span>{standardUploadProgress}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${standardUploadProgress}%` }}></div>
                </div>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={
                uploadMode === 'single'
                  ? (uploadStatus === 'uploading' || uploadStatus === 'paused')
                  : (standardUploadStatus === 'uploading')
              }
              className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-xl transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {(uploadMode === 'single' && uploadStatus === 'uploading') || (uploadMode === 'album' && standardUploadStatus === 'uploading') ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Upload size={24} />
                  <span>{uploadMode === 'single' ? 'Publish Content' : 'Publish Album'}</span>
                </>
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
