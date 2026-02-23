import { useState, useEffect, useCallback } from 'react';
import { UseAuthFetch } from '../../../hooks/useAuthFetch.tsx';
import { toast } from 'react-toastify';
import { fetchCompanies } from '../../../apis/company.ts';
import type { Company } from '../../../apis/company.ts';
import Pagination from '../../common/ui/pagination/Pagination.tsx';

export const CompanyList = () => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const itemsPerPage = 10;

    const authFetch = UseAuthFetch();

    const loadCompanies = useCallback(
        async (page: number = 1) => {
            setIsLoading(true);
            try {
                const data = await fetchCompanies(authFetch, page, itemsPerPage);
                setCompanies(data.data);
                setTotalPages(data.totalPages);
                setTotal(data.total);
            } catch (error) {
                toast.error('Erreur lors du chargement des entreprises');
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        },
        [authFetch],
    );

    useEffect(() => {
        loadCompanies(currentPage);
    }, [currentPage]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold mb-6">Gérer les entreprises</h1>

            <div className="mb-4 text-sm">
                Total: <span className="font-semibold">{total}</span> entreprise(s) inscrite(s)
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-12">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            ) : companies.length === 0 ? (
                <div className="text-center py-12 bg-base-200 rounded-lg">
                    <p className="text-lg">Aucune entreprise inscrite</p>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto bg-base-100 rounded-lg shadow">
                        <table className="table w-full">
                            <thead>
                                <tr>
                                    <th>Nom</th>
                                    <th>Email</th>
                                    <th>SIRET</th>
                                    <th>Ville</th>
                                    <th>Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {companies.map((company) => {
                                    return (
                                        <tr key={company._id} className="hover:bg-base-200 duration-100 ease-in-out">
                                            <td className="font-semibold">{company.name}</td>
                                            <td>{company.email}</td>
                                            <td>{company.siretNumber || 'N/A'}</td>
                                            <td>{company.city || 'N/A'}</td>
                                            <td>
                                                {company.isValid ? (
                                                    <span className="badge badge-success">Validée</span>
                                                ) : company.rejected?.isRejected ? (
                                                    <span className="badge badge-error">Rejetée</span>
                                                ) : (
                                                    <span className="badge badge-warning">En attente</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <Pagination
                        page={currentPage}
                        totalPages={totalPages}
                        onPageChange={(page) => handlePageChange(page)}
                    />
                </>
            )}

            <div className="mt-8">
                <button className="btn btn-error" disabled>
                    Supprimer toutes les entreprises (Non implémenté)
                </button>
            </div>
        </div>
    );
};
