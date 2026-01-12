import { useState } from 'react';
import { useFetchStats } from '../../hooks/useFetchStats';
import { Navbar } from '../../components/navbar/Navbar';

import { StatCard } from '../../components/stats/statCard';
import { TabButton } from '../../components/stats/tabButton';
import { ApplicationsTab } from './ApplicationsTab';
import { CompaniesTab } from './CompaniesTab';
import { OffersTab } from './OffersTab';

export function StatsPage() {
    const { data: stats, isLoading, error } = useFetchStats();
    const [activeTab, setActiveTab] = useState('applications');

    const statItems = [
        {
            title: "Utilisateurs totaux",
            value: stats?.totalUsers,
            desc: "Inscrits sur la plateforme",
            color: "text-primary",
            path: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
        },
        {
            title: "Entreprises",
            value: stats?.totalCompanies,
            desc: "Partenaires",
            color: "text-secondary",
            path: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        },
        {
            title: "Étudiants",
            value: stats?.totalStudents,
            desc: "En recherche",
            color: "text-accent",
            path: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        },
        {
            title: "Candidatures",
            value: stats?.totalApplications,
            desc: "Envoyées",
            color: "text-info",
            path: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        },
        {
            title: "Offres",
            value: stats?.totalPosts,
            desc: "Disponibles",
            color: "text-success",
            path: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
        }
    ];

    const tabs = [
        { id: 'applications', label: 'Candidatures', color: 'blue' },
        { id: 'companies', label: 'Entreprises', color: 'purple' },
        { id: 'offers', label: 'Offres', color: 'emerald' }
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
                <Navbar />
                <div className="p-6">
                    <div className="alert alert-error">
                        <span>Erreur lors du chargement des statistiques.</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base-200">
            <Navbar />

            <div className="max-w-7xl mx-auto p-6">
                <h2 className="text-2xl font-bold mb-6 text-base-content">Statistiques du système</h2>

                {/* --- KPI CARDS --- */}
                <div className="stats stats-vertical lg:stats-horizontal shadow w-full bg-base-100">
                    <div className="stats stats-vertical lg:stats-horizontal shadow w-full bg-base-100">
                        {statItems.map((item, index) => (
                            <StatCard
                                key={index}
                                title={item.title}
                                value={item.value}
                                description={item.desc}
                                iconPath={item.path}
                                colorClass={item.color}
                            />
                        ))}
                    </div>
                </div>

                {/* --- TABS --- */}
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

                {/* --- CONTENT --- */}
                <div className="bg-base-100 p-6 rounded-box shadow-md min-h-[400px]">

                    {activeTab === 'applications' && <ApplicationsTab stats={stats} />}
                    {activeTab === 'companies' && <CompaniesTab stats={stats} />}
                    {activeTab === 'offers' && <OffersTab stats={stats} />}
                </div>
            </div>
        </div>
    );
}