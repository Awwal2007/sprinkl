import { create } from 'zustand';

export const useNotificationStore = create((set, get) => ({
  toasts: [],
  confirmModal: {
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmVariant: 'brand', // 'brand' | 'danger' | 'warning'
    resolve: null,
  },

  addToast: ({ type = 'info', title = '', message = '', duration = 4500 }) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    const newToast = { id, type, title, message, duration };

    set((state) => ({
      toasts: [...state.toasts.slice(-4), newToast], // Keep at most 5 toasts
    }));

    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  openConfirm: ({
    title = 'Are you sure?',
    message = '',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmVariant = 'brand',
  }) => {
    return new Promise((resolve) => {
      set({
        confirmModal: {
          isOpen: true,
          title,
          message,
          confirmText,
          cancelText,
          confirmVariant,
          resolve,
        },
      });
    });
  },

  closeConfirm: (result = false) => {
    const { resolve } = get().confirmModal;
    if (resolve) resolve(result);
    set({
      confirmModal: {
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        confirmVariant: 'brand',
        resolve: null,
      },
    });
  },
}));

// Convenient standalone helper functions
export const toast = {
  success: (message, title = 'Success') =>
    useNotificationStore.getState().addToast({ type: 'success', title, message }),
  error: (message, title = 'Error') =>
    useNotificationStore.getState().addToast({ type: 'error', title, message }),
  warning: (message, title = 'Warning') =>
    useNotificationStore.getState().addToast({ type: 'warning', title, message }),
  info: (message, title = 'Info') =>
    useNotificationStore.getState().addToast({ type: 'info', title, message }),
};

export const confirmDialog = (options) =>
  useNotificationStore.getState().openConfirm(options);
