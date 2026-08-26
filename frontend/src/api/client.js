import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Tokens live in memory + localStorage (not cookies), so we manage them
// through small get/set helpers rather than scattering localStorage calls
// across the app.
const ACCESS_KEY = 'rb_access_token';
const REFRESH_KEY = 'rb_refresh_token';

export const tokenStore = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set: (accessToken, refreshToken) => {
    localStorage.setItem(ACCESS_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On a 401 (expired access token), try exactly once to refresh and replay
// the original request. If the refresh itself fails, clear tokens and let
// the error propagate so AuthContext can redirect to /login.
let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (status !== 401 || original._retried || original.url?.includes('/auth/')) {
      return Promise.reject(error);
    }

    original._retried = true;
    const refreshToken = tokenStore.getRefresh();
    if (!refreshToken) return Promise.reject(error);

    try {
      if (!refreshPromise) {
        refreshPromise = axios
          .post(`${API_URL}/auth/refresh`, { refreshToken })
          .finally(() => {
            refreshPromise = null;
          });
      }
      const { data } = await refreshPromise;
      tokenStore.set(data.accessToken);
      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(original);
    } catch (refreshError) {
      tokenStore.clear();
      return Promise.reject(error);
    }
  }
);

// Normalizes our backend's { error: { message, details } } shape into a
// plain string so components can just do `catch (err) { setError(err.message) }`.
export function apiErrorMessage(err) {
  return err?.response?.data?.error?.message || err?.message || 'Something went wrong';
}
