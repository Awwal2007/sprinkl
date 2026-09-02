import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('sprinkl_user') || 'null'),
  accessToken: localStorage.getItem('sprinkl_token') || null,
  refreshToken: localStorage.getItem('sprinkl_refresh') || null,

  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem('sprinkl_user', JSON.stringify(user));
    localStorage.setItem('sprinkl_token', accessToken);
    if (refreshToken) localStorage.setItem('sprinkl_refresh', refreshToken);
    set({ user, accessToken, refreshToken: refreshToken || localStorage.getItem('sprinkl_refresh') });
  },

  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('sprinkl_token', accessToken);
    if (refreshToken) localStorage.setItem('sprinkl_refresh', refreshToken);
    set({ accessToken, refreshToken });
  },

  logout: () => {
    localStorage.removeItem('sprinkl_user');
    localStorage.removeItem('sprinkl_token');
    localStorage.removeItem('sprinkl_refresh');
    set({ user: null, accessToken: null, refreshToken: null });
  },
}));

