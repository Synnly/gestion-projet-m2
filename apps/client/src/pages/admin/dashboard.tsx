import { Navbar } from '../common/navbar/Navbar';
import { AdminTabs } from './components/AdminTabs';
import ImportStudent from './components/importStudent';
import ManageStudents from './components/ManageStudents';
import { StatsPage } from './components/stats/Stats';
import ValidateCompanies from './components/ValidateCompanies';
import ExportDatabase from './components/ExportDatabase';
import { CompanyList } from './components/CompanyList.tsx';

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
            id: 'export-database',
            label: 'Export Base de Données',
            content: <ExportDatabase />,
        },
        {
            id: 'stats',
            label: 'Statistiques',
            content: <StatsPage />,
        },
        {
            id: 'manage-students',
            label: 'Gérer les Étudiants',
            content: <ManageStudents />,
        },
        {
            id: 'manage-companies',
            label: 'Gérer les Entreprises',
            content: <CompanyList />,
        },
    ];

    return (
        <div className="min-h-screen">
            <Navbar />
            <div className="p-8 bg-base-100">
                <div className="max-w-full mx-auto">
                    <h1 className="text-3xl font-bold mb-6">Administration</h1>
                    <div>
                        <AdminTabs tabs={tabs} defaultTabId="import-students" />
                    </div>
                </div>
            </div>
        </div>
    );
}
