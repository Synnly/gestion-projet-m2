import { NavLink } from 'react-router';
import ListContainer from '../../../components/ui/list/ListContainer';
import { useFetchInternships } from '../../../hooks/useFetchInternships';
import { useInternshipStore, type InternshipStore } from '../../../store/useInternshipStore';
import type { Internship } from '../../../types/internship.types';
import InternshipPagination from '../../../modules/internship/InternshipPagination';
import { SearchBar } from '../../../components/inputs/searchBar';
import { TableRow } from './component/tableRow';
import { useEffect } from 'react';
import { useFetchCompanyInternships } from '../../../hooks/useFetchCompanyInternship';
import { companyPostStore } from '../../../store/companyInternshipStore';
import { CompanyInternshipsPagination } from './component/paginationCompanyInternship';

export function DashboardInternshipList() {
    const { isLoading, isError, error } = useFetchCompanyInternships();
    const internships: Internship[] = companyPostStore((state) => state.internships);
    const selects = [
        { label: 'Localisation', options: ['À distance', 'Sur site', 'Hybride'] },
        { label: 'Type de stage', options: ['Temps plein', 'Temps partiel', 'Contrat'] },
        { label: 'Secteur', options: ['Tech', 'Finance', 'Santé'] },
        { label: 'Date de publication', options: ['Moins de 24 heures', "Moins d'une semaine", 'Moins de 30 jours'] },
    ];
    const filters = companyPostStore((state) => state.filters);
    const setFilters = companyPostStore((state) => state.setFilters);
    const resetFilters = companyPostStore((state) => state.resetFilters);
    const handleSearchChange = (query: string) => {
        setFilters({ searchQuery: query || undefined, page: 1 });
    };
    useEffect(() => {
        resetFilters();
    }, [resetFilters]);
    if (isLoading) {
        return (
            <>
                <SearchBar
                    searchQuery={filters.searchQuery || ''}
                    setSearchQuery={handleSearchChange}
                    selects={selects}
                />
                <ListContainer>
                    <div className="flex min-h-[200px] items-center justify-center">
                        <div className="text-center">
                            <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
                            <p className="text-sm text-base-content/60">Chargement...</p>
                        </div>
                    </div>
                </ListContainer>
            </>
        );
    }
    if (isError) {
        return (
            <>
                <SearchBar
                    searchQuery={filters.searchQuery || ''}
                    setSearchQuery={handleSearchChange}
                    selects={selects}
                />
                <ListContainer>
                    <div className="flex min-h-[200px] items-center justify-center">
                        <div className="text-center">
                            <p className="text-sm text-base-content/60">Une erreur est survenu {error.message}</p>
                        </div>
                    </div>
                </ListContainer>
            </>
        );
    }
    if (internships.length === 0) {
        return (
            <>
                <SearchBar
                    searchQuery={filters.searchQuery || ''}
                    setSearchQuery={handleSearchChange}
                    selects={selects}
                />
                <div className="flex min-h-[200px] items-center justify-center">
                    <div className="text-center">
                        <p className="text-sm text-base-content/60">
                            {filters.searchQuery ? (
                                <>
                                    {"Vous n'avez posté aucune annonce, cliquez"}
                                    <NavLink to="/company/offers/add" className="text-primary ml-1">
                                        ici
                                    </NavLink>{' '}
                                    {'pour en ajouter une'}.
                                </>
                            ) : (
                                'Aucune annonce de stage trouvée.'
                            )}
                        </p>
                    </div>
                </div>
            </>
        );
    }
    return (
        <>
            <SearchBar searchQuery={filters.searchQuery || ''} setSearchQuery={handleSearchChange} selects={selects} />
            <table className="w-full text-left">
                <thead className="bg-base-200">
                    <tr>
                        <th className="px-4 py-3  text-sm  text-center font-bold">Titre de l'annonce</th>
                        <th className="px-4 py-3  text-sm  text-center font-bold">Candidats</th>
                        <th className="px-4 py-3  text-sm  text-center font-bold">Date de l'annonce</th>
                        <th className="px-4 py-3  text-sm  text-center font-bold">Visibilité</th>
                        <th className="px-4 py-3  text-sm  text-center font-bold">Actions</th>
                    </tr>
                </thead>

                <tbody>
                    {internships.map((internship, i) => (
                        <TableRow key={i} internship={internship} />
                    ))}
                </tbody>
            </table>
            <CompanyInternshipsPagination />
        </>
    );
}
