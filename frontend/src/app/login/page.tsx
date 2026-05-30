'use client';

import { useState } from 'react';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempt started for:', email);
    setError('');
    try {
      const response = await api.post('/api/login', { email, password });
      console.log('Login response received:', response.status, response.data);
      
      if (response.status === 200) {
        console.log('Login successful, saving token...');
        localStorage.setItem('auth_token', response.data.access_token);
        setUser(response.data.user);
        console.log('Redirecting to home...');
        window.alert('Sign-in successful!');
        router.push('/');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Unknown error';
      console.error('Login error detail:', msg);
      setError('Login failed: ' + msg);
      window.alert('Login failed: ' + msg);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-6 relative overflow-hidden">
      <div className="absolute inset-0 mesh-gradient opacity-40"></div>
      <div className="w-full max-w-md glass-card rounded-[3rem] p-10 relative z-10 border border-white/5 shadow-2xl animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-10">
           <div className="inline-flex p-3 bg-primary/10 rounded-2xl mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
                 <path d="M12 22C12 22 12 12 20 4C13 4 11 9 11 9C11 9 10 4 3 4C11 12 11 22 11 22H12Z" fill="currentColor" fillOpacity="0.9"/>
              </svg>
           </div>
           <h2 className="text-4xl font-black text-white italic tracking-tighter mb-2">Welcome Home</h2>
           <p className="text-muted-foreground font-medium">Rejoin the Pacific Music Ecosystem</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl text-sm font-bold flex items-center space-x-3">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 focus:border-primary outline-none transition-all duration-300 text-white placeholder:text-white/20"
              placeholder="name@rurubene.com"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 focus:border-primary outline-none transition-all duration-300 text-white placeholder:text-white/20"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="button" 
            onClick={() => {
              console.log('--- SIGN IN BUTTON CLICKED ---');
              handleLogin({ preventDefault: () => {} } as any);
            }}
            className="w-full fancy-button py-4 text-lg mt-6 shadow-primary/20 shadow-xl"
          >
            SIGN IN
          </button>
        </form>

        <div className="mt-12 text-center border-t border-white/5 pt-8">
          <p className="text-sm text-muted-foreground mb-6 font-medium">Are you a musician looking to share your art?</p>
          <button 
            onClick={() => router.push('/creator/join')}
            className="w-full py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold rounded-2xl transition-all duration-300"
          >
            BECOME A CREATOR
          </button>
        </div>
      </div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[150px] rounded-full"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[150px] rounded-full"></div>
    </div>
  );
}
