import { useEffect } from 'react';
import { Outlet, useMatches, type UIMatch } from 'react-router-dom';

export function Layout() {
    const matches = useMatches();

    useEffect(() => {
        const current = matches.find((m: UIMatch) => {
            const meta = m.handle as { title?: string } | undefined;
            return meta;
        });

        if (current) {
            document.title = `${current.handle.title} – Mon App`;
        }
    }, [matches]);

    return (
        <div>
            <Outlet />
        </div>
    );
}
