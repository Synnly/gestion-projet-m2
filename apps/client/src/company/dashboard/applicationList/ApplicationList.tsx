import { useParams } from 'react-router';
import { ApplicationTable } from './component/ApplicationTable.tsx';
import { useFetchApplications } from '../../../hooks/useFetchApplications.ts';
import { useApplicationStore } from '../../../store/applicationStore.ts';
import { useQuery } from '@tanstack/react-query';
import { fetchInternshipById } from '../../../hooks/useFetchInternships.ts';

export const ApplicationList = () => {
    const postId = useParams().postId as string;
    const {} = useFetchApplications(postId);
    const query = useQuery({
        queryKey: ['internship', postId],
        queryFn: () => fetchInternshipById(postId),
        enabled: true,
    });
    const applications = useApplicationStore((state) => state.applications);

    const rejected = applications.filter((a) => a.status === 'REJECTED');
    const accepted = applications.filter((a) => a.status === 'ACCEPTED');
    const pending = applications.filter((a) => a.status === 'PENDING');

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {!query.isLoading && (
                <div className="flex flex-col h-full">
                    <div className="flex-none flex justify-between p-4">
                        <div className="flex flex-row gap-2">
                            <div className="font-bold">Titre</div>
                            <div>{query.data?.title}</div>
                        </div>
                        {query.data?.keySkills && query.data?.keySkills.length > 0 && (
                            <div className="flex gap-5">
                                <h5 className="font-bold text-base-content">Compétences</h5>
                                <div className="flex flex-wrap gap-2">
                                    {query.data?.keySkills.map((skill, index) => (
                                        <span key={index} className="badge badge-outline">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {query.data?.startDate && (
                            <div className="flex gap-5">
                                <h5 className="font-bold text-base-content">Date de début</h5>
                                <p>{new Date(query.data?.startDate).toLocaleDateString('fr-FR')}</p>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 flex flex-col gap-6 p-6 pt-0 min-h-0 overflow-hidden">
                        <ApplicationTable
                            mockedApplications={pending}
                            title="Candidatures en attente"
                            defaultOpened={true}
                        />
                        <ApplicationTable mockedApplications={accepted} title="Candidatures acceptées" />
                        <ApplicationTable mockedApplications={rejected} title="Candidatures refusées" />
                    </div>
                </div>
            )}
        </div>
    );
};
