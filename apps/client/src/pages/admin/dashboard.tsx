import { Navbar } from '../common/navbar/Navbar';
import { AdminTabs } from './components/AdminTabs';
import ImportStudent from './components/importStudent';
import { StatsPage } from './components/stats/Stats';
import ValidateCompanies from './components/ValidateCompanies';
import { StudentList } from './components/StudentList.tsx';

export function AdminDashboard() {
    const tabs = [
        {
            id: 'import-students',
            label: 'Import Étudiants',
            content: <ImportStudent />,
        },
        {
            id: 'validate-companies',
            label: 'Validation Entreprises',
            content: <ValidateCompanies />,
        },
        {
            id: 'stats',
            label: 'Statistiques',
            content: <StatsPage />,
        },
        {
            id: 'manage-users',
            label: 'Gérer les Utilisateurs',
            content: <StudentList />,
        },
    ];

    return (
        <div className="min-h-screen">
            <Navbar />
            <div className="p-8 bg-base-100">
                <div className="max-w-full mx-auto">
                    <h1 className="text-3xl font-bold mb-6">Administration</h1>
                    <div className="bg-base-100 rounded-lg shadow">
                        <AdminTabs tabs={tabs} defaultTabId="import-students" />
                    </div>
                </div>
            </div>
        </div>
    );
}
