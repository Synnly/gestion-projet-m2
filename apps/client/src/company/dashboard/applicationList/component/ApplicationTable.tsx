import { useState, useEffect } from 'react';
import { ChevronUp, Eye } from 'lucide-react';
import { PdfModal } from './PdfModal.tsx';
import { ApplicationPagination } from './ApplicationPagination.tsx';
import type { Application, ApplicationFilters, ApplicationStatus } from '../../../../types/application.types.ts';
import { useQuery } from '@tanstack/react-query';
import type { PaginationResult } from '../../../../types/internship.types.ts';
import { useParams } from 'react-router';
import { fetchApplicationsByPost, useFetchFileSignedUrl } from '../../../../hooks/useFetchApplications.ts';

interface Props {
    status: ApplicationStatus;
    title: string;
    activeTab: ApplicationStatus | null;
    setActiveTab: (tab: ApplicationStatus | null) => void;
}

export const ApplicationTable = ({ status, title, activeTab, setActiveTab }: Props) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedApplication, setSelectedApplication] = useState<{ id: string; type: 'cv' | 'lm' } | null>(null);
    const [filters, setFilters] = useState<ApplicationFilters>({ page: 1, limit: 5, status });
    const postId = useParams().postId as string;

    // Use React Query to fetch applications with current filters
    const { data: applicationsData, isLoading } = useQuery<PaginationResult<Application>, Error>({
        queryKey: ['applications', filters],

        queryFn: async () => {
            return await fetchApplicationsByPost(postId, filters);
        },

        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 2,
    });

    // Use React Query to fetch and cache the signed URL
    const { data: signedUrl, isError: pubUrlIsError } = useFetchFileSignedUrl(
        selectedApplication?.id,
        selectedApplication?.type,
    );

    /**
     * Handle page change for pagination
     * @param newPage - The new page number to navigate to
     */
    function handlePageChange(newPage: number) {
        const maxPage = applicationsData?.totalPages ?? newPage;
        const target = Math.max(1, Math.min(newPage, maxPage));
        if (filters.page === target) return;
        setFilters((prev) => ({ ...prev, page: target }));
    }

    function handleClickTable() {
        setActiveTab(activeTab === status ? null : status);
    }

    useEffect(() => {
        if (signedUrl && selectedApplication) {
            setPreviewUrl(signedUrl);
        } else if (pubUrlIsError && selectedApplication) {
            console.error("Erreur lors de la récupération de l'URL signée:", selectedApplication);
        }
    }, [signedUrl, selectedApplication, pubUrlIsError]);

    return (
        <div
            className={`card bg-base-100 shadow-xl shadow-base-300 overflow-hidden m-1 p-3 transition-[flex] duration-500 ease-in-out ${
                activeTab === status ? 'flex-1 min-h-0' : 'flex-none'
            }`}
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

                    <div className={`${!(activeTab === status) ? 'hidden' : ''}`}>
                        {applicationsData?.data && (
                            <ApplicationPagination pagination={applicationsData} handlePageChange={handlePageChange} />
                        )}
                    </div>

                    <div onClick={() => handleClickTable()} className="btn btn-square btn-ghost cursor-pointer">
                        <ChevronUp
                            strokeWidth={2}
                            stroke="currentColor"
                            className={`w-5 h-5 transition-transform duration-300 ease-out ${activeTab === status ? 'rotate-0' : 'rotate-180'}`}
                        />
                    </div>
                </div>
                {isLoading || !applicationsData ? (
                    <div className={`flex justify-center items-center flex-1 ${!(activeTab === status) && 'hidden'}`}>
                        <span className="loading loading-spinner loading-xl"></span>
                    </div>
                ) : (
                    <div
                        className={`flex-1 overflow-y-auto min-h-0 bg-base-100 ${!(activeTab === status) && 'hidden'}`}
                    >
                        <table className="table table-pin-rows table-zebra">
                            <thead>
                                <tr className="bg-base-100">
                                    <th>Prénom</th>
                                    <th>Nom</th>
                                    <th>Email</th>
                                    <th className="w-px whitespace-nowrap text-center">CV</th>
                                    <th className="w-px whitespace-nowrap text-center">Lettre de motivation</th>
                                </tr>
                            </thead>
                            <tbody>
                                {applicationsData.data.map((app: any) => (
                                    <tr
                                        key={app._id}
                                        className="hover:bg-base-300 duration-300 ease-out transition-color"
                                    >
                                        <td>{app.student.firstName}</td>
                                        <td>{app.student.lastName}</td>
                                        <td>{app.student.email}</td>
                                        <td className="whitespace-nowrap text-center">
                                            {app.cv && (
                                                <button
                                                    className="btn btn-sm btn-ghost"
                                                    onClick={() => setSelectedApplication({ id: app._id, type: 'cv' })}
                                                >
                                                    <Eye strokeWidth={2} />
                                                </button>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap text-center">
                                            {app.coverLetter && (
                                                <button
                                                    className="btn btn-sm btn-ghost"
                                                    onClick={() => setSelectedApplication({ id: app._id, type: 'lm' })}
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

                {previewUrl && (
                    <PdfModal
                        url={previewUrl}
                        onClose={() => {
                            setPreviewUrl(null);
                            setSelectedApplication(null);
                        }}
                    />
                )}
            </>
        </div>
    );
};
