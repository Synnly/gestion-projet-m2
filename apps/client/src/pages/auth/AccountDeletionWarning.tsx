import { useState } from 'react';
import { AlertTriangle, XCircle } from 'lucide-react';
import { UseAuthFetch } from '../../hooks/useAuthFetch';
import { restoreCompanyAccount } from '../../apis/company';

interface AccountDeletionWarningProps {
    userId: string;
    daysRemaining: number;
    onRestore: () => void;
    onLogout: () => void;
}

export function AccountDeletionWarning({ userId, daysRemaining, onRestore, onLogout }: AccountDeletionWarningProps) {
    const [isRestoring, setIsRestoring] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const authFetch = UseAuthFetch();

    const handleRestore = async () => {
        setIsRestoring(true);
        setError(null);

        try {
            await restoreCompanyAccount(authFetch, userId);
            onRestore();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Une erreur est survenue');
        } finally {
            setIsRestoring(false);
        }
    };

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-xl">
                <h3 className="font-bold text-2xl mb-4 text-warning">Compte en attente de suppression</h3>

                <div className="space-y-4">
                    <div className="alert alert-warning">
                        <AlertTriangle className="h-6 w-6" />
                        <div>
                            <h3 className="font-bold">Votre compte est programmé pour suppression</h3>
                            <div className="text-sm mt-1">
                                Il vous reste <span className="font-bold">{daysRemaining} jour{daysRemaining > 1 ? 's' : ''}</span> pour le restaurer.
                            </div>
                        </div>
                    </div>

                    <div className="bg-base-200 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Que va-t-il se passer ?</h4>
                        <p className="text-sm">
                            Dans {daysRemaining} jour{daysRemaining > 1 ? 's' : ''}, votre compte et toutes les données associées
                            (offres de stage, candidatures, messages) seront <span className="font-bold">définitivement supprimées</span>.
                        </p>
                    </div>

                    <div className="bg-success bg-opacity-20 p-4 rounded-lg border border-success">
                        <h4 className="font-semibold mb-2 text-base-900">Vous pouvez encore restaurer votre compte</h4>
                        <p className="text-sm mb-2">
                            Si vous avez changé d'avis, cliquez sur le bouton ci-dessous pour annuler la suppression
                            et récupérer l'accès complet à votre compte.
                        </p>
                        <p className="text-sm text-base-900 font-semibold mt-2">
                            Important : Seul votre compte sera restauré. Les données supprimées (offres de stage, candidatures, messages du forum) ne pourront pas être récupérées.
                        </p>
                    </div>

                    {error && (
                        <div className="alert alert-error">
                            <XCircle className="h-6 w-6" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                <div className="modal-action">
                    <button className="btn btn-ghost" onClick={onLogout} disabled={isRestoring}>
                        Se déconnecter
                    </button>
                    <button className="btn btn-success" onClick={handleRestore} disabled={isRestoring}>
                        {isRestoring ? (
                            <>
                                <span className="loading loading-spinner"></span>
                                Restauration...
                            </>
                        ) : (
                            'Restaurer mon compte'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
