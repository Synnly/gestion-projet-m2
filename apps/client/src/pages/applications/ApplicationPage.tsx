import { Navbar } from '../../components/navbar/Navbar';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useFetchApplications } from '../../hooks/useFetchApplications';
import { useApplicationStore, type ApplicationStatus } from '../../store/useApplicationStore';

const statusStyles: Record<ApplicationStatus, string> = {
    Applied: 'badge badge-sm bg-blue-100 text-blue-700 border-blue-200',
    'Under Review': 'badge badge-sm bg-pink-100 text-pink-700 border-pink-200',
    Interviewing: 'badge badge-sm bg-yellow-100 text-yellow-700 border-yellow-200',
    Offer: 'badge badge-sm bg-green-100 text-green-700 border-green-200',
    Rejected: 'badge badge-sm bg-red-100 text-red-700 border-red-200',
};

export default function ApplicationPage() {
    const { isLoading, error } = useFetchApplications();
    const applicationItems = useApplicationStore((s) => s.applications);
    const pagination = useApplicationStore((s) => s.pagination);

    const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 0;
    const startIdx = pagination ? (pagination.page - 1) * pagination.limit + 1 : 0;
    const endIdx = pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0;

    return (
        <div className="min-h-screen bg-base-200">
            <Navbar />
            <main className="w-full flex justify-center px-4 md:px-8 py-8">
                <div className="w-full max-w-6xl space-y-6">
                    <header className="space-y-2">
                        <h1 className="text-2xl font-bold text-base-content">My Applications</h1>
                        <p className="text-sm text-base-content/70">
                            Track the status of all your internship applications.
                        </p>
                        {isLoading && <p className="text-xs text-base-content/60">Chargement...</p>}
                        {error && <p className="text-xs text-error">{error.message}</p>}
                    </header>

                    <section className="card bg-base-100 shadow-sm">
                        <div className="card-body space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <label className="input input-bordered flex items-center gap-2 md:col-span-2">
                                    <span className="text-base-content/60 text-sm">🔍</span>
                                    <input
                                        type="text"
                                        className="grow"
                                        placeholder="Rechercher par titre ou entreprise"
                                        disabled
                                    />
                                </label>
                                <select className="select select-bordered w-full text-sm" disabled defaultValue="">
                                    <option value="">Statut : Tous</option>
                                </select>
                                <input type="date" className="input input-bordered w-full text-sm" disabled />
                            </div>
                            <div className="flex justify-end">
                                <button className="btn btn-primary btn-sm" disabled>
                                    Filtrer
                                </button>
                            </div>

                            <div className="overflow-hidden rounded-lg border border-base-200">
                                <div className="divide-y divide-base-200 bg-base-100">
                                    {applicationItems.map((app) => (
                                        <div
                                            key={app._id}
                                            className="grid grid-cols-1 md:grid-cols-[2fr,1fr,1fr,1fr,1fr] gap-3 px-4 py-4 items-center"
                                        >
                                            <div>
                                                <div className="font-semibold text-base-content">{app.post.title}</div>
                                                <div className="text-sm text-base-content/70">{app.post.description}</div>
                                            </div>
                                            <div className="text-sm text-base-content/80">{app.post.company?.name}</div>
                                            <div className="text-sm text-base-content/80">{app.createdAt}</div>
                                            <div>
                                                <span
                                                    className={
                                                        statusStyles[app.status as ApplicationStatus] ??
                                                        'badge badge-sm bg-base-200 text-base-content'
                                                    }
                                                >
                                                    {app.status}
                                                </span>
                                            </div>
                                            <Link
                                                to={`/applications/${app._id}`}
                                                className="flex items-center justify-end gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                                            >
                                                Détails
                                                <ArrowRight className="h-4 w-4" />
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center justify-between px-4 py-3 text-sm text-base-content/70">
                                    <span>
                                        Showing {startIdx} to {endIdx} of {pagination?.total ?? 0} results
                                    </span>
                                    <div className="join">
                                        <button className="btn btn-sm join-item" disabled>
                                            Previous
                                        </button>
                                        <button className="btn btn-sm join-item" disabled>
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </div>
                            {totalPages > 0 && (
                                <p className="text-xs text-base-content/60">
                                    Page {pagination?.page ?? 1} / {totalPages}
                                </p>
                            )}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
