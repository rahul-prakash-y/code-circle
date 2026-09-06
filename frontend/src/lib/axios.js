import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 15000,
});

// Request interceptor: attach bearer token and session id
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const sessionId = localStorage.getItem('sessionId');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  if (sessionId) {
    config.headers['X-Session-Id'] = sessionId;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor: global handling of expired sessions and unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthEndpoint = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
      
      if (!isAuthEndpoint) {
        localStorage.removeItem('token');
        localStorage.removeItem('sessionId');
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
