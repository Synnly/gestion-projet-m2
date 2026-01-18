import { useState, useEffect, useCallback } from 'react';
import { UseAuthFetch } from '../hooks/useAuthFetch';
import { toast } from 'react-toastify';
import { CheckCircle2, Eye, Loader2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import RejectCompanyModal from './RejectCompanyModal';
import ValidateCompanyModal from './ValidateCompanyModal';
import {
    fetchPendingCompanies,
    validateCompany as validateCompanyAPI,
    rejectCompany as rejectCompanyAPI,
    type Company,
} from '../api/company';

export default function ValidateCompanies() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [companyToReject, setCompanyToReject] = useState<Company | null>(null);
    const [companyToValidate, setCompanyToValidate] = useState<Company | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const itemsPerPage = 10;

    const authFetch = UseAuthFetch();

    const loadPendingCompanies = useCallback(async (page: number = 1) => {
        setIsLoading(true);
        try {
            const data = await fetchPendingCompanies(authFetch, page, itemsPerPage);
            setCompanies(data.data);
            setTotalPages(data.totalPages);
            setTotal(data.total);
            setCurrentPage(data.page);
        } catch (error) {
            toast.error('Erreur lors du chargement des entreprises en attente');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [authFetch]);

    useEffect(() => {
        loadPendingCompanies(currentPage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage]);

    const handleValidate = async (companyId: string) => {
        setActionLoading(companyId);
        try {
            await validateCompanyAPI(authFetch, companyId);
            toast.success('Entreprise validée avec succès');
            loadPendingCompanies(currentPage);
            setSelectedCompany(null);
            setCompanyToValidate(null);
        } catch (error) {
            toast.error("Erreur lors de la validation de l'entreprise");
            console.error(error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (companyId: string, rejectionReason: string) => {
        setActionLoading(companyId);
        try {
            await rejectCompanyAPI(authFetch, companyId, rejectionReason);
            toast.success('Entreprise rejetée');
            loadPendingCompanies(currentPage);
            setSelectedCompany(null);
            setCompanyToReject(null);
        } catch (error) {
            toast.error("Erreur lors du rejet de l'entreprise");
            console.error(error);
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Validation des Entreprises</h1>

            <div className="mb-4 text-sm text-gray-600">
                Total: <span className="font-semibold">{total}</span> entreprise(s) en attente de validation
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-12">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            ) : companies.length === 0 ? (
                <div className="text-center py-12 bg-base-200 rounded-lg">
                    <CheckCircle2 className="h-24 w-24 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg text-gray-600">Aucune entreprise en attente de validation</p>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto bg-base-100 rounded-lg shadow">
                        <table className="table table-zebra w-full">
                            <thead>
                                <tr>
                                    <th>Nom</th>
                                    <th>Email</th>
                                    <th>SIRET</th>
                                    <th>Ville</th>
                                    <th>Type</th>
                                    <th>Date d'inscription</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {companies.map((company) => (
                                    <tr key={company._id} className="hover">
                                        <td className="font-semibold">{company.name}</td>
                                        <td>{company.email}</td>
                                        <td>{company.siretNumber || '-'}</td>
                                        <td>
                                            {company.city && company.postalCode
                                                ? `${company.city} (${company.postalCode})`
                                                : company.city || '-'}
                                        </td>
                                        <td>
                                            <span className="badge badge-outline">{company.structureType || '-'}</span>
                                        </td>
                                        <td className="text-sm">{formatDate(company.createdAt)}</td>
                                        <td>
                                            <div className="flex gap-2">
                                                <button
                                                    className="btn btn-sm btn-ghost"
                                                    onClick={() => setSelectedCompany(company)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-success"
                                                    onClick={() => setCompanyToValidate(company)}
                                                    disabled={actionLoading === company._id}
                                                >
                                                    {actionLoading === company._id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        'Valider'
                                                    )}
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-error"
                                                    onClick={() => setCompanyToReject(company)}
                                                    disabled={actionLoading === company._id}
                                                >
                                                    {actionLoading === company._id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        'Rejeter'
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-6">
                            <button
                                className="btn btn-sm"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <span className="text-sm">
                                Page {currentPage} sur {totalPages}
                            </span>
                            <button
                                className="btn btn-sm"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </>
            )}

            {selectedCompany && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">Détails de l'entreprise</h3>
                            <button onClick={() => setSelectedCompany(null)} className="btn btn-sm btn-circle btn-ghost">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Nom</p>
                                <p className="font-semibold">{selectedCompany.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Email</p>
                                <p className="font-semibold">{selectedCompany.email}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">SIRET</p>
                                <p className="font-semibold">{selectedCompany.siretNumber || 'Non renseigné'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Type de structure</p>
                                <p className="font-semibold">{selectedCompany.structureType || 'Non renseigné'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Statut légal</p>
                                <p className="font-semibold">{selectedCompany.legalStatus || 'Non renseigné'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Ville</p>
                                <p className="font-semibold">{selectedCompany.city || 'Non renseigné'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Code postal</p>
                                <p className="font-semibold">{selectedCompany.postalCode || 'Non renseigné'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Date d'inscription</p>
                                <p className="font-semibold">{formatDate(selectedCompany.createdAt)}</p>
                            </div>
                            {selectedCompany.updatedAt && (
                                <div>
                                    <p className="text-sm text-gray-500">Dernière modification</p>
                                    <p className="font-semibold">{formatDate(selectedCompany.updatedAt)}</p>
                                </div>
                            )}
                            {selectedCompany.rejected?.isRejected && selectedCompany.rejected.rejectedAt && (
                                <div className="col-span-2">
                                    {selectedCompany.rejected.modifiedAt && 
                                     new Date(selectedCompany.rejected.modifiedAt) > new Date(selectedCompany.rejected.rejectedAt) ? (
                                        <div className="alert alert-success">
                                            <div>
                                                <p className="text-sm font-semibold">✓ Profil modifié après rejet - En attente de re-validation</p>
                                                <p className="text-xs">
                                                    Date de refus initial : {formatDate(selectedCompany.rejected.rejectedAt)}
                                                </p>
                                                <p className="text-xs">
                                                    Date de modification : {formatDate(selectedCompany.rejected.modifiedAt)}
                                                </p>
                                                {selectedCompany.rejected.rejectionReason && (
                                                    <p className="text-xs mt-1 whitespace-pre-line">
                                                        Raison du rejet précédent : {selectedCompany.rejected.rejectionReason}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="alert alert-warning">
                                            <div>
                                                <p className="text-sm font-semibold">Compte précédemment rejeté</p>
                                                <p className="text-xs">
                                                    Date de refus : {formatDate(selectedCompany.rejected.rejectedAt)}
                                                </p>
                                                {selectedCompany.rejected.rejectionReason && (
                                                    <p className="text-xs mt-1 whitespace-pre-line">
                                                        Raison : {selectedCompany.rejected.rejectionReason}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="modal-action">
                            <button
                                className="btn btn-success"
                                onClick={() => {
                                    setCompanyToValidate(selectedCompany);
                                    setSelectedCompany(null);
                                }}
                                disabled={actionLoading === selectedCompany._id}
                            >
                                {actionLoading === selectedCompany._id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    'Valider cette entreprise'
                                )}
                            </button>
                            <button
                                className="btn btn-error"
                                onClick={() => {
                                    setCompanyToReject(selectedCompany);
                                    setSelectedCompany(null);
                                }}
                                disabled={actionLoading === selectedCompany._id}
                            >
                                {actionLoading === selectedCompany._id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    'Rejeter'
                                )}
                            </button>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={() => setSelectedCompany(null)}></div>
                </div>
            )}

            {companyToValidate && (
                <ValidateCompanyModal
                    companyName={companyToValidate.name}
                    onValidate={() => handleValidate(companyToValidate._id)}
                    onCancel={() => setCompanyToValidate(null)}
                    isLoading={actionLoading === companyToValidate._id}
                />
            )}

            {companyToReject && (
                <RejectCompanyModal
                    companyName={companyToReject.name}
                    onReject={(rejectionReason) => handleReject(companyToReject._id, rejectionReason)}
                    onCancel={() => setCompanyToReject(null)}
                    isLoading={actionLoading === companyToReject._id}
                />
            )}
        </div>
    );
}
