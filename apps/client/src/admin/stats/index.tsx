import { useState } from 'react';
import { useFetchStats } from '../../hooks/useFetchStats';
import { Navbar } from '../../components/navbar/Navbar';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function StatsPage() {
    const { data: stats, isLoading, error } = useFetchStats();
    const [activeTab, setActiveTab] = useState('applications');

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
                    <div className="stat">
                        <div className="stat-figure text-primary">
                            <svg className="inline-block w-8 h-8 stroke-current" fill="none" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                            </svg>
                        </div>
                        <div className="stat-title">Utilisateurs totaux</div>
                        <div className="stat-value text-primary">{stats?.totalUsers}</div>
                        <div className="stat-desc">Inscrits sur la plateforme</div>
                    </div>

                    <div className="stat">
                        <div className="stat-figure text-secondary">
                            <svg className="inline-block w-8 h-8 stroke-current" fill="none" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                            </svg>
                        </div>
                        <div className="stat-title">Entreprises</div>
                        <div className="stat-value text-secondary">{stats?.totalCompanies}</div>
                        <div className="stat-desc">Partenaires</div>
                    </div>

                    <div className="stat">
                        <div className="stat-figure text-accent">
                            <svg className="inline-block w-8 h-8 stroke-current" fill="none" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                            </svg>
                        </div>
                        <div className="stat-title">Étudiants</div>
                        <div className="stat-value text-accent">{stats?.totalStudents}</div>
                        <div className="stat-desc">En recherche</div>
                    </div>

                    <div className="stat">
                        <div className="stat-figure text-info">
                            <svg className="inline-block w-8 h-8 stroke-current" fill="none" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                        </div>
                        <div className="stat-title">Candidatures</div>
                        <div className="stat-value text-info">{stats?.totalApplications}</div>
                        <div className="stat-desc">Envoyées</div>
                    </div>

                    <div className="stat">
                        <div className="stat-figure text-success">
                            <svg className="inline-block w-8 h-8 stroke-current" fill="none" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                            </svg>
                        </div>
                        <div className="stat-title">Offres</div>
                        <div className="stat-value text-success">{stats?.totalPosts}</div>
                        <div className="stat-desc">Disponibles</div>
                    </div>
                </div>

                {/* --- TABS --- */}
                <div className="flex flex-wrap justify-center gap-4 mt-12 mb-8">
                    <button
                        onClick={() => setActiveTab('applications')}
                        className={`
                            flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-200 shadow-sm
                            ${activeTab === 'applications' 
                                ? 'bg-blue-600 text-white scale-105 shadow-md ring-2 ring-blue-600 ring-offset-2'
                                : 'bg-base-100 text-base-content hover:bg-base-200 border border-base-300'
                            }
                        `}
                    >
                        Candidatures
                    </button>

                    <button
                        onClick={() => setActiveTab('companies')}
                        className={`
                            flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-200 shadow-sm
                            ${activeTab === 'companies' 
                                ? 'bg-purple-600 text-white scale-105 shadow-md ring-2 ring-purple-600 ring-offset-2'
                                : 'bg-base-100 text-base-content hover:bg-base-200 border border-base-300'
                            }
                        `}
                    >
                        Entreprises
                    </button>

                    <button
                        onClick={() => setActiveTab('offers')}
                        className={`
                            flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-200 shadow-sm
                            ${activeTab === 'offers' 
                                ? 'bg-emerald-600 text-white scale-105 shadow-md ring-2 ring-emerald-600 ring-offset-2'
                                : 'bg-base-100 text-base-content hover:bg-base-200 border border-base-300'
                            }
                        `}
                    >
                        Offres
                    </button>
                </div>

                {/* --- CONTENT --- */}
                <div className="bg-base-100 p-6 rounded-box shadow-md min-h-[400px]">
                    
                    {activeTab === 'applications' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="card bg-base-100 shadow-sm border border-base-200 p-4">
                                <h3 className="text-lg font-semibold mb-4 text-base-content">État des candidatures</h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={stats?.applicationsByStatus || []}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                paddingAngle={5}
                                                dataKey="value"
                                                label
                                            >
                                                {stats?.applicationsByStatus?.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="card bg-base-100 shadow-sm border border-base-200 p-4">
                                <h3 className="text-lg font-semibold mb-4 text-base-content">Candidatures par mois</h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats?.applicationsOverTime || []}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="count" fill="#3b82f6" name="Candidatures" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'companies' && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-base-content">Top Recruteurs</h3>
                            <div className="overflow-x-auto">
                                <table className="table table-zebra w-full">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Entreprise</th>
                                            <th>Offres postées</th>
                                            <th>Taux de réponse</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats?.topCompanies?.map((company, index) => (
                                            <tr key={index}>
                                                <td>{index + 1}</td>
                                                <td className="font-bold">{company.name}</td>
                                                <td>{company.offersCount}</td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <progress className="progress progress-success w-20" value={company.responseRate} max="100"></progress> 
                                                        <span className="text-xs">{company.responseRate}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'offers' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="stat bg-orange-50 rounded-box border border-orange-200">
                                <div className="stat-title text-orange-800">Offres sans candidats</div>
                                <div className="stat-value text-orange-600">{stats?.orphanOffersCount || 0}</div>
                                <div className="stat-desc text-orange-700">Aucune candidature reçue</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}