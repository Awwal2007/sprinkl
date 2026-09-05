import { create } from 'zustand';

const THEME_STORAGE_KEY = 'sprinkl-theme';

// Helper to determine the active theme ('light' or 'dark') based on setting & system preference
const getSystemTheme = () => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

const applyDomTheme = (resolved) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  if (resolved === 'dark') {
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
    root.style.colorScheme = 'light';
  }

  // Update mobile status bar / browser header meta
  let metaTheme = document.querySelector('meta[name="theme-color"]');
  if (!metaTheme) {
    metaTheme = document.createElement('meta');
    metaTheme.setAttribute('name', 'theme-color');
    document.head.appendChild(metaTheme);
  }
  metaTheme.setAttribute('content', resolved === 'dark' ? '#0b0f17' : '#ffffff');
};

export const useThemeStore = create((set, get) => ({
  // 'system' | 'light' | 'dark'
  theme: 'system',
  // 'light' | 'dark'
  resolvedTheme: 'light',
  isInitialized: false,

  initTheme: () => {
    if (get().isInitialized || typeof window === 'undefined') return;

    let savedTheme = 'system';
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        savedTheme = stored;
      }
    } catch {
      // localStorage may be disabled in private/incognito mode
      savedTheme = 'system';
    }

    const resolved = savedTheme === 'system' ? getSystemTheme() : savedTheme;
    applyDomTheme(resolved);

    // Register system media query change listener
    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e) => {
        const currentSetting = get().theme;
        if (currentSetting === 'system') {
          const newResolved = e.matches ? 'dark' : 'light';
          applyDomTheme(newResolved);
          set({ resolvedTheme: newResolved });
        }
      };

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', listener);
      } else if (mediaQuery.addListener) {
        mediaQuery.addListener(listener);
      }
    } catch (e) {
      console.warn('Media query listener error:', e);
    }

    set({
      theme: savedTheme,
      resolvedTheme: resolved,
      isInitialized: true,
    });
  },

  setTheme: (newTheme) => {
    if (newTheme !== 'light' && newTheme !== 'dark' && newTheme !== 'system') return;

    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // ignore
    }

    const resolved = newTheme === 'system' ? getSystemTheme() : newTheme;
    applyDomTheme(resolved);

    set({
      theme: newTheme,
      resolvedTheme: resolved,
    });
  },

  toggleTheme: () => {
    const current = get().resolvedTheme;
    const next = current === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },
}));
