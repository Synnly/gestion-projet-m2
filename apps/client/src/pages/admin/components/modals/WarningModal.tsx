import { AlertCircle } from 'lucide-react';

interface WarningModalProps {
    isOpen: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

export default function WarningModal({ isOpen, onCancel, onConfirm }: WarningModalProps) {
    if (!isOpen) return null;

    return (
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
                <div className="alert alert-warning mt-4">
                    <AlertCircle className="w-5 h-5" />
                    <span>
                        <strong>Vous serez déconnecté une fois l'import terminé</strong>
                        <br />
                        L'import avec écrasement supprime tous les tokens de session. Vous devrez attendre la fin de
                        l'import sur cette page, puis vous serez automatiquement redirigé vers la page de connexion.
                    </span>
                </div>
                <p className="mt-4">Êtes-vous absolument certain de vouloir continuer ?</p>
                <div className="modal-action">
                    <button className="btn btn-ghost" onClick={onCancel}>
                        Annuler
                    </button>
                    <button className="btn btn-error" onClick={onConfirm}>
                        Confirmer l'écrasement
                    </button>
                </div>
            </div>
        </div>
    );
}
