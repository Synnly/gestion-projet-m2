import React, { useEffect, useMemo } from 'react';
import InternshipCard from './InternshipCard';

import InternshipPagination from './InternshipPagination';
import { useFetchInternships } from '../../../hooks/useFetchInternships';
import { useInternshipStore } from '../../../stores/useInternshipStore';
import ListContainer from '../../common/ui/list/ListContainer';
import { userStore } from '../../../stores/userStore';
import { useApplicationCounts } from '../../../hooks/useFetchApplications';

const InternshipList: React.FC = () => {
    const { isLoading, isError, error } = useFetchInternships();
    const internships = useInternshipStore((state) => state.internships);
    const selectedInternshipId = useInternshipStore((state) => state.selectedInternshipId);
    const resetFilters = useInternshipStore((state) => state.resetFilters);
    useEffect(() => {
        resetFilters();
    }, [resetFilters]);

    const access = userStore((s) => s.access);
    const getUser = userStore((s) => s.get);
    const user = getUser(access);
    const isCompany = user?.role === 'COMPANY';
    const companyId = isCompany ? user?.id : undefined;

    const { data: countsData } = useApplicationCounts(companyId);

    const countsMap = useMemo(() => {
        if (!countsData) return new Map();
        return new Map(countsData.map((c) => [c.postId, c]));
    }, [countsData]);

    // État de chargement
    if (isLoading) {
        return (
            <ListContainer>
                <div className="flex min-h-[200px] items-center justify-center">
                    <div className="text-center">
                        <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
                        <p className="text-sm text-base-content/60">Chargement...</p>
                    </div>
                </div>
            </ListContainer>
        );
    }

    // État d'erreur
    if (isError) {
        return (
            <ListContainer>
                <div className="flex min-h-[200px] items-center justify-center">
                    <div className="text-center">
                        <p className="text-sm text-error">Erreur: {error?.message || 'Une erreur est survenue'}</p>
                    </div>
                </div>
            </ListContainer>
        );
    }

    // Liste vide
    if (internships.length === 0) {
        return (
            <ListContainer>
                <div className="flex min-h-[200px] items-center justify-center">
                    <p className="text-sm text-base-content/60">Aucun stage trouvé</p>
                </div>
            </ListContainer>
        );
    }

    return (
        <>
            <ListContainer>
                <div className={'space-y-3 p-3 h-full overflow-y-auto'}>
                    {internships.map((internship) => (
                        <InternshipCard
                            key={internship._id}
                            internship={internship}
                            isSelected={internship._id === selectedInternshipId}
                            counts={isCompany ? countsMap.get(internship._id) : undefined}
                        />
                    ))}
                </div>
            </ListContainer>
            <div className="mt-2">
                <InternshipPagination />
            </div>
        </>
    );
};

export default InternshipList;
