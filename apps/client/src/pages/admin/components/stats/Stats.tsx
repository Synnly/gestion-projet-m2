import { useState } from 'react';
import { useFetchStats } from '../../../../hooks/useFetchStats';
import { StatCard } from '../../components/stats/statCard';
import { TabButton } from '../../components/stats/tabButton';
import { ApplicationsTab } from './ApplicationsTab';
import { CompaniesTab } from './CompaniesTab';
import { OffersTab } from './OffersTab';
import { BuildingIcon, FileTextIcon, GraduationCapIcon, TrendingUpIcon, UsersIcon } from 'lucide-react';
import { StudentsTab } from './StudentsTab.tsx';

export function StatsPage() {
    const { data: stats, isLoading, error } = useFetchStats();
    const [activeTab, setActiveTab] = useState('applications');

    const statItems = [
        {
            title: 'Utilisateurs totaux',
            value: stats?.totalUsers,
            desc: 'Inscrits sur la plateforme',
            color: 'text-primary',
            icon: <UsersIcon size={40} />,
        },
        {
            title: 'Entreprises',
            value: stats?.totalCompanies,
            desc: 'Partenaires',
            color: 'text-secondary',
            icon: <BuildingIcon size={40} />,
        },
        {
            title: 'Étudiants',
            value: stats?.totalStudents,
            desc: 'En recherche',
            color: 'text-accent',
            icon: <GraduationCapIcon size={40} />,
        },
        {
            title: 'Candidatures',
            value: stats?.totalApplications,
            desc: 'Envoyées',
            color: 'text-info',
            icon: <FileTextIcon size={40} />,
        },
        {
            title: 'Offres',
            value: stats?.totalPosts,
            desc: 'Disponibles',
            color: 'text-success',
            icon: <TrendingUpIcon size={40} />,
        },
    ];

    const tabs = [
        { id: 'applications', label: 'Candidatures', color: 'btn-info' },
        { id: 'companies', label: 'Entreprises', color: 'btn-secondary' },
        { id: 'students', label: 'Étudiants', color: 'btn-accent' },
        { id: 'offers', label: 'Offres', color: 'btn-warning' },
    ];

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen">
                <div className="alert alert-error">
                    <span>Erreur lors du chargement des statistiques.</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base-100">
            <div className="container p-6 mx-auto">
                <h1 className="text-3xl font-bold mb-6">Statistiques du système</h1>

                <div className="stats stats-vertical lg:stats-horizontal shadow shadow-base-300 w-full bg-base-100">
                    <div className="stats stats-vertical lg:stats-horizontal shadow shadow-base-300 w-full bg-base-100">
                        {statItems.map((item, index) => (
                            <StatCard
                                key={index}
                                title={item.title}
                                value={item.value}
                                description={item.desc}
                                iconClass={item.icon}
                                colorClass={item.color}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex flex-wrap justify-center gap-4 mt-12 mb-8">
                    {tabs.map((tab) => (
                        <TabButton
                            key={tab.id}
                            label={tab.label}
                            isActive={activeTab === tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            colorName={tab.color}
                        />
                    ))}
                </div>

                <div className="bg-base-100 p-6 rounded-box shadow-md shadow-base-300 min-h-[400px]">
                    {activeTab === 'applications' && <ApplicationsTab stats={stats} />}
                    {activeTab === 'companies' && <CompaniesTab stats={stats} />}
                    {activeTab === 'students' && <StudentsTab stats={stats} />}
                    {activeTab === 'offers' && <OffersTab stats={stats} />}
                </div>
            </div>
        </div>
    );
}
