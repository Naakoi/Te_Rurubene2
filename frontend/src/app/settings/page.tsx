'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { Shield, KeyRound, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import OfflineView from '@/components/OfflineView';

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  if (isOffline) {
    return <OfflineView pageName="Settings" description="You cannot change your account settings or update your preferences while offline. Please reconnect to the internet or listen to your downloaded tracks in the library." />;
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setStatus('error');
      setMessage('New passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setStatus('error');
      setMessage('New password must be at least 8 characters long.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const res = await api.post('/api/user/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword
      });
      
      setStatus('success');
      setMessage(res.data.message || 'Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Clear success message after 5 seconds
      setTimeout(() => setStatus('idle'), 5000);
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Failed to update password.');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-500">
      <div className="flex items-center space-x-4 mb-8">
        <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
          <Shield className="text-primary" size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Settings</h1>
          <p className="text-muted-foreground font-medium">Manage your account and preferences.</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Account & Security Section */}
        <section className="glass-card p-8 rounded-3xl border border-white/10 relative overflow-hidden">
          {/* Decorative Background */}
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center">
              <KeyRound className="mr-3 text-blue-400" size={24} />
              Account Security
            </h2>
            <p className="text-white/50 text-sm mb-8">Change your password to keep your account secure.</p>

            {status === 'error' && (
              <div className="mb-6 p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl text-sm font-bold flex items-center space-x-3">
                <AlertCircle size={18} className="shrink-0" />
                <span>{message}</span>
              </div>
            )}
            
            {status === 'success' && (
              <div className="mb-6 p-4 bg-green-500/10 text-green-400 border border-green-500/20 rounded-2xl text-sm font-bold flex items-center space-x-3">
                <CheckCircle2 size={18} className="shrink-0" />
                <span>{message}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-5 max-w-md">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Current Password</label>
                <input 
                  type="password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-2xl px-5 py-3.5 focus:border-blue-500 outline-none transition-all duration-300 text-white placeholder:text-white/20"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">New Password</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-2xl px-5 py-3.5 focus:border-blue-500 outline-none transition-all duration-300 text-white placeholder:text-white/20"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Confirm New Password</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-2xl px-5 py-3.5 focus:border-blue-500 outline-none transition-all duration-300 text-white placeholder:text-white/20"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={status === 'loading'}
                className="w-full py-4 text-sm uppercase tracking-widest font-black mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 flex justify-center items-center"
              >
                {status === 'loading' ? <Loader2 size={20} className="animate-spin" /> : 'Update Password'}
              </button>
            </form>
          </div>
        </section>

        {/* Preferences Section */}
        <section className="glass-card p-8 rounded-3xl border border-white/10">
          <h2 className="text-2xl font-bold text-white mb-2">Preferences</h2>
          <p className="text-white/50 text-sm mb-6">Audio quality and theme settings.</p>
          
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
             <div>
                <h3 className="text-white font-semibold">High Quality Audio</h3>
                <p className="text-xs text-muted-foreground">Stream music at the highest available bitrate.</p>
             </div>
             {/* Decorative toggle */}
             <div className="w-12 h-6 bg-primary rounded-full relative cursor-not-allowed opacity-50">
                <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1 shadow-sm"></div>
             </div>
          </div>
        </section>
      </div>
    </div>
  );
}
