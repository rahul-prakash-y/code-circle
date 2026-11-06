import axios from 'axios';
import useServerStore from '../store/useServerStore';

const api = axios.create({
  timeout: 60000, // 60s timeout to allow heavy processing and avoid premature cancellation
});

// Dynamic Request Interceptor: Prepends activeServerUrl resolved from Zustand/localStorage
api.interceptors.request.use(
  async (config) => {
    // 1. Read activeServerUrl from Zustand store or localStorage
    let serverUrl =
      useServerStore.getState().activeServerUrl ||
      (typeof window !== 'undefined' ? localStorage.getItem('activeServerUrl') : null);

    // Fallback: If activeServerUrl is null, trigger findFastestServer() before proceeding
    if (!serverUrl) {
      try {
        serverUrl = await useServerStore.getState().findFastestServer();
      } catch (err) {
        console.warn('[API Interceptor] Failed to locate optimal server, using default fallback:', err);
        serverUrl =
          (import.meta.env.VITE_API_BASE_URL
            ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '')
            : null) || 'http://localhost:5000';
      }
    }

    const cleanBase = (serverUrl || 'http://localhost:5000').replace(/\/+$/, '');

    // Configure baseURL dynamically per request
    if (!config.url?.startsWith('http://') && !config.url?.startsWith('https://')) {
      config.baseURL = `${cleanBase}/api`;
    }

    // Attach Bearer token and Session tracking ID
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const sessionId = typeof window !== 'undefined' ? localStorage.getItem('sessionId') : null;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (sessionId) {
      config.headers['X-Session-Id'] = sessionId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: global handling of expired sessions and unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthEndpoint =
        error.config?.url?.includes('/auth/login') ||
        error.config?.url?.includes('/auth/register') ||
        error.config?.url?.includes('/auth/request-reset') ||
        error.config?.url?.includes('/auth/reset-password');

      if (!isAuthEndpoint && typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('sessionId');
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
