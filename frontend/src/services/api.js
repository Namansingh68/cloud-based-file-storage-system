import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 90000, // Accommodates Render free-tier cold start (~35-60s) without premature abort
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth errors and transient cloud cold-start gateway responses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    const status = error.response?.status;
    const url = config?.url || '';
    const method = (config?.method || '').toLowerCase();

    if (
      config &&
      !config._coldStartRetried &&
      [502, 503, 504].includes(status) &&
      (method === 'get' || url.includes('/auth/'))
    ) {
      config._coldStartRetried = true;
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return api(config);
    }

    if (status === 401) {
      // Don't auto-redirect if checking auth status
      if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth-logout'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
