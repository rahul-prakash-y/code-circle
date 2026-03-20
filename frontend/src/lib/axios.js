import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
});

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

export default api;
