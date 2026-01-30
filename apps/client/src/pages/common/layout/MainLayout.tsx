import Footer from '../ui/footer/Footer';
import { useEffect } from 'react';
import { Outlet, useMatches, type UIMatch } from 'react-router-dom';

interface RouteMeta {
    title?: string;
}
export default function MainLayout() {
    const matches = useMatches() as Array<UIMatch<RouteMeta>>;
    useEffect(() => {
        const match = matches.find((m) => (m.handle as RouteMeta)?.title);

        if ((match?.handle as RouteMeta)?.title) {
            document.title = (match!.handle as RouteMeta).title!;
        }
    }, [matches]);
    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex-1">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
