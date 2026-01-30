import { useEffect, type ReactNode } from 'react';

import { useDarkModeStore } from '../../store/darkModeStore';

interface DarkModeProviderProps {
    children: ReactNode;
}

export const DarkModeProvider = ({ children }: DarkModeProviderProps) => {
    const { darkMode, initialize } = useDarkModeStore((state) => state);

    useEffect(() => {
        const htmlElement = document.documentElement;

        const themeValue = darkMode ? 'luxury' : 'bumblebee';
        htmlElement.setAttribute('data-theme', themeValue);

        return () => {
            htmlElement.removeAttribute('data-theme');
        };
    }, [darkMode]);

    useEffect(() => {
        initialize();
    }, [initialize]);

    return <>{children}</>;
};
