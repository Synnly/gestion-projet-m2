import { useEffect } from 'react';
import { Outlet, useMatches, type UIMatch } from 'react-router-dom';

interface RouteMeta {
    title?: string;
}

export function MainLayout() {
    const matches = useMatches() as Array<UIMatch<RouteMeta>>;

    useEffect(() => {
        const match = matches.find((m) => m.handle?.title);

        if (match?.handle?.title) {
            document.title = match.handle.title;
        }
    }, [matches]);

    return <Outlet />;
}
