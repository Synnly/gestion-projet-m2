import { NavLink } from 'react-router';
import ListContainer from '../../../components/ui/list/ListContainer';
import { useFetchInternships } from '../../../hooks/useFetchInternships';
import { useInternshipStore, type InternshipStore } from '../../../store/useInternshipStore';
import type { Internship } from '../../../types/internship.types';

export function DashboardInternshipList() {
    const { isLoading, isError, error } = useFetchInternships();
    const internships: Internship[] = useInternshipStore((state: InternshipStore) => state.internships);
    console.log(internships);
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
    if (isError) {
        return (
            <ListContainer>
                <div className="flex min-h-[200px] items-center justify-center">
                    <div className="text-center">
                        <p className="text-sm text-base-content/60">Une errur est survenu</p>
                    </div>
                </div>
            </ListContainer>
        );
    }
    if (internships.length === 0) {
        return (
            <ListContainer>
                <div className="flex min-h-[200px] items-center justify-center">
                    <div className="text-center">
                        <p className="text-sm text-base-content/60">
                            Vous n'avez postez aucune annonces cliquez
                            <NavLink to="/company/offers/add" className="text-primary ml-1">
                                ici
                            </NavLink>{' '}
                            pour en ajouter une.
                        </p>
                    </div>
                </div>
            </ListContainer>
        );
    }
    return (
        <ListContainer>
            <div className="flex min-h-[200px] items-center justify-center">
                <div className="text-center">
                    {internships.map((internship) => (
                        <div
                            key={internship._id}
                            className="p-4 border-b last:border-0 hover:bg-base-200 cursor-pointer rounded-lg"
                        >
                            <h2 className="text-lg font-semibold">{internship.title}</h2>
                            <p className="text-sm text-base-content/70">{internship.title}</p>
                            <p className="text-sm text-base-content/70">{internship.createdAt}</p>
                        </div>
                    ))}
                </div>
            </div>
        </ListContainer>
    );
}
