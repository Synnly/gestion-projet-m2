import { Navbar } from '../../components/Navbar';

export function CompanyDashboard() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="p-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">Company Dashboard</h1>
                    <div className="bg-white rounded-lg shadow p-6">
                        <p className="text-gray-600">Welcome to your company dashboard!</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
