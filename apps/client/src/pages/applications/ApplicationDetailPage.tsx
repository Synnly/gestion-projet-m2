import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Eye } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useFetchApplicationDetail } from '../../hooks/useFetchApplicationDetail';
import { type ApplicationStatus } from '../../store/useApplicationStore';
import { PdfModal } from '../../company/applicationList/component/PdfModal.tsx';
import { useState } from 'react';

const statusStyles: Record<ApplicationStatus | string, string> = {
    Pending: 'badge badge-sm bg-blue-100 text-blue-700 border-blue-200',
    Read: 'badge badge-sm bg-yellow-100 text-yellow-700 border-yellow-200',
    Accepted: 'badge badge-sm bg-green-100 text-green-700 border-green-200',
    Rejected: 'badge badge-sm bg-red-100 text-red-700 border-red-200',
};

const statusLabels: Record<ApplicationStatus, string> = {
    Pending: 'En attente',
    Read: 'Lue',
    Accepted: 'Acceptée',
    Rejected: 'Refusée',
};

export default function ApplicationDetailPage() {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState<{ id: string; type: 'cv' | 'lm' } | null>(null);
    const { applicationId } = useParams();
    const { data, isLoading, error } = useFetchApplicationDetail(applicationId);

    function previewFile(id: string, type: 'cv' | 'lm') {
        setSelectedApplication({ id, type });
        setModalOpen(true);
    }

    return (
        <div className="w-full flex justify-center px-4 md:px-8 py-8">
            <div className="w-full max-w-5xl space-y-6">
                <div className="breadcrumbs text-sm text-base-content/60">
                    <ul>
                        <li>
                            <Link to="/" className="inline-flex items-center gap-1">
                                <ArrowLeft className="h-3 w-3" />
                                Accueil
                            </Link>
                        </li>
                        <li>
                            <Link to="/applications">Mes candidatures</Link>
                        </li>
                        <li>{data?.post?.title ?? applicationId}</li>
                    </ul>
                </div>

                {isLoading && (
                    <div className="card bg-base-100 shadow-sm p-6">
                        <p className="text-sm text-base-content/70">Chargement de la candidature...</p>
                    </div>
                )}

                {error && (
                    <div className="card bg-base-100 shadow-sm p-6">
                        <p className="text-sm text-error">{error.message}</p>
                        <div className="mt-3">
                            <Link to="/applications" className="btn btn-ghost btn-sm">
                                Retour
                            </Link>
                        </div>
                    </div>
                )}

                {data && (
                    <>
                        <header className="bg-base-100 rounded-xl shadow-sm p-6 space-y-3">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-base-content">{data.post?.title}</h1>
                                    <p className="text-sm text-base-content/70">
                                        {data.post?.company?.name ?? 'Entreprise'}
                                    </p>
                                    <p className="text-sm text-base-content/60">
                                        {[data.post?.type, data.post?.duration].filter(Boolean).join(' - ')}
                                    </p>
                                </div>
                                <span
                                    className={
                                        statusStyles[data.status] ?? 'badge badge-sm bg-base-200 text-base-content'
                                    }
                                >
                                    {statusLabels[data.status as ApplicationStatus] ?? data.status}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-base-content/70">
                                <div>
                                    <span className="font-semibold text-base-content">Type :</span>{' '}
                                    {data.post?.type ?? '-'}
                                </div>
                                <div>
                                    <span className="font-semibold text-base-content">Adresse :</span>{' '}
                                    {data.post?.adress ?? '-'}
                                </div>
                            </div>
                        </header>

                        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-4">
                                <div className="card bg-base-100 shadow-sm">
                                    <div className="card-body space-y-2">
                                        <h2 className="card-title text-base-content">Description du poste</h2>
                                        <div className="wmde-markdown wmde-markdown-color bg-transparent! text-base-content!">
                                            <ReactMarkdown>
                                                {data.post?.description ?? 'Aucune description'}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="card bg-base-100 shadow-sm">
                                    <div className="card-body space-y-3">
                                        <h2 className="card-title text-base-content text-lg">Documents</h2>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-base-content/80">CV</span>
                                            <button
                                                className="btn btn-ghost btn-xs"
                                                onClick={() => previewFile(data._id, 'cv')}
                                            >
                                                <Eye />
                                            </button>
                                        </div>
                                        {data.coverLetter && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-base-content/80">Lettre de motivation</span>
                                                <button
                                                    className="btn btn-ghost btn-xs"
                                                    onClick={() => previewFile(data._id, 'lm')}
                                                >
                                                    <Eye />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        <div className="flex justify-start">
                            <Link to="/applications" className="btn btn-ghost btn-sm inline-flex items-center gap-2">
                                <ArrowLeft className="h-4 w-4" /> Retour aux candidatures
                            </Link>
                        </div>
                    </>
                )}
            </div>
            {modalOpen && (
                <PdfModal
                    selectedApplication={selectedApplication}
                    onClose={() => {
                        setModalOpen(false);
                    }}
                />
            )}
        </div>
    );
}
