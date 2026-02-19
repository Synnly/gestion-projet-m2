import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ImportStatus } from '../types/exportImportDB.types';
import { createImport, getImportStatus } from '../apis/import';

export function useImportManagement(authFetch: any, onClearExports: () => void) {
    const [isCreating, setIsCreating] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [clearExisting, setClearExisting] = useState(false);
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [pendingImportId, setPendingImportId] = useState<string | null>(null);
    const [importStatusMessage, setImportStatusMessage] = useState<string>('');
    const authFetchRef = useRef(authFetch);
    const navigate = useNavigate();

    useEffect(() => {
        authFetchRef.current = authFetch;
    }, [authFetch]);

    useEffect(() => {
        if (!pendingImportId) return;

        let pollAttempts = 0;
        const maxPollAttempts = 200;

        const checkImportStatus = async () => {
            try {
                pollAttempts++;

                if (pollAttempts > maxPollAttempts) {
                    setImportStatusMessage('Timeout atteint. Redirection vers la page de connexion...');
                    localStorage.setItem(
                        'import_success_message',
                        "L'import prend plus de temps que prévu. Veuillez vérifier les emails ou contacter un administrateur.",
                    );

                    setTimeout(() => {
                        navigate('/signin');
                    }, 3000);
                    setPendingImportId(null);
                    return;
                }

                const status = await getImportStatus(authFetchRef.current, pendingImportId);

                if (status.status === ImportStatus.COMPLETED) {
                    setImportStatusMessage('Import terminé avec succès. Redirection vers la page de connexion...');
                    localStorage.setItem(
                        'import_success_message',
                        'Import terminé avec succès. Veuillez vous reconnecter.',
                    );

                    setTimeout(() => {
                        navigate('/signin');
                    }, 2000);
                    setPendingImportId(null);
                } else if (status.status === ImportStatus.FAILED) {
                    setImportStatusMessage('Import échoué. Redirection vers la page de connexion...');
                    localStorage.setItem('import_success_message', "L'import a échoué. Veuillez vous reconnecter.");

                    setTimeout(() => {
                        navigate('/signin');
                    }, 2000);
                    setPendingImportId(null);
                } else if (status.status === ImportStatus.CANCELLED) {
                    setImportStatusMessage('Import annulé. Redirection vers la page de connexion...');
                    localStorage.setItem('import_success_message', "L'import a été annulé. Veuillez vous reconnecter.");

                    setTimeout(() => {
                        navigate('/signin');
                    }, 2000);
                    setPendingImportId(null);
                } else {
                    const statusText =
                        status.status === ImportStatus.IN_PROGRESS ? "en cours d'exécution" : 'en attente';
                    setImportStatusMessage(`Import ${statusText}... Vous serez redirigé une fois terminé.`);
                }
            } catch (error: any) {
                console.error("Erreur lors de la vérification du statut d'import:", error);

                if (error?.status === 401 || error?.message === 'Session expirée') {
                    setImportStatusMessage('Session expirée. Redirection vers la page de connexion...');
                    localStorage.setItem(
                        'import_success_message',
                        'Votre session a expiré. L\'import continue en arrière-plan. Reconnectez-vous pour vérifier son statut.'
                    );

                    setTimeout(() => {
                        navigate('/signin');
                    }, 2000);
                    setPendingImportId(null);
                } else if (pollAttempts > 5 || error?.status === 403) {
                    setImportStatusMessage('Import probablement terminé. Redirection vers la page de connexion...');
                    localStorage.setItem('import_success_message', 'Import terminé.');

                    setTimeout(() => {
                        navigate('/signin');
                    }, 2000);
                    setPendingImportId(null);
                }
            }
        };

        checkImportStatus();

        const interval = setInterval(checkImportStatus, 3000);

        return () => clearInterval(interval);
    }, [pendingImportId, navigate]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        const validExtensions = ['.json', '.gz'];
        const hasValidExtension = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

        if (!hasValidExtension) {
            toast.error('Type de fichier invalide. Seuls les fichiers .json et .json.gz sont acceptés.');
            return;
        }

        const maxSize = 5000 * 1024 * 1024; // 5GB en octets
        if (file.size > maxSize) {
            toast.error('Le fichier est trop volumineux. Taille maximale: 500 MB');
            return;
        }

        setSelectedFile(file);
    };

    const handleCreateImport = async (fileInputRef: React.RefObject<HTMLInputElement | null>) => {
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

            if (clearExisting) {
                onClearExports();
                setPendingImportId(result.importId);
                setImportStatusMessage('Import en cours... Veuillez patienter.');
                toast.info(result.message + " Veuillez patienter, vous serez redirigé une fois l'import terminé.", {
                    autoClose: 7000,
                });
            } else {
                toast.success(result.message);
            }

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

    const closeWarningModal = () => {
        setShowWarningModal(false);
        setClearExisting(false);
    };

    return {
        isCreating,
        selectedFile,
        clearExisting,
        showWarningModal,
        pendingImportId,
        importStatusMessage,
        setClearExisting,
        handleFileChange,
        handleCreateImport,
        closeWarningModal,
        setShowWarningModal,
    };
}
