import React from 'react';
import InternshipCard from './InternshipCard';
import ListContainer from '../../components/ui/list/ListContainer';
import { useInternShipStore } from '../../store/useInternShipStore';
import { useFetchInternShips } from '../../hooks/useFetchInternShips';
import InternshipPagination from './InternshipPagination';

const InternshipList: React.FC = () => {
    const { isLoading, isError, error } = useFetchInternShips();
    const internships = useInternShipStore((state) => state.internships);
    const selectedInternshipId = useInternShipStore((state) => state.selectedInternshipId);
    const detailHeight = useInternShipStore((state) => state.detailHeight);

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

    const innerStyle: React.CSSProperties | undefined =
        typeof detailHeight === 'number' ? { maxHeight: `${detailHeight}px`, overflowY: 'auto' } : undefined;

    return (
        <ListContainer>
                <div style={innerStyle} className={detailHeight ? 'pr-6 overflow-y-auto space-y-3 p-3' : 'space-y-3 p-3'}>
                    {internships.map((internship) => (
                        <InternshipCard
                            key={internship._id}
                            internship={internship}
                            isSelected={internship._id === selectedInternshipId}
                        />
                    ))}

                    <div className="mt-2">
                        <InternshipPagination />
                    </div>
                </div>
            </ListContainer>
    );
};

export default InternshipList;
