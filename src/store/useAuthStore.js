import { create } from 'zustand';

// Safe localStorage wrapper that never throws in sandboxed or headless environments (e.g. Googlebot WRS)
const safeStorage = {
  getItem: (key) => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, val) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, val);
      }
    } catch {
      // ignore
    }
  },
  removeItem: (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(key);
      }
    } catch {
      // ignore
    }
  },
};

const getStoredUser = () => {
  try {
    const raw = safeStorage.getItem('sprinkl_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create((set) => ({
  user: getStoredUser(),
  accessToken: safeStorage.getItem('sprinkl_token'),
  refreshToken: safeStorage.getItem('sprinkl_refresh'),

  setAuth: (user, accessToken, refreshToken) => {
    safeStorage.setItem('sprinkl_user', JSON.stringify(user));
    safeStorage.setItem('sprinkl_token', accessToken);
    if (refreshToken) safeStorage.setItem('sprinkl_refresh', refreshToken);
    set({ user, accessToken, refreshToken: refreshToken || safeStorage.getItem('sprinkl_refresh') });
  },

  setTokens: (accessToken, refreshToken) => {
    safeStorage.setItem('sprinkl_token', accessToken);
    if (refreshToken) safeStorage.setItem('sprinkl_refresh', refreshToken);
    set({ accessToken, refreshToken });
  },

  logout: () => {
    safeStorage.removeItem('sprinkl_user');
    safeStorage.removeItem('sprinkl_token');
    safeStorage.removeItem('sprinkl_refresh');
    set({ user: null, accessToken: null, refreshToken: null });
  },
}));
