'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';

export default function AuthInitializer() {
  const setUser = useAuthStore((state) => state.setUser);
  const router = useRouter();

  useEffect(() => {
    // Prefetch all key navigation pages so Next.js downloads their JS chunks
    // while online, allowing them to be cached by the Service Worker.
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      const routes = ['/', '/discover', '/discover/podcasts', '/marketplace', '/wallet', '/settings', '/library'];
      routes.forEach(route => {
        try {
          router.prefetch(route);
        } catch (e) {}
      });
    }
  }, [router]);

  useEffect(() => {
    // Register PWA Service Worker and forcefully cache current chunks
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('PWA Service Worker registered scope:', reg.scope);
          // Cache current page JS/CSS chunks to fix offline refresh blank screen on first visit
          setTimeout(() => {
            const scripts = Array.from(document.querySelectorAll('script[src]')).map(s => (s as HTMLScriptElement).src);
            const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => (l as HTMLLinkElement).href);
            const toCache = [...scripts, ...links].filter(url => url.includes('/_next/static/'));
            
            if (typeof window !== 'undefined' && 'caches' in window) {
              caches.open('rurubene-pwa-cache-v1').then(cache => {
                toCache.forEach(url => {
                  cache.match(url).then(res => {
                    if (!res) fetch(url, { cache: 'no-cache' }).then(netRes => {
                      if (netRes.status === 200) cache.put(url, netRes);
                    }).catch(() => {});
                  });
                });
              }).catch((e) => console.warn('[AuthInitializer] Cache open failed:', e));
            }
          }, 2000);
        })
        .catch((err) => console.error('PWA Service Worker registration failed:', err));
    }

    const token = localStorage.getItem('auth_token');
    if (token) {
      console.log('Found auth_token, verifying session...');
      api.get('/api/me')
        .then((res) => {
          console.log('Session verified:', res.data.user?.name);
          if (res.data.user) {
            setUser(res.data.user);
          }
        })
        .catch((err) => {
          console.error('Session verification failed:', err.response?.data || err.message);
          
          // If it's a network error (no response) or navigator is offline, do NOT log out!
          const isNetworkError = !err.response;
          const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
          
          if (isNetworkError || isOffline) {
            console.log('App is offline or network error occurred. Keeping cached session.');
            return;
          }
          
          localStorage.removeItem('auth_token');
          setUser(null);
        });
    } else {
      console.log('No auth_token found.');
    }
  }, [setUser]);

  return null;
}
