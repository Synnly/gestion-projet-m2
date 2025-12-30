import { Navbar } from '../components/navbar/Navbar';
import { Outlet } from 'react-router-dom';

export function AdminDashboard() {
    return (
        <div className="min-h-screen">
            <Navbar />
            <div className="p-8 bg-base-100">
                <div className="max-w-full mx-auto">
                    <h1 className="text-3xl font-bold mb-6">Administration</h1>
                    <div className="bg-base-100 rounded-lg shadow ">
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
}
