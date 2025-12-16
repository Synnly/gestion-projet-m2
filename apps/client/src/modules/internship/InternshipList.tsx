import React, { useEffect } from 'react';
import InternshipCard from './InternshipCard';
import ListContainer from '../../components/ui/list/ListContainer';
import { useInternshipStore } from '../../store/useInternshipStore';
import { useFetchInternships } from '../../hooks/useFetchInternships';
import InternshipPagination from './InternshipPagination';

const InternshipList: React.FC = () => {
    const { isLoading, isError, error } = useFetchInternships();
    const internships = useInternshipStore((state) => state.internships);
    const selectedInternshipId = useInternshipStore((state) => state.selectedInternshipId);
    const resetFilters = useInternshipStore((state) => state.resetFilters);
    useEffect(() => {
        resetFilters();
    }, [resetFilters]);
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
                    <p className="text-sm text-base-content/60">Aucune offre de stage trouvée</p>
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
