import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('sprinkl_user') || 'null'),
  accessToken: localStorage.getItem('sprinkl_token') || null,
  
  setAuth: (user, token) => {
    localStorage.setItem('sprinkl_user', JSON.stringify(user));
    localStorage.setItem('sprinkl_token', token);
    set({ user, accessToken: token });
  },

  logout: () => {
    localStorage.removeItem('sprinkl_user');
    localStorage.removeItem('sprinkl_token');
    set({ user: null, accessToken: null });
  },
}));
