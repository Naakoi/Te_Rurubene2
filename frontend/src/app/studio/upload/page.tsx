'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Upload, Music, Film, Image as ImageIcon, DollarSign, CheckCircle2, AlertCircle, Loader2, Mic2, Pause, Play, Info } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { useResumableUpload } from '@/hooks/useResumableUpload';

export default function StudioUpload() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [mediaType, setMediaType] = useState<'audio' | 'video'>('audio');
  const [isPremium, setIsPremium] = useState(false);
  const [price, setPrice] = useState('0.00');
  
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  
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

  const { progress, status: uploadStatus, errorMessage: hookErrorMessage, startUpload, pauseUpload, resumeUpload, resetUpload } = useResumableUpload();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

          <form onSubmit={handleSubmit} className={`space-y-8 bg-surface p-8 rounded-2xl border border-white/5 ${isArtistVerified === false ? 'opacity-30 pointer-events-none' : ''}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Island Breeze (Original Mix)"
                  className="w-full bg-background border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-primary transition"
                  required
                />
              </div>
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
            </div>

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

            {(uploadStatus === 'error' || localErrorMessage) && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl flex items-center">
                <AlertCircle size={20} className="mr-3 shrink-0" />
                <p className="text-sm font-medium">{localErrorMessage || hookErrorMessage}</p>
              </div>
            )}
            
            {uploadStatus === 'success' && (
              <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-4 rounded-xl flex items-center">
                <CheckCircle2 size={20} className="mr-3 shrink-0" />
                <p className="text-sm font-medium">Media uploaded successfully!</p>
              </div>
            )}

            {(uploadStatus === 'uploading' || uploadStatus === 'paused') && (
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

            <button
              type="submit"
              disabled={uploadStatus === 'uploading' || uploadStatus === 'paused'}
              className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-xl transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {uploadStatus === 'uploading' ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Upload size={24} />
                  <span>Publish Content</span>
                </>
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
