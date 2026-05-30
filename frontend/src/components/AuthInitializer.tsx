'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';

export default function AuthInitializer() {
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
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
          localStorage.removeItem('auth_token');
          setUser(null);
        });
    } else {
      console.log('No auth_token found.');
    }
  }, [setUser]);

  return null;
}
