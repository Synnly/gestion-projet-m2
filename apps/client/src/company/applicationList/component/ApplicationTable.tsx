import { useEffect, useState } from 'react';
import { ChevronUp, Eye, SquareArrowOutUpRight, Check, X } from 'lucide-react';
import { PdfModal } from './PdfModal.tsx';
import { ApplicationPagination } from './ApplicationPagination.tsx';
import {
    type Application,
    type ApplicationFilters,
    type ApplicationStatus,
    ApplicationStatusEnum,
} from '../../../types/application.types.ts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { PaginationResult } from '../../../types/internship.types.ts';
import { useParams } from 'react-router';
import { fetchApplicationsByPost } from '../../../hooks/useFetchApplications.tsx';
import { UseAuthFetch } from '../../../hooks/useAuthFetch.tsx';

const API_URL = import.meta.env.VITE_APIURL;

interface Props {
    status: ApplicationStatus;
    title: string;
    activeTab: ApplicationStatus | null;
    setActiveTab: (tab: ApplicationStatus | null) => void;
}

export const formatDate = (timeStamp: string) => {
    const date = new Date(timeStamp);
    return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

export const ApplicationTable = ({ status, title, activeTab, setActiveTab }: Props) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState<{ id: string; type: 'cv' | 'lm' } | null>(null);
    const [filters, setFilters] = useState<ApplicationFilters>({ page: 1, limit: 5, status });
    const [paginationShown, setPaginationShown] = useState<PaginationResult<Application> | undefined>();
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
    const [confirmModal, setConfirmModal] = useState<{
        open: boolean;
        applicationId: string;
        newStatus: ApplicationStatus;
        studentName: string;
    } | null>(null);

    const postId = useParams().id as string;
    const authFetch = UseAuthFetch();
    const queryClient = useQueryClient();
    const { data: applicationsData, isLoading } = useQuery<PaginationResult<Application>, Error>({
        queryKey: ['applications', postId, filters],
        queryFn: async () => {
            return await fetchApplicationsByPost(postId, filters);
        },
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 2,
    });

    function handlePageChange(newPage: number) {
        const maxPage = applicationsData?.totalPages ?? newPage;
        const target = Math.max(1, Math.min(newPage, maxPage));
        if (filters.page === target) return;
        setFilters((prev) => ({ ...prev, page: target }));
        if (paginationShown) setPaginationShown({ ...paginationShown, page: newPage });
    }

    function handleClickTable() {
        setActiveTab(activeTab === status ? null : status);
    }

    function openConfirmModal(applicationId: string, newStatus: ApplicationStatus, studentName: string) {
        setConfirmModal({ open: true, applicationId, newStatus, studentName });
    }

    function closeConfirmModal() {
        setConfirmModal(null);
    }

    async function updateApplicationStatus(applicationId: string, newStatus: ApplicationStatus) {
        if (updatingStatus) return;
        setUpdatingStatus(applicationId);

        try {
            const res = await authFetch(`${API_URL}/api/application/${applicationId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                data: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) {
                console.error('Échec mise à jour statut candidature:', await res.text());
                alert('Erreur lors de la mise à jour du statut');
                return;
            }

            // Invalidate all application queries for this post to refresh all tabs
            await queryClient.invalidateQueries({ queryKey: ['applications', postId] });
            closeConfirmModal();
        } catch (err) {
            console.error('Erreur lors de la mise à jour du statut:', err);
            alert('Erreur lors de la mise à jour du statut');
        } finally {
            setUpdatingStatus(null);
        }
    }

    async function handleConfirmStatusChange() {
        if (!confirmModal) return;
        await updateApplicationStatus(confirmModal.applicationId, confirmModal.newStatus);
    }

    function previewFile(id: string, type: 'cv' | 'lm') {
        setSelectedApplication({ id, type });
        setModalOpen(true);

        (async () => {
            try {
                if (status !== ApplicationStatusEnum.PENDING) return;

                const res = await authFetch(`${API_URL}/api/application/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    data: JSON.stringify({ status: 'Read' }),
                });

                if (!res.ok) {
                    console.error('Échec mise à jour statut candidature:', await res.text());
                    return;
                }
            } catch (err) {
                console.error('Erreur lors de la requête PUT /api/application/:id', err);
            }
        })();
    }

    useEffect(() => {
        if (applicationsData) setPaginationShown(applicationsData);
    }, [applicationsData]);

    const isActive = activeTab === status;

    return (
        <div
            className={`card h-fit bg-base-100 shadow-xl shadow-base-300 overflow-hidden m-1 p-3 transition-[flex] duration-500 ease-in-out`}
        >
            <>
                <div className="flex-none p-4 border-base-200 z-20 bg-base-100 flex justify-between items-center">
                    <div className="card-title text-lg select-none">
                        {title}
                        {applicationsData?.data && applicationsData.data.length > 0 && (
                            <span className="badge badge-sm badge-ghost ml-2 font-normal">
                                {applicationsData.data.length}
                            </span>
                        )}
                    </div>

                    <div
                        className={`transition-opacity duration-300 ${!isActive ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                    >
                        <ApplicationPagination pagination={paginationShown} handlePageChange={handlePageChange} />
                    </div>

                    <div onClick={() => handleClickTable()} className="btn btn-square btn-ghost cursor-pointer">
                        <ChevronUp
                            strokeWidth={2}
                            stroke="currentColor"
                            className={`w-5 h-5 transition-transform duration-500 ease-out ${isActive ? 'rotate-0' : 'rotate-180'}`}
                        />
                    </div>
                </div>

                <div
                    className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${
                        isActive ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    }`}
                >
                    <div className="overflow-hidden min-h-0">
                        <div className="bg-base-100 pt-2">
                            {isLoading || !applicationsData ? (
                                <div className="flex justify-center items-center p-10">
                                    <span className="loading loading-spinner loading-xl"></span>
                                </div>
                            ) : (
                                <div className="overflow-y-auto">
                                    <table className="table table-pin-rows table-zebra">
                                        <thead>
                                            <tr className="bg-base-100">
                                                <th>Profil</th>
                                                <th>Prénom</th>
                                                <th>Nom</th>
                                                <th>Email</th>
                                                <th>Date</th>
                                                <th className="w-px whitespace-nowrap text-center">CV</th>
                                                <th className="w-px whitespace-nowrap text-center">
                                                    Lettre de motivation
                                                </th>
                                                <th className="w-px whitespace-nowrap text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {applicationsData.data.map((app: Application) => (
                                                <tr
                                                    key={app._id}
                                                    className="hover:bg-base-300 duration-300 ease-out transition-color"
                                                >
                                                    <td className="whitespace-nowrap text-center w-0">
                                                        <a
                                                            href={`/student/public/${app.student._id}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <SquareArrowOutUpRight strokeWidth={2} />
                                                        </a>
                                                    </td>
                                                    <td>{app.student.firstName}</td>
                                                    <td>{app.student.lastName}</td>
                                                    <td>{app.student.email}</td>
                                                    <td>{formatDate(app.createdAt)}</td>
                                                    <td className="whitespace-nowrap text-center">
                                                        {app.cv && (
                                                            <button
                                                                className="btn btn-sm btn-ghost"
                                                                onClick={() => previewFile(app._id, 'cv')}
                                                            >
                                                                <Eye strokeWidth={2} />
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td className="whitespace-nowrap text-center">
                                                        {app.coverLetter && (
                                                            <button
                                                                className="btn btn-sm btn-ghost"
                                                                onClick={() => previewFile(app._id, 'lm')}
                                                            >
                                                                <Eye strokeWidth={2} />
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td className="whitespace-nowrap text-center">
                                                        <div className="flex gap-1 justify-center">
                                                            {(status === ApplicationStatusEnum.PENDING || status === ApplicationStatusEnum.READ) && (
                                                                <>
                                                                    <button
                                                                        className="btn btn-sm btn-success btn-ghost"
                                                                        onClick={() => openConfirmModal(app._id, ApplicationStatusEnum.ACCEPTED, `${app.student.firstName} ${app.student.lastName}`)}
                                                                        disabled={updatingStatus === app._id}
                                                                        title="Accepter"
                                                                        aria-label="Accepter la candidature"
                                                                    >
                                                                        <Check strokeWidth={2} size={18} />
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-sm btn-error btn-ghost"
                                                                        onClick={() => openConfirmModal(app._id, ApplicationStatusEnum.REJECTED, `${app.student.firstName} ${app.student.lastName}`)}
                                                                        disabled={updatingStatus === app._id}
                                                                        title="Rejeter"
                                                                        aria-label="Rejeter la candidature"
                                                                    >
                                                                        <X strokeWidth={2} size={18} />
                                                                    </button>
                                                                </>
                                                            )}
                                                            {(status === ApplicationStatusEnum.ACCEPTED || status === ApplicationStatusEnum.REJECTED) && (
                                                                <span className="text-xs text-base-content/50 italic">Finalisé</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {applicationsData.data.length === 0 && (
                                        <div className="flex justify-center items-center h-20 text-base-content/50 italic">
                                            Aucune candidature
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {modalOpen && (
                    <PdfModal
                        selectedApplication={selectedApplication}
                        onClose={() => {
                            setModalOpen(false);
                        }}
                    />
                )}

                {confirmModal?.open && (
                    <div className="modal modal-open">
                        <div
                            className="modal-box"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="confirm-modal-title"
                        >
                            <h3 id="confirm-modal-title" className="font-bold text-lg mb-4">
                                Confirmation de {confirmModal.newStatus === ApplicationStatusEnum.ACCEPTED ? 'l\'acceptation' : 'le rejet'}
                            </h3>
                            <p className="py-4">
                                Voulez-vous vraiment {confirmModal.newStatus === ApplicationStatusEnum.ACCEPTED ? 'accepter' : 'rejeter'} la candidature de{' '}
                                <span className="font-semibold">{confirmModal.studentName}</span> ?
                            </p>
                            <p className="text-sm text-base-content/70 mb-6">
                                Cette action est définitive et ne pourra pas être annulée.
                            </p>
                            <div className="modal-action">
                                <button
                                    className="btn btn-ghost"
                                    onClick={closeConfirmModal}
                                    disabled={updatingStatus !== null}
                                >
                                    Annuler
                                </button>
                                <button
                                    className={`btn ${
                                        confirmModal.newStatus === ApplicationStatusEnum.ACCEPTED
                                            ? 'btn-success'
                                            : 'btn-error'
                                    }`}
                                    onClick={handleConfirmStatusChange}
                                    disabled={updatingStatus !== null}
                                >
                                    {updatingStatus !== null ? (
                                        <span className="loading loading-spinner loading-sm"></span>
                                    ) : (
                                        'Confirmer'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </>
        </div>
    );
};
