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

const SESSION_STORAGE_KEY = 'sprinkl_support_session_id';

export const useSupportStore = create((set, get) => ({
  isOpen: false,
  sessionId: safeStorage.getItem(SESSION_STORAGE_KEY) || '',
  messages: [],
  hasUnread: false,

  openChat: () => set({ isOpen: true, hasUnread: false }),
  closeChat: () => set({ isOpen: false }),
  toggleChat: () => set((state) => ({ isOpen: !state.isOpen, hasUnread: false })),

  setSessionId: (id) => {
    if (id) {
      safeStorage.setItem(SESSION_STORAGE_KEY, id);
    } else {
      safeStorage.removeItem(SESSION_STORAGE_KEY);
    }
    set({ sessionId: id || '' });
  },

  setMessages: (messages) => set({ messages }),

  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages, msg],
      hasUnread: !state.isOpen && msg.sender !== 'user',
    })),

  clearSession: () => {
    safeStorage.removeItem(SESSION_STORAGE_KEY);
    set({ sessionId: '', messages: [] });
  },
}));
