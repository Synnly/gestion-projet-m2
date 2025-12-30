import { Outlet } from 'react-router-dom';
import { Navbar } from '../../components/navbar/Navbar';

/**
 * Layout dashboard pour les étudiants.
 * Affiche la barre de navigation et rend les routes enfant via l'Outlet.
 */
export function StudentDashboard() {
    return (
        <div className="min-h-screen">
            <Navbar />
            <div className="p-8 bg-base-100">
                <div className="max-w-full mx-auto space-y-6">
                    <h1 className="text-3xl font-bold text-base-content">Tableau de bord étudiant</h1>
                    <div className="bg-base-100 rounded-lg shadow">
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
}
