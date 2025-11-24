import { Navbar } from '../../components/navbar/Navbar';
import { DashboardInternshipList } from './intershipList/DashboardInternshipList';
import { Outlet } from 'react-router-dom';

export function CompanyDashboard() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="p-8">
                <div className="max-w-full mx-auto">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">Mon tableau de bord</h1>
                    <div className="bg-base-100 rounded-lg shadow ">
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
}
