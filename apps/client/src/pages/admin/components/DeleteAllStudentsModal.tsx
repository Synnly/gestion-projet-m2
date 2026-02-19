import { Trash2, X } from 'lucide-react';
import { type ChangeEvent, useState } from 'react';

interface Props {
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export const DeleteAllStudentsModal = ({ onConfirm, onCancel, isLoading = false }: Props) => {
    const [canConfirm, setCanConfirm] = useState(false);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        setCanConfirm(e.target.value === 'Confirmer');
    };

    return (
        <>
            <div className="modal modal-open">
                <div className="modal-box">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg flex items-center gap-2 text-error">
                            <Trash2 className="h-5 w-5" />
                            Suppression de tous les comptes étudiants
                        </h3>
                        <button onClick={onCancel} className="btn btn-sm btn-circle btn-ghost" disabled={isLoading}>
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="py-4">
                        <p className="alert alert-error text-center text-error-content font-bold mb-4">
                            VOUS ETES SUR LE POINT DE SUPPRIMER TOUS LES COMPTES ÉTUDIANTS. CETTE ACTION SERA EFFECTIVE
                            DANS 30 JOURS.
                        </p>
                    </div>

                    <div className="flex">
                        <label className="floating-label w-full">
                            <input className="input w-full" onChange={handleInputChange} />
                            <span>Entrer "Confirmer" pour confirmer</span>
                        </label>
                    </div>

                    <div className="modal-action">
                        <button className="btn btn-ghost" onClick={onCancel} disabled={isLoading}>
                            Annuler
                        </button>
                        <button className="btn btn-error" onClick={onConfirm} disabled={isLoading || !canConfirm}>
                            {isLoading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Traitement...
                                </>
                            ) : (
                                'Confirmer la suppression'
                            )}
                        </button>
                    </div>
                </div>
                <div className="modal-backdrop" onClick={onCancel}></div>
            </div>
        </>
    );
};
