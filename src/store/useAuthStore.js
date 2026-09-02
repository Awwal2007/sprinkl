import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('givehub_user') || 'null'),
  accessToken: localStorage.getItem('givehub_token') || null,
  
  setAuth: (user, token) => {
    localStorage.setItem('givehub_user', JSON.stringify(user));
    localStorage.setItem('givehub_token', token);
    set({ user, accessToken: token });
  },

  logout: () => {
    localStorage.removeItem('givehub_user');
    localStorage.removeItem('givehub_token');
    set({ user: null, accessToken: null });
  },
}));
