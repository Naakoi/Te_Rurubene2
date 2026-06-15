'use client';

import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useUIStore } from '@/store/uiStore';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { ShoppingCart, Menu } from 'lucide-react';
import Link from 'next/link';
import NotificationDropdown from './NotificationDropdown';

export default function TopNav() {
  const { user } = useAuthStore();
  const { items, toggleCart } = useCartStore();
  const { toggleSidebar } = useUIStore();
  const [balance, setBalance] = useState(0);
  const [isOffline, setIsOffline] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine);
      
      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  useEffect(() => {
    if (user && !isOffline) {
      api.get('/api/wallet')
        .then(res => setBalance(res.data.balance))
        .catch(() => {});
    }
  }, [user, isOffline]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  if (!user) return null;

  return (
    <div className="h-20 w-full glass border-b border-white/5 flex items-center justify-between px-4 md:px-8 shrink-0 z-50 sticky top-0">
       <div className="flex items-center space-x-3 whitespace-nowrap group cursor-pointer">
           <button onClick={toggleSidebar} className="md:hidden p-2 bg-white/5 rounded-xl hover:bg-white/10 transition">
              <Menu size={24} className="text-white" />
           </button>
           <div className="p-2 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-all duration-500 hidden md:flex">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary group-hover:rotate-[15deg] transition-transform duration-500">
                  <path d="M12 22C12 22 12 12 20 4C13 4 11 9 11 9C11 9 10 4 3 4C11 12 11 22 11 22H12Z" fill="currentColor" fillOpacity="0.9"/>
               </svg>
           </div>
           <div className="flex flex-col hidden md:flex">
               <div className="font-black text-xl leading-none">
                   <span className="text-white italic tracking-tighter">TE</span> <span className="text-primary tracking-[0.2em] ml-0.5">RURUBENE</span>
               </div>
               <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mt-1 opacity-60 group-hover:opacity-100 transition-opacity">Digital Pacific</span>
           </div>
       </div>
       <div className="flex items-center justify-end w-full space-x-3 md:space-x-4">
          {deferredPrompt && (
            <button onClick={handleInstallClick} className="bg-primary/20 text-primary border border-primary/30 px-3 md:px-4 py-1.5 md:py-2 rounded-2xl flex items-center space-x-2 hover:bg-primary/40 transition-all font-bold text-[10px] md:text-xs uppercase tracking-widest shadow-[0_0_10px_rgba(0,255,255,0.2)] hidden sm:flex">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              <span>Install</span>
            </button>
          )}
          {isOffline && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-3 md:px-4 py-1.5 md:py-2 rounded-2xl flex items-center space-x-2 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              <span className="text-[10px] font-black uppercase tracking-widest">Offline</span>
            </div>
          )}
          <Link href="/wallet" className="bg-white/5 border border-white/10 px-5 py-2 rounded-2xl flex items-center space-x-3 shadow-[inner_0_2px_4px_rgba(0,0,0,0.3)] hover:bg-white/10 transition-all duration-300 cursor-pointer group">
             <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(0,255,255,0.8)]"></div>
             <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">Balance</span>
                <span className="text-sm font-black text-white group-hover:text-primary transition-colors">${Number(balance).toFixed(2)}</span>
             </div>
          </Link>
          <NotificationDropdown />
          <button
            onClick={toggleCart}
            className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-primary hover:text-primary-foreground transition-all duration-500 relative shadow-xl group hover:-translate-y-0.5 active:translate-y-0"
          >
              <ShoppingCart size={20} className="group-hover:scale-110 transition-transform duration-500" />
              {items.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-accent text-white text-[11px] font-black rounded-full flex items-center justify-center border-2 border-background shadow-lg animate-bounce">
                      {items.length}
                  </span>
              )}
          </button>
          <div className="flex items-center space-x-4 cursor-pointer group">
             <div className="relative">
                 <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-lg group-hover:bg-primary/40 transition-all duration-500"></div>
                 <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary via-blue-600 to-accent flex items-center justify-center font-bold text-base shadow-2xl text-white relative z-10 group-hover:scale-105 transition-transform duration-500">
                    {(user?.name || 'User').charAt(0).toUpperCase()}
                 </div>
             </div>
             <div className="flex flex-col hidden md:flex">
                 <span className="font-bold text-sm text-white group-hover:text-primary transition-colors">{user?.name || 'User'}</span>
                 <div className="flex items-center space-x-1.5 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isOffline ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                      {isOffline ? 'Offline' : user.role}
                    </span>
                 </div>
             </div>
          </div>
       </div>
    </div>
  );
}
