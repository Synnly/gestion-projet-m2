import { Navbar } from '../components/navbar/Navbar';
import ImportStudent from './importStudent';
import Moderation from './moderation';

export function AdminDashboard() {
    return (
        <div className="min-h-screen">
            <Navbar />
            <div className="p-8 bg-base-100">
                <div className="max-w-full mx-auto">
                    <h1 className="text-3xl font-bold mb-6">Administration</h1>
                    <div className="space-y-8">
                        <div className="bg-base-100 rounded-lg shadow p-6">
                            <h2 className="text-2xl font-bold mb-6">Import des Étudiants</h2>
                            <ImportStudent />
                        </div>
                        <div className="bg-base-100 rounded-lg shadow p-6">
                            <h2 className="text-xl font-bold mb-6">Modération</h2>
                            <Moderation />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
