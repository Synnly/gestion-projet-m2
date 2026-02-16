import { Navbar } from '../common/navbar/Navbar';
import { AdminTabs } from './components/AdminTabs';
import ImportStudent from './components/importStudent';
import ManageStudents from './components/ManageStudents';
import { StatsPage } from './components/stats/Stats';
import ValidateCompanies from './components/ValidateCompanies';
import ReportsList from './components/ReportsList';


export function AdminDashboard() {
    const tabs = [
        {
            id: 'import-students',
            label: 'Import étudiants',
            content: <ImportStudent />,
        },
        {
            id: 'manage-students',
            label: 'Liste Étudiants',
            content: <ManageStudents />,
        },
        {
            id: 'validate-companies',
            label: 'Validation entreprises',
            content: <ValidateCompanies />,
        },
        {
            id: 'stats',
            label: 'Statistiques',
            content: <StatsPage />,
        },
        {
            id: 'moderation',
            label: 'Modération',
            content: <ReportsList />,
        }
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
