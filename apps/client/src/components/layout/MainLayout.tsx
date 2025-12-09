import { Outlet } from 'react-router';
import Footer from '../ui/footer/Footer';

export default function MainLayout() {
    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex-1">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
