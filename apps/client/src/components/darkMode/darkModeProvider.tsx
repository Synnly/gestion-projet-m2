import { useEffect, type ReactNode } from 'react';
import { useDarkModeStore } from '../../store/darkModeStore';
interface DarkModeConfigProps {
    children: ReactNode;
}

export function DarkModeConfig({ children }: DarkModeConfigProps) {
    const { darkMode, initialize } = useDarkModeStore((state) => state);

    console.log(initialize);
    useEffect(() => {
        const htmlElement = document.documentElement;

        // Détermine la valeur de data-theme basée sur l'état darkMode
        const themeValue = darkMode ? 'luxury' : 'bumblebee';

        // Applique l'attribut data-theme
        htmlElement.setAttribute('data-theme', themeValue);

        return () => {
            htmlElement.removeAttribute('data-theme');
        };
    }, [darkMode]);

    useEffect(() => {
        initialize();
    }, [initialize]);

    return <>{children}</>;
}
