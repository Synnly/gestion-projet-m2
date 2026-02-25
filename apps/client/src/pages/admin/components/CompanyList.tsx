import { useState, useEffect, useCallback, useRef } from 'react';
import { UseAuthFetch } from '../../../hooks/useAuthFetch.tsx';
import { toast } from 'react-toastify';
import { deleteAllCompanies, deleteCompany, fetchCompanies } from '../../../apis/company.ts';
import Pagination from '../../common/ui/pagination/Pagination.tsx';
import { Clock, Trash2, UserCheck, UserX, X } from 'lucide-react';
import type { companyProfile } from '../../../types/CompanyProfile.types.ts';
import { DeleteAllCompaniesModal } from './modals/manageCompanies/DeleteAllCompaniesModal.tsx';
import { DeleteMultipleCompaniesModal } from './modals/manageCompanies/DeleteMultipleCompaniesModal.tsx';

export const CompanyList = () => {
    const [companies, setCompanies] = useState<companyProfile[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [companyToDelete, setCompanyToDelete] = useState<companyProfile | null>(null);
    const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
    const [isDeleteMultipleModalOpen, setIsDeleteMultipleModalOpen] = useState(false);
    const [companiesToDelete, setCompaniesToDelete] = useState<companyProfile[]>([]);

    const itemsPerPage = 10;
    const authFetch = UseAuthFetch();
    const checkboxRefs = useRef<Map<string, HTMLInputElement>>(new Map());

    const loadCompanies = useCallback(
        async (page: number = 1) => {
            setIsLoading(true);
            try {
                const data = await fetchCompanies(authFetch, page, itemsPerPage);
                setCompanies(data.data);
                setTotalPages(data.totalPages);
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

    const handleDeleteMultipleConfirm = async () => {
        let tempCompaniesToDelete;
        if (companyToDelete) {
            tempCompaniesToDelete = [companyToDelete];
        } else if (companiesToDelete.length > 0) {
            tempCompaniesToDelete = companiesToDelete;
        } else return;

        let nbErrors = 0;
        let companiesDeleted: companyProfile[] = [];
        for (const company of tempCompaniesToDelete) {
            try {
                await deleteCompany(authFetch, company._id);
                companiesDeleted.push(company);
            } catch (error) {
                console.error(error);
                nbErrors++;
            }
        }
        if (companyToDelete) setCompanyToDelete(null);

        const updatedCompanies: companyProfile[] = companies.map((company) =>
            companiesDeleted.some((s) => s._id === company._id)
                ? { ...company, deletedAt: new Date().toISOString() }
                : company,
        );

        const updatedCompaniesToDelete = companiesToDelete.filter(
            (s) => !companiesDeleted.some((deleted) => deleted._id === s._id),
        );
        setCompanies(updatedCompanies);
        setCompaniesToDelete(updatedCompaniesToDelete);

        if (nbErrors === 0) {
            toast.success(`Tous les comptes sélectionnés désactivés. Suppression dans 30 jours.`);
        } else {
            toast.warning(
                `${tempCompaniesToDelete.length - nbErrors} compte(s) désactivé(s) avec succès, mais ${nbErrors} compte(s) n'ont pas pu être supprimé(s). Veuillez réessayer pour les comptes restants.`,
            );
        }
        setIsDeleteMultipleModalOpen(false);
    };

    const handleDeleteAllConfirm = async () => {
        try {
            await deleteAllCompanies(authFetch);
            const updatedCompanies: companyProfile[] = companies.map((student) => ({
                ...student,
                deletedAt: new Date().toISOString(),
            }));
            setCompanies(updatedCompanies);
            toast.success(`Tous les comptes entreprise désactivés. Suppression dans 30 jours.`);
            setIsDeleteAllModalOpen(false);
        } catch (error) {
            console.error(error);
            toast.error('Erreur technique');
        }
        clearSelectedCompanies();
    };

    const clearSelectedCompanies = () => {
        setCompaniesToDelete([]);
        checkboxRefs.current.forEach((checkbox) => {
            checkbox.checked = false;
        });
    };

    const handleCompanySelect = (company: companyProfile) => {
        if (companiesToDelete.some((s) => s._id === company._id)) {
            setCompaniesToDelete(companiesToDelete.filter((s) => s._id !== company._id));
        } else {
            setCompaniesToDelete([...companiesToDelete, company]);
        }
    };

    return (
        <div className="container p-6 mx-auto">
            <h1 className="text-3xl font-bold mb-6">Gérer les entreprises</h1>

            {isLoading ? (
                <div className="flex justify-center items-center py-12">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            ) : !companies || companies.length === 0 ? (
                <div className="text-center py-12 bg-base-200 rounded-lg">
                    <p className="text-lg">Aucune entreprise inscrite</p>
                </div>
            ) : (
                <div className="overflow-x-auto bg-base-100 rounded-lg shadow">
                    <table className="table table-zebra w-full">
                        <thead>
                            <tr>
                                <th className="w-0" />
                                <th className="w-0">Nom</th>
                                <th>Email</th>
                                <th>SIRET</th>
                                <th>Ville</th>
                                <th className="w-0 text-center">Statut</th>
                                <th className="w-0">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {companies.map((company) => {
                                const isScheduledForDeletion = !!company.deletedAt;
                                return (
                                    <tr key={company._id}>
                                        <td>
                                            {!isScheduledForDeletion && (
                                                <input
                                                    type="checkbox"
                                                    className="checkbox checkbox-sm"
                                                    ref={(el) => {
                                                        if (el) checkboxRefs.current.set(company._id, el);
                                                        else checkboxRefs.current.delete(company._id);
                                                    }}
                                                    onClick={() => handleCompanySelect(company)}
                                                />
                                            )}
                                        </td>
                                        <td className="font-semibold">{company.name}</td>
                                        <td>{company.email}</td>
                                        <td>{company.siretNumber || 'N/A'}</td>
                                        <td>{company.city || 'N/A'}</td>
                                        <td className="w-0 text-center" colSpan={isScheduledForDeletion ? 2 : 1}>
                                            {company.deletedAt ? (
                                                <span className="self-center badge badge-error w-max text-xs">
                                                    <UserX className="h-3 w-3" />
                                                    Désactivée
                                                </span>
                                            ) : company.isValid ? (
                                                <span className="badge badge-success w-max text-xs">
                                                    <UserCheck className="h-3 w-3" />
                                                    Actif
                                                </span>
                                            ) : company.rejected?.isRejected ? (
                                                <span className="badge badge-error w-max text-xs">
                                                    <X className="h-3 w-3" />
                                                    Rejetée
                                                </span>
                                            ) : (
                                                <span className="badge badge-warning w-max text-xs">
                                                    <Clock className="h-3 w-3" />
                                                    En attente
                                                </span>
                                            )}
                                        </td>
                                        {!isScheduledForDeletion && (
                                            <td className="w-0 py-0">
                                                <button
                                                    className="btn btn-sm btn-ghost text-error hover:bg-error/10"
                                                    onClick={() => {
                                                        setCompanyToDelete(company);
                                                    }}
                                                    title="Supprimer le compte"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
            {isDeleteAllModalOpen && (
                <DeleteAllCompaniesModal
                    onConfirm={handleDeleteAllConfirm}
                    onCancel={() => {
                        setIsDeleteAllModalOpen(false);
                    }}
                />
            )}
            {(isDeleteMultipleModalOpen || companyToDelete) && (
                <DeleteMultipleCompaniesModal
                    companies={companyToDelete ? [companyToDelete] : companiesToDelete}
                    onConfirm={handleDeleteMultipleConfirm}
                    onCancel={() => {
                        setIsDeleteMultipleModalOpen(false);
                        setCompanyToDelete(null);
                    }}
                />
            )}
            <div className="flex gap-4 mt-8">
                <button className="btn btn-error" disabled={isLoading} onClick={() => setIsDeleteAllModalOpen(true)}>
                    Supprimer toutes les entreprises
                </button>
                {companiesToDelete.length > 0 && (
                    <>
                        <button className="btn btn-secondary" onClick={clearSelectedCompanies}>
                            Tout désélectionner
                        </button>
                        <button className="btn btn-error" onClick={() => setIsDeleteMultipleModalOpen(true)}>
                            Supprimer {companiesToDelete.length} entreprise{companiesToDelete.length > 1 && 's'}
                        </button>
                    </>
                )}
            </div>

            <Pagination page={currentPage} totalPages={totalPages} onPageChange={(page) => handlePageChange(page)} />
        </div>
    );
};
