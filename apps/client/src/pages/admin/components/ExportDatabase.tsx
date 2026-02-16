import { useState, useRef } from 'react';
import { UseAuthFetch } from '../../../hooks/useAuthFetch';
import { toast } from 'react-toastify';
import {
    Download,
    Loader2,
    Database,
    FileText,
    AlertCircle,
    Upload,
} from 'lucide-react';
import {
    ExportFormat,
} from '../../../types/exportImportDB.types';
import { createExport } from '../../../apis/export';
import { createImport } from '../../../apis/import';

export default function ExportDatabase() {
    const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
    const [isCreating, setIsCreating] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [clearExisting, setClearExisting] = useState(false);
    const [showWarningModal, setShowWarningModal] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const authFetch = UseAuthFetch();

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
        } catch (error) {
            toast.error("Erreur lors de la création de l'export");
            console.error(error);
        } finally {
            setIsCreating(false);
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
        } catch (error) {
            toast.error("Erreur lors de la création de l'import");
            console.error(error);
        } finally {
            setIsCreating(false);
        }
    };

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return 'N/A';
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(2)} MB`;
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
