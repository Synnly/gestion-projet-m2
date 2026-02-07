import { useState, useEffect, useCallback } from 'react';
import { UseAuthFetch } from '../../../hooks/useAuthFetch';
import { toast } from 'react-toastify';
import {
    Download,
    Loader2,
    X,
    RefreshCw,
    Database,
    FileText,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
} from 'lucide-react';
import { ExportStatus, ExportFormat, type ExportListItem } from '../../../types/exportImportDB.types';
import { createExport, listExports, cancelExport, downloadExport } from '../../../apis/export';

export default function ExportDatabase() {
    const [exports, setExports] = useState<ExportListItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const authFetch = UseAuthFetch();

    const loadExports = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await listExports(authFetch);
            setExports(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } catch (error) {
            toast.error('Erreur lors du chargement des exports');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadExports();
    }, [loadExports]);

    const handleCreateExport = async () => {
        setIsCreating(true);
        try {
            const result = await createExport(authFetch, {
                format: ExportFormat.JSON,
            });
            if(result.message === "Export initiated. You will receive an email when the export is complete."){
                result.message = "Export initié. Vous recevrez un email lorsque l'export sera prêt.";
            }
            toast.success(result.message);
            loadExports();
        } catch (error) {
            toast.error("Erreur lors de la création de l'export");
            console.error(error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleCancelExport = async (exportId: string) => {
        setActionLoading(exportId);
        try {
            await cancelExport(authFetch, exportId);
            toast.success('Export annulé avec succès');
            loadExports();
        } catch (error) {
            toast.error("Erreur lors de l'annulation de l'export");
            console.error(error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDownloadExport = async (exportId: string) => {
        setActionLoading(exportId);
        try {
            await downloadExport(authFetch, exportId);
            toast.success('Téléchargement démarré');
        } catch (error) {
            toast.error('Erreur lors du téléchargement');
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

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return 'N/A';
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(2)} MB`;
    };

    const getStatusBadge = (status: ExportStatus) => {
        const statusConfig = {
            [ExportStatus.PENDING]: {
                color: 'badge-warning',
                icon: <Clock className="w-4 h-4" />,
                text: 'En attente',
            },
            [ExportStatus.IN_PROGRESS]: {
                color: 'badge-info',
                icon: <Loader2 className="w-4 h-4 animate-spin" />,
                text: 'En cours',
            },
            [ExportStatus.COMPLETED]: {
                color: 'badge-success',
                icon: <CheckCircle2 className="w-4 h-4" />,
                text: 'Terminé',
            },
            [ExportStatus.CANCELLED]: {
                color: 'badge-neutral',
                icon: <XCircle className="w-4 h-4" />,
                text: 'Annulé',
            },
            [ExportStatus.FAILED]: {
                color: 'badge-error',
                icon: <AlertCircle className="w-4 h-4" />,
                text: 'Échoué',
            },
        };

        const config = statusConfig[status];
        return (
            <div className={`badge ${config.color} gap-2 p-3`}>
                {config.icon}
                <span>{config.text}</span>
            </div>
        );
    };

    const canCancel = (status: ExportStatus) => {
        return status === ExportStatus.PENDING || status === ExportStatus.IN_PROGRESS;
    };

    const canDownload = (status: ExportStatus) => {
        return status === ExportStatus.COMPLETED;
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Export Base de Données</h1>

            <div className="card bg-base-200 shadow-xl mb-6">
                <div className="card-body">
                    <h2 className="card-title flex items-center gap-2">
                        <Database className="w-6 h-6" />
                        Créer un nouvel export
                    </h2>
                    <p className="text-sm text-gray-500 mb-4">
                        L'export sera effectué en arrière-plan. Vous recevrez un email lorsqu'il sera prêt.
                    </p>

                    <div className="card-actions justify-end">
                        <button className="btn btn-primary" onClick={handleCreateExport} disabled={isCreating}>
                            {isCreating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Création en cours...
                                </>
                            ) : (
                                <>
                                    <FileText className="w-4 h-4" />
                                    Créer l'export
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
            <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="card-title">Historique des exports</h2>
                        <button className="btn btn-ghost btn-sm gap-2" onClick={loadExports} disabled={isLoading}>
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                            Actualiser
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : exports.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Database className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p>Aucun export disponible</p>
                            <p className="text-sm">Créez votre premier export ci-dessus</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table table-zebra">
                                <thead>
                                    <tr>
                                        <th>Date de création</th>
                                        <th>Statut</th>
                                        <th>Collections</th>
                                        <th>Documents</th>
                                        <th>Taille</th>
                                        <th>Complété le</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {exports.map((exp) => (
                                        <tr key={exp.exportId}>
                                            <td>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{formatDate(exp.createdAt)}</span>
                                                </div>
                                            </td>
                                            <td>{getStatusBadge(exp.status)}</td>
                                            <td>
                                                <span className="font-mono">{exp.collectionsCount ?? '-'}</span>
                                            </td>
                                            <td>
                                                <span className="font-mono">
                                                    {exp.documentsCount?.toLocaleString() ?? '-'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="font-mono">{formatFileSize(exp.fileSize)}</span>
                                            </td>
                                            <td>
                                                {exp.completedAt ? (
                                                    <span className="text-sm">{formatDate(exp.completedAt)}</span>
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                            <td>
                                                <div className="flex gap-2">
                                                    {canDownload(exp.status) && (
                                                        <button
                                                            className="btn btn-success btn-sm gap-2"
                                                            onClick={() => handleDownloadExport(exp.exportId)}
                                                            disabled={actionLoading === exp.exportId}
                                                        >
                                                            {actionLoading === exp.exportId ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <Download className="w-4 h-4" />
                                                            )}
                                                            Télécharger
                                                        </button>
                                                    )}
                                                    {canCancel(exp.status) && (
                                                        <button
                                                            className="btn btn-error btn-sm gap-2"
                                                            onClick={() => handleCancelExport(exp.exportId)}
                                                            disabled={actionLoading === exp.exportId}
                                                        >
                                                            {actionLoading === exp.exportId ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <X className="w-4 h-4" />
                                                            )}
                                                            Annuler
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
            <div className="alert alert-info mt-6">
                <AlertCircle className="w-6 h-6" />
                <div>
                    <h3 className="font-bold">À propos des exports</h3>
                    <ul className="text-sm list-disc list-inside mt-2">
                        <li>Les exports sont créés en arrière-plan et peuvent prendre plusieurs minutes</li>
                        <li>Vous recevrez un email lorsque l'export sera prêt à être téléchargé</li>
                        <li>Les exports incluent toutes les collections de la base de données</li>
                        <li>Format: JSON</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
