import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000',
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': 'application/json',
  },
});

// Add a request interceptor to include the Bearer token and block offline purchases
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const isOffline = !navigator.onLine;
    const isPurchase = 
      config.url?.includes('checkout') ||
      config.url?.includes('wallet/topup') ||
      config.url?.includes('tickets') ||
      config.url?.includes('bank-deposit') ||
      config.url?.includes('redeem');

    if (isOffline && isPurchase) {
      alert('Purchase requires an active internet connection. Please check your network status.');
      return Promise.reject(new axios.Cancel('Purchase blocked in offline mode.'));
    }

    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Add a response interceptor to handle 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (error.response.data && (error.response.data.message === 'Unauthenticated.' || error.response.data.message === 'Unauthenticated')) {
        error.response.data.message = 'Your session has expired or you are not signed in. Please sign in to continue.';
      }
      // Don't redirect if we are already trying to login!
      const isLoginRequest = error.config?.url?.includes('/login');
      
      if (typeof window !== 'undefined' && !isLoginRequest) {
        const hadToken = !!localStorage.getItem('auth_token');
        localStorage.removeItem('auth_token');
        if (hadToken) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
