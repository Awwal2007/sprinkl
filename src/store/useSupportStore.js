import { create } from 'zustand';

const SESSION_STORAGE_KEY = 'sprinkl_support_session_id';

export const useSupportStore = create((set, get) => ({
  isOpen: false,
  sessionId: localStorage.getItem(SESSION_STORAGE_KEY) || '',
  messages: [],
  hasUnread: false,

  openChat: () => set({ isOpen: true, hasUnread: false }),
  closeChat: () => set({ isOpen: false }),
  toggleChat: () => set((state) => ({ isOpen: !state.isOpen, hasUnread: false })),

  setSessionId: (id) => {
    if (id) {
      localStorage.setItem(SESSION_STORAGE_KEY, id);
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
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
    localStorage.removeItem(SESSION_STORAGE_KEY);
    set({ sessionId: '', messages: [] });
  },
}));
