import { create } from 'zustand';

const getInitialPrefersDark = () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

interface DarkModeState {
    darkMode: boolean;
    setDarkMode: (isDark: boolean) => void;
    toggleDarkMode: () => void;
    isInitialized: boolean;
    initialize: () => void;
}

// Store creation
export const useDarkModeStore = create<DarkModeState>((set, get) => ({
    darkMode: (() => {
        if (typeof window === 'undefined') return false;
        const stored = localStorage.getItem('darkMode');
        return stored === 'true' ? true : false;
    })(),
    isInitialized: false,

    setDarkMode: (isDark) => {
        localStorage.setItem('darkMode', isDark ? 'true' : 'false');
        set({ darkMode: isDark });
    },

    toggleDarkMode: () => {
        const newDarkMode = !get().darkMode;
        get().setDarkMode(newDarkMode);
    },

    initialize: () => {
        if (get().isInitialized) return; // Prevents multiple executions

        const stored = localStorage.getItem('darkMode');
        const prefersDark = getInitialPrefersDark();
        let initialMode: boolean;

        if (stored === null) {
            initialMode = prefersDark;
        } else {
            initialMode = stored === 'true';
        }

        set({ darkMode: initialMode, isInitialized: true });

        if (stored === null) {
            localStorage.setItem('darkMode', initialMode ? 'true' : 'false');
        }

        const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');

        const mediaChangeHandler = (event: MediaQueryListEvent) => {
            localStorage.setItem('darkMode', event.matches ? 'true' : 'false');
            set({ darkMode: event.matches });
        };

        mediaQueryList.addEventListener('change', mediaChangeHandler);

        const storageChangeHandler = (event: StorageEvent) => {
            if (event.key === 'darkMode' && event.newValue !== null) {
                set({ darkMode: event.newValue === 'true' });
            }
        };

        window.addEventListener('storage', storageChangeHandler);
    },
}));
