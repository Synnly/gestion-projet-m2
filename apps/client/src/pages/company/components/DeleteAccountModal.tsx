import { useState } from 'react';
import { AlertTriangle, XCircle } from 'lucide-react';
import { UseAuthFetch } from '../../../hooks/useAuthFetch';
import { deleteCompanyAccount } from '../../../apis/company';

interface DeleteAccountModalProps {
    companyId: string;
    companyName: string;
    onClose: () => void;
    onSuccess: () => void;
}

export function DeleteAccountModal({ companyId, companyName, onClose, onSuccess }: DeleteAccountModalProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [confirmText, setConfirmText] = useState('');
    const authFetch = UseAuthFetch();

    const handleDelete = async () => {
        if (confirmText !== companyName) {
            setError('Le nom de l\'entreprise ne correspond pas');
            return;
        }

        setIsDeleting(true);
        setError(null);

        try {
            await deleteCompanyAccount(authFetch, companyId);
            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Une erreur est survenue');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-2xl">
                <h3 className="font-bold text-2xl mb-4 text-base-900">Supprimer votre compte</h3>

                <div className="space-y-4">
                    <div className="alert alert-warning">
                        <AlertTriangle className="h-6 w-6 shrink-0" />
                        <div>
                            <h3 className="font-bold">Attention !</h3>
                            <div className="text-sm">Cette action est réversible pendant 30 jours.</div>
                        </div>
                    </div>

                    <div className="bg-base-200 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Ce qui va être supprimé :</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>Toutes vos offres de stage</li>
                            <li>Toutes les candidatures reçues</li>
                            <li>Votre forum et tous les messages associés</li>
                            <li>Toutes vos données d'entreprise</li>
                        </ul>
                    </div>

                    <div className="bg-opacity-20 p-4 rounded-lg border border-info">
                        <h4 className="font-semibold mb-2 text-base-900">Période de récupération</h4>
                        <p className="text-sm">
                            Vous disposez de <span className="font-bold">30 jours</span> pour restaurer votre compte en
                            vous reconnectant. Après ce délai, toutes vos données seront <span className="font-bold">définitivement supprimées</span>.
                        </p>
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-semibold py-2">
                                Pour confirmer, tapez le nom de votre entreprise : <span className="font-bold text-error">{companyName}</span>
                            </span>
                        </label>
                        <input
                            type="text"
                            placeholder="Nom de l'entreprise"
                            className="input input-bordered w-full"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            disabled={isDeleting}
                        />
                    </div>

                    {error && (
                        <div className="alert alert-error">
                            <XCircle className="h-6 w-6 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                <div className="modal-action">
                    <button className="btn btn-ghost" onClick={onClose} disabled={isDeleting}>
                        Annuler
                    </button>
                    <button
                        className="btn btn-error"
                        onClick={handleDelete}
                        disabled={isDeleting || confirmText !== companyName}
                    >
                        {isDeleting ? (
                            <>
                                <span className="loading loading-spinner"></span>
                                Suppression...
                            </>
                        ) : (
                            'Supprimer mon compte'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
