import { useEffect, useState } from 'react';
import { ChevronUp, Eye } from 'lucide-react';
import { PdfModal } from './PdfModal';
import { ApplicationPagination } from './ApplicationPagination';
import {
    type Application,
    type ApplicationFilters,
    type ApplicationStatus,
    ApplicationStatusEnum,
} from '../../../../types/application.types';
import { useQuery } from '@tanstack/react-query';
import type { PaginationResult } from '../../../../types/internship.types';
import { useParams } from 'react-router';
import { fetchApplicationsByPost } from '../../../../hooks/useFetchApplications';
import { formatDate } from '../../intershipList/component/tableRow';
import { UseAuthFetch } from '../../../../hooks/useAuthFetch';

const API_URL = import.meta.env.VITE_APIURL;

interface Props {
    status: ApplicationStatus;
    title: string;
    activeTab: ApplicationStatus | null;
    setActiveTab: (tab: ApplicationStatus | null) => void;
}

export const ApplicationTable = ({ status, title, activeTab, setActiveTab }: Props) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState<{ id: string; type: 'cv' | 'lm' } | null>(null);
    const [filters, setFilters] = useState<ApplicationFilters>({ page: 1, limit: 5, status });
    const [paginationShown, setPaginationShown] = useState<PaginationResult<Application> | undefined>();

    const postId = useParams().postId as string;
    const authFetch = UseAuthFetch();
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
                                                <th>Prénom</th>
                                                <th>Nom</th>
                                                <th>Email</th>
                                                <th>Date</th>
                                                <th className="w-px whitespace-nowrap text-center">CV</th>
                                                <th className="w-px whitespace-nowrap text-center">
                                                    Lettre de motivation
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {applicationsData.data.map((app: Application) => (
                                                <tr
                                                    key={app._id}
                                                    className="hover:bg-base-300 duration-300 ease-out transition-color"
                                                >
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
            </>
        </div>
    );
};
