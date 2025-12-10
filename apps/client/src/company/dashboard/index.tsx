import { Navbar } from '../../components/navbar/Navbar';
import { Outlet } from 'react-router-dom';

export function CompanyDashboard() {
    return (
        <div className="flex flex-col h-screen overflow-hidden bg-base-100">
            <Navbar />
            <div className="flex-1 p-8 bg-base-100 overflow-hidden">
                <div className="flex flex-col h-full">
                    <h1 className="text-3xl font-bold mb-6">Mon tableau de bord</h1>

                    <div className="flex-1 bg-base-100 rounded-lg shadow overflow-auto min-h-0">
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
}
