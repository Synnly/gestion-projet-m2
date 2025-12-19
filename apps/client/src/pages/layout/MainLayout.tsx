import { useEffect } from 'react';
import { Outlet, useMatches, type UIMatch } from 'react-router-dom';

interface RouteMeta {
    title?: string;
}

export function MainLayout() {
    const matches = useMatches() as Array<UIMatch<unknown, RouteMeta>>;

    useEffect(() => {
        const match = matches.reverse().find((m) => {
            const handle = m.handle as RouteMeta | undefined;
            return handle?.title !== undefined;
        });

        if (match) {
            const handle = match.handle as RouteMeta;
            if (handle.title) {
                document.title = handle.title;
            }
        }
    }, [matches]);

    return <Outlet />;
}
