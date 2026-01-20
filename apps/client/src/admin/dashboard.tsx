import { Navbar } from '../components/navbar/Navbar';
import { AdminTabs } from './AdminTabs';
import ImportStudent from './importStudent';
import { StatsPage } from './stats';
import ValidateCompanies from './ValidateCompanies';
import ReportsList from './reportsList';


export function AdminDashboard() {
    const tabs = [
        {
            id: 'import-students',
            label: 'Import étudiants',
            content: <ImportStudent />,
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
