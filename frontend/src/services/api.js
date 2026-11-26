import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 90000, // Accommodates Render free-tier cold start (~35-60s) without premature abort
});

let currentBackendStatus = 'checking'; // 'checking' | 'waking' | 'ready' | 'unreachable'
const statusListeners = new Set();
let wakePromise = null;

const setBackendStatus = (status) => {
  if (currentBackendStatus !== status) {
    currentBackendStatus = status;
    statusListeners.forEach((listener) => listener(status));
  }
};

export const subscribeBackendStatus = (listener) => {
  statusListeners.add(listener);
  listener(currentBackendStatus);
  return () => statusListeners.delete(listener);
};

const isBrowserOnline = () => typeof navigator === 'undefined' || navigator.onLine !== false;

/**
 * True when an error reflects a Render/Cloudflare cold-start gateway page (502-504),
 * a CORS-masked 502/503 (!error.response & ERR_NETWORK), or a dropped boot socket.
 */
const isWakeRetryableError = (error) => {
  if (!isBrowserOnline()) return false;
  const status = error?.response?.status;
  if ([502, 503, 504].includes(status)) return true;
  return !error?.response && error?.code !== 'ECONNABORTED';
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Deduplicated wake-up poller for sleeping cloud backends.
 * Polls /api/auth/health until Spring Boot finishes booting (up to maxWaitMs).
 */
export const waitForBackendAwake = (maxWaitMs = 75000) => {
  if (wakePromise) return wakePromise;

  wakePromise = (async () => {
    if (!isBrowserOnline()) {
      setBackendStatus('unreachable');
      return false;
    }

    const startTime = Date.now();
    const slowBannerTimer = setTimeout(() => {
      if (currentBackendStatus === 'checking') {
        setBackendStatus('waking');
      }
    }, 1500);

    try {
      while (Date.now() - startTime < maxWaitMs) {
        try {
          await api.get('/auth/health', { timeout: 25000, _skipWakeRetry: true });
          setBackendStatus('ready');
          return true;
        } catch (err) {
          if (!isWakeRetryableError(err) && err?.code !== 'ECONNABORTED') {
            setBackendStatus('unreachable');
            return false;
          }
          setBackendStatus('waking');
          const remaining = maxWaitMs - (Date.now() - startTime);
          if (remaining <= 0) break;
          await sleep(Math.min(3500, remaining));
        }
      }
      setBackendStatus('unreachable');
      return false;
    } finally {
      clearTimeout(slowBannerTimer);
      wakePromise = null;
    }
  })();

  return wakePromise;
};

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

// Response interceptor to handle auth errors and recover from CORS-masked cold-start 502/503s
api.interceptors.response.use(
  (response) => {
    setBackendStatus('ready');
    return response;
  },
  async (error) => {
    const config = error.config;
    const status = error.response?.status;
    const url = config?.url || '';
    const method = (config?.method || '').toLowerCase();

    const shouldRecoverColdStart =
      config &&
      !config._skipWakeRetry &&
      !config._coldStartRetried &&
      (method === 'get' || url.includes('/auth/')) &&
      (isWakeRetryableError(error) || error.code === 'ECONNABORTED');

    if (shouldRecoverColdStart) {
      config._coldStartRetried = true;
      const awake = await waitForBackendAwake();
      if (awake) {
        return api(config);
      }
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
