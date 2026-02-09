import { useState, useEffect, useCallback, useRef } from 'react';
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
    Upload,
    Trash2,
} from 'lucide-react';
import {
    ExportStatus,
    ExportFormat,
    ImportStatus,
    type ExportListItem,
    type ImportListItem,
} from '../../../types/exportImportDB.types';
import { createExport, listExports, cancelExport, downloadExport } from '../../../apis/export';
import { createImport, listImports, cancelImport } from '../../../apis/import';

export default function ExportDatabase() {
    const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
    const [exports, setExports] = useState<ExportListItem[]>([]);
    const [imports, setImports] = useState<ImportListItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [clearExisting, setClearExisting] = useState(false);
    const [showWarningModal, setShowWarningModal] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
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

    const loadImports = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await listImports(authFetch);
            setImports(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } catch (error) {
            toast.error('Erreur lors du chargement des imports');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'export') {
            loadExports();
        } else {
            loadImports();
        }
    }, [activeTab, loadExports, loadImports]);

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

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        // Validate file type
        const validExtensions = ['.json', '.gz'];
        const hasValidExtension = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

        if (!hasValidExtension) {
            toast.error('Type de fichier invalide. Seuls les fichiers .json et .json.gz sont acceptés.');
            return;
        }

        // Validate file size (500MB limit)
        const maxSize = 500 * 1024 * 1024; // 500MB in bytes
        if (file.size > maxSize) {
            toast.error('Le fichier est trop volumineux. Taille maximale: 500 MB');
            return;
        }

        setSelectedFile(file);
    };

    const handleCreateImport = async () => {
        if (!selectedFile) {
            toast.error('Veuillez sélectionner un fichier');
            return;
        }

        if (clearExisting && !showWarningModal) {
            setShowWarningModal(true);
            return;
        }

        setIsCreating(true);
        try {
            const result = await createImport(authFetch, selectedFile, { clearExisting });
            if (result.message === 'Import initiated. You will receive an email when the import is complete.') {
                result.message = "Import initié. Vous recevrez un email lorsque l'import sera terminé.";
            }
            toast.success(result.message);
            setSelectedFile(null);
            setClearExisting(false);
            setShowWarningModal(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            loadImports();
        } catch (error) {
            toast.error("Erreur lors de la création de l'import");
            console.error(error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleCancelImport = async (importId: string) => {
        setActionLoading(importId);
        try {
            await cancelImport(authFetch, importId);
            toast.success('Import annulé avec succès');
            loadImports();
        } catch (error) {
            toast.error("Erreur lors de l'annulation de l'import");
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

    const getStatusBadge = (status: ExportStatus | ImportStatus) => {
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

    const canCancel = (status: ExportStatus | ImportStatus) => {
        return status === ExportStatus.PENDING || status === ExportStatus.IN_PROGRESS;
    };

    const canDownload = (status: ExportStatus) => {
        return status === ExportStatus.COMPLETED;
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Gestion de la Base de Données</h1>

            <div className="tabs tabs-boxed mb-6 w-fit">
                <button
                    className={`tab ${activeTab === 'export' ? 'tab-active' : ''}`}
                    onClick={() => setActiveTab('export')}
                >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                </button>
                <button
                    className={`tab ${activeTab === 'import' ? 'tab-active' : ''}`}
                    onClick={() => setActiveTab('import')}
                >
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                </button>
            </div>

            {activeTab === 'export' && (
                <>
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
                                <button
                                    className="btn btn-ghost btn-sm gap-2"
                                    onClick={loadExports}
                                    disabled={isLoading}
                                >
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
                                                            <span className="font-medium">
                                                                {formatDate(exp.createdAt)}
                                                            </span>
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
                </>
            )}

            {activeTab === 'import' && (
                <>
                    <div className="card bg-base-200 shadow-xl mb-6">
                        <div className="card-body">
                            <h2 className="card-title flex items-center gap-2">
                                <Upload className="w-6 h-6" />
                                Importer une base de données
                            </h2>
                            <p className="text-sm text-gray-500 mb-4">
                                L'import sera effectué en arrière-plan. Vous recevrez un email lorsqu'il sera terminé.
                            </p>

                            <div className="form-control w-full mb-4">
                                <label className="label">
                                    <span className="label-text">Fichier d'import</span>
                                    <span className="label-text-alt text-gray-500">Max: 500 MB</span>
                                </label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="file-input file-input-bordered w-full"
                                    accept=".json,.gz,.json.gz"
                                    onChange={handleFileChange}
                                    disabled={isCreating}
                                />
                                {selectedFile && (
                                    <label className="label">
                                        <span className="label-text-alt text-success">
                                            Fichier sélectionné: {selectedFile.name} (
                                            {formatFileSize(selectedFile.size)})
                                        </span>
                                    </label>
                                )}
                            </div>

                            <div className="form-control">
                                <label className="label cursor-pointer justify-start gap-4">
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-warning"
                                        checked={clearExisting}
                                        onChange={(e) => setClearExisting(e.target.checked)}
                                        disabled={isCreating}
                                    />
                                    <div className="flex flex-col">
                                        <span className="label-text font-semibold">
                                            Effacer les données existantes
                                        </span>
                                        <span className="label-text-alt text-warning">
                                            Attention: Cette action supprimera toutes les données actuelles avant
                                            l'import
                                        </span>
                                    </div>
                                </label>
                            </div>

                            <div className="card-actions justify-end mt-4">
                                <button
                                    className="btn btn-primary"
                                    onClick={handleCreateImport}
                                    disabled={isCreating || !selectedFile}
                                >
                                    {isCreating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Import en cours...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4" />
                                            Lancer l'import
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-xl">
                        <div className="card-body">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="card-title">Historique des imports</h2>
                                <button
                                    className="btn btn-ghost btn-sm gap-2"
                                    onClick={loadImports}
                                    disabled={isLoading}
                                >
                                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                    Actualiser
                                </button>
                            </div>

                            {isLoading ? (
                                <div className="flex justify-center items-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                </div>
                            ) : imports.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <Upload className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p>Aucun import disponible</p>
                                    <p className="text-sm">Lancez votre premier import ci-dessus</p>
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
                                                <th>Taille du fichier</th>
                                                <th>Mode</th>
                                                <th>Complété le</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {imports.map((imp) => (
                                                <tr key={imp.importId}>
                                                    <td>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">
                                                                {formatDate(imp.createdAt)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td>{getStatusBadge(imp.status)}</td>
                                                    <td>
                                                        <span className="font-mono">{imp.collectionsCount ?? '-'}</span>
                                                    </td>
                                                    <td>
                                                        <span className="font-mono">
                                                            {imp.documentsCount?.toLocaleString() ?? '-'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="font-mono">{formatFileSize(imp.fileSize)}</span>
                                                    </td>
                                                    <td>
                                                        {(imp as any).clearExisting ? (
                                                            <div className="badge badge-warning gap-2">
                                                                <Trash2 className="w-3 h-3" />
                                                                Écrasement
                                                            </div>
                                                        ) : (
                                                            <div className="badge badge-info gap-2">Fusion</div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {imp.completedAt ? (
                                                            <span className="text-sm">{formatDate(imp.completedAt)}</span>
                                                        ) : (
                                                            '-'
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div className="flex gap-2">
                                                            {canCancel(imp.status) && (
                                                                <button
                                                                    className="btn btn-error btn-sm gap-2"
                                                                    onClick={() => handleCancelImport(imp.importId)}
                                                                    disabled={actionLoading === imp.importId}
                                                                >
                                                                    {actionLoading === imp.importId ? (
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

                    <div className="alert alert-warning mt-6">
                        <AlertCircle className="w-6 h-6" />
                        <div>
                            <h3 className="font-bold">Attention - Import de données</h3>
                            <ul className="text-sm list-disc list-inside mt-2">
                                <li>Les imports sont effectués en arrière-plan et peuvent prendre plusieurs minutes</li>
                                <li>Vous recevrez un email lorsque l'import sera terminé</li>
                                <li>
                                    <strong>Mode Fusion:</strong> Les nouvelles données sont ajoutées aux données
                                    existantes
                                </li>
                                <li>
                                    <strong>Mode Écrasement:</strong> Toutes les données existantes seront supprimées
                                    avant l'import
                                </li>
                                <li>Formats acceptés: .json, .json.gz (fichiers exportés depuis ce système)</li>
                            </ul>
                        </div>
                    </div>
                </>
            )}

            {showWarningModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg flex items-center gap-2 text-warning">
                            <AlertCircle className="w-6 h-6" />
                            Confirmation requise
                        </h3>
                        <p className="py-4">
                            Vous êtes sur le point d'importer des données en mode <strong>Écrasement</strong>.
                        </p>
                        <div className="alert alert-error">
                            <AlertCircle className="w-5 h-5" />
                            <span>
                                <strong>Cette action est irréversible !</strong>
                                <br />
                                Toutes les données actuelles de la base de données seront définitivement supprimées avant
                                l'import.
                            </span>
                        </div>
                        <p className="mt-4">Êtes-vous absolument certain de vouloir continuer ?</p>
                        <div className="modal-action">
                            <button
                                className="btn btn-ghost"
                                onClick={() => {
                                    setShowWarningModal(false);
                                    setClearExisting(false);
                                }}
                            >
                                Annuler
                            </button>
                            <button
                                className="btn btn-error"
                                onClick={() => {
                                    setShowWarningModal(false);
                                    handleCreateImport();
                                }}
                            >
                                Confirmer l'écrasement
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
