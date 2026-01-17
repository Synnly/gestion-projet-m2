import React, { useState } from 'react';
import { UseAuthFetch } from '../hooks/useAuthFetch';

interface ImportError {
    row?: number;
    field?: string;
    message: string;
}

interface ImportResult {
    added: number;
    skipped: number;
}

export default function ImportStudent() {
    const [file, setFile] = useState<File | null>(null);
    const [errors, setErrors] = useState<ImportError[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [importSuccess, setImportSuccess] = useState(false);
    const [skipExisting, setSkipExisting] = useState(false);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [duplicatesDetected, setDuplicatesDetected] = useState(false);
    const authFetch = UseAuthFetch();
    const API_URL = import.meta.env.VITE_APIURL;

    // Allowed extensions + MIME types (match backend pipes)
    const ALLOWED_EXTENSIONS = ['.json', '.csv'];
    const ALLOWED_MIME_TYPES = ['application/json', 'text/csv'];

    const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB (match FileSizeValidationPipe)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            setErrors([{ message: `Extension non autorisée. Formats acceptés: ${ALLOWED_EXTENSIONS.join(', ')}` }]);
            setFile(null);
            return;
        }

        if (selectedFile.size > MAX_SIZE_BYTES) {
            setErrors([
                { message: `Fichier trop volumineux. Taille max: ${Math.round(MAX_SIZE_BYTES / (1024 * 1024))}MB` },
            ]);
            setFile(null);
            return;
        }

        if (selectedFile.type && !ALLOWED_MIME_TYPES.includes(selectedFile.type)) {
            setErrors([
                {
                    message: `Type MIME non autorisé (${selectedFile.type}). Autorisés: ${ALLOWED_MIME_TYPES.join(', ')}`,
                },
            ]);
            setFile(null);
            return;
        }

        setFile(selectedFile);
        setErrors([]);
        setImportSuccess(false);
        setImportResult(null);
    };

    const handleImport = async () => {
        if (!file) return;

        setIsLoading(true);
        setErrors([]);
        setImportResult(null);

        try {
            const token = localStorage.getItem('accessToken');

            const formData = new FormData();
            formData.append('file', file);

            const url = `${API_URL}/api/students/import${skipExisting ? '?skipExistingRecords=true' : ''}`;

            const response = await authFetch(url, {
                method: 'POST',
                headers: token
                    ? { Authorization: `Bearer ${token}`, Accept: 'application/json' }
                    : { Accept: 'application/json' },
                data: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Erreur lors de l'importation");
            }

            setDuplicatesDetected(false);
            if (response.status === 409) {
                setDuplicatesDetected(true);
            }

            const data = await response.json();

            if (data.errors && data.errors.length > 0) {
                setErrors(data.errors);
            } else {
                setImportSuccess(true);
                setImportResult({ added: data.added, skipped: data.skipped });
                setFile(null);

                const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                if (fileInput) fileInput.value = '';

                setTimeout(() => {
                    setImportSuccess(false);
                    setImportResult(null);
                }, 5000);
            }
        } catch (error) {
            let message = 'Une erreur est survenue lors de l’import.';

            if (error instanceof TypeError) {
                message = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
            } else if (error instanceof Error) {
                message = error.message;
            }

            setErrors([{ message }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6">
            <div className="card bg-base-200 shadow-xl mb-6">
                <div className="card-body">
                    <h2 className="card-title">Sélectionner un fichier</h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Formats acceptés : <strong>{ALLOWED_EXTENSIONS.join(', ')}</strong>
                        <br />
                        Taille maximale : <strong>{Math.round(MAX_SIZE_BYTES / (1024 * 1024))} Mo</strong>
                    </p>

                    <div className="flex gap-4 items-center">
                        <input
                            type="file"
                            accept=".json,.csv,application/json,text/csv"
                            onChange={handleFileChange}
                            className="file-input file-input-bordered file-input-primary flex-1"
                            disabled={isLoading}
                        />

                        {file && (
                            <button onClick={handleImport} className="btn btn-primary" disabled={isLoading}>
                                {isLoading ? 'Import en cours...' : 'Importer'}
                            </button>
                        )}
                    </div>

                    {file && !isLoading && (
                        <div className="mt-4 space-y-2">
                            <div className="text-sm text-gray-600">
                                Fichier sélectionné: <span className="font-semibold">{file.name}</span>
                            </div>

                            <div className="form-control">
                                <label className="label cursor-pointer justify-start gap-2">
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-primary"
                                        checked={skipExisting}
                                        onChange={(e) => setSkipExisting(e.target.checked)}
                                    />
                                    <span className="label-text">
                                        Ignorer les enregistrements existants (emails et numéros étudiants en doublon)
                                    </span>
                                </label>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {errors.length > 0 && (
                <div className="alert alert-error mb-6">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="stroke-current shrink-0 h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <div>
                        <h3 className="font-bold">Erreurs détectées:</h3>
                        <ul className="list-disc list-inside">
                            {errors.map((error, index) => (
                                <li key={index}>
                                    {error.row !== undefined && <span>Ligne {error.row}: </span>}
                                    {error.field && <span>Champ "{error.field}": </span>}
                                    <span>{error.message}</span>
                                </li>
                            ))}
                        </ul>
                        {duplicatesDetected && (
                            <div className="mt-2 text-sm">
                                <strong>Astuce:</strong> Cochez l'option "Ignorer les enregistrements existants" pour
                                Ignorer automatiquement les doublons.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {importSuccess && importResult && (
                <div className="alert alert-success mb-6">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="stroke-current shrink-0 h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <div>
                        <span className="font-bold">Import réussi!</span>
                        <ul className="mt-2 text-sm">
                            <li>{importResult.added} étudiants ajoutés</li>
                            {importResult.skipped > 0 && (
                                <li>{importResult.skipped} enregistrements ignorés (doublons)</li>
                            )}
                        </ul>
                    </div>
                </div>
            )}

            {!file && !importSuccess && (
                <div className="text-center py-12 text-gray-500">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-24 w-24 mx-auto mb-4 opacity-50"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                    </svg>
                    <p className="text-lg">Aucun fichier sélectionné</p>
                    <p className="text-sm">Sélectionnez un fichier pour commencer l'import</p>
                </div>
            )}
        </div>
    );
}
