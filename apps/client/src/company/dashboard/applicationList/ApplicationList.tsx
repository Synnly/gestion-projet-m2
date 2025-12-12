import { useParams } from 'react-router';
import { ApplicationTable } from './component/ApplicationTable.tsx';
import { useQuery } from '@tanstack/react-query';
import { fetchInternshipById } from '../../../hooks/useFetchInternships.ts';
import { type ApplicationStatus, ApplicationStatusEnum } from '../../../types/application.types.ts';
import { useState } from 'react';

export const ApplicationList = () => {
    const postId = useParams().postId as string;
    const [activeTab, setActiveTab] = useState<ApplicationStatus | null>(ApplicationStatusEnum.PENDING);

    // Fetch internship details using React Query
    const query = useQuery({
        queryKey: ['internship', postId],
        queryFn: () => fetchInternshipById(postId),
        enabled: true,
    });

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {!query.isLoading && (
                <div className="flex flex-col h-full">
                    <div className="flex-none flex justify-evenly p-4">
                        <div className="flex flex-row gap-2">
                            <div className="font-bold">Titre</div>
                            <div>{query.data?.title}</div>
                        </div>
                        <div className="flex gap-5">
                            <h5 className="font-bold text-base-content">Adresse</h5>
                            <div className="flex flex-wrap gap-2">
                                <span>{query.data?.adress}</span>
                            </div>
                        </div>
                        {query.data?.startDate && (
                            <div className="flex gap-5">
                                <h5 className="font-bold text-base-content">Date de début</h5>
                                <p>{new Date(query.data?.startDate).toLocaleDateString('fr-FR')}</p>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 flex flex-col gap-6 p-6 pt-0 min-h-0 overflow-hidden">
                        <ApplicationTable
                            status={ApplicationStatusEnum.PENDING}
                            title="Candidatures en attente"
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                        />
                        <ApplicationTable
                            status={ApplicationStatusEnum.ACCEPTED}
                            title="Candidatures acceptées"
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                        />
                        <ApplicationTable
                            status={ApplicationStatusEnum.REJECTED}
                            title="Candidatures refusées"
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
