import { useRef } from 'react';
import { Upload, Loader2, AlertCircle } from 'lucide-react';
import { formatFileSize } from './utils/formatters';

interface ImportTabProps {
    isCreating: boolean;
    selectedFile: File | null;
    clearExisting: boolean;
    pendingImportId: string | null;
    importStatusMessage: string;
    onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onClearExistingChange: (value: boolean) => void;
    onCreateImport: () => void;
}

export default function ImportTab({
    isCreating,
    selectedFile,
    clearExisting,
    pendingImportId,
    importStatusMessage,
    onFileChange,
    onClearExistingChange,
    onCreateImport,
}: ImportTabProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
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

                    {pendingImportId && importStatusMessage && (
                        <div className="alert alert-info mb-4">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <div>
                                <p className="font-semibold">{importStatusMessage}</p>
                                <p className="text-sm">
                                    L'import avec écrasement est en cours. Ne fermez pas cette page.
                                </p>
                            </div>
                        </div>
                    )}

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
                            onChange={onFileChange}
                            disabled={isCreating || !!pendingImportId}
                        />
                        {selectedFile && (
                            <label className="label">
                                <span className="label-text-alt text-success">
                                    Fichier sélectionné: {selectedFile.name} ({formatFileSize(selectedFile.size)})
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
                                onChange={(e) => onClearExistingChange(e.target.checked)}
                                disabled={isCreating || !!pendingImportId}
                            />
                            <div className="flex flex-col">
                                <span className="label-text font-semibold">Effacer les données existantes</span>
                                <span className="label-text-alt text-warning">
                                    Attention: Cette action supprimera toutes les données actuelles avant l'import
                                </span>
                            </div>
                        </label>
                    </div>

                    <div className="card-actions justify-end mt-4">
                        <button
                            className="btn btn-primary"
                            onClick={onCreateImport}
                            disabled={isCreating || !selectedFile || !!pendingImportId}
                        >
                            {isCreating || pendingImportId ? (
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
                            <strong>Mode Fusion:</strong> Les nouvelles données sont ajoutées aux données existantes
                        </li>
                        <li>
                            <strong>Mode Écrasement:</strong> Toutes les données existantes seront supprimées avant
                            l'import.{' '}
                            <span className="text-error font-semibold">
                                Vous devrez attendre la fin de l'import sur cette page avant d'être redirigé.
                            </span>
                        </li>
                        <li>Formats acceptés: .json, .json.gz (fichiers exportés depuis ce système)</li>
                    </ul>
                </div>
            </div>
        </>
    );
}
