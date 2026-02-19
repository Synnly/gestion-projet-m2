import type { Internship } from '../../../types/internship.types.ts';
import { Trash, X } from 'lucide-react';

interface Props {
    post: Internship;
    onCancel: () => void;
    onValidate: () => void;
    isLoading?: boolean;
}

export const DeletionModal = ({ post, onCancel, onValidate, isLoading }: Props) => {
    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Trash className="h-5 w-5 text-error" />
                        Supprimer l'annonce
                    </h3>
                    <button onClick={onCancel} className="btn btn-sm btn-circle btn-ghost" disabled={isLoading}>
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="mb-6">
                    <div className="text-sm flex flex-col items-center gap-2">
                        <div>Vous êtes sur le point de supprimer cette annonce</div>
                        <div className="font-semibold">{post.title}</div>
                        <div>Les étudiants ayant postulé seront notifiés de la suppression.</div>
                    </div>
                </div>

                <div className="modal-action">
                    <button className="btn btn-ghost" onClick={onCancel} disabled={isLoading}>
                        Annuler
                    </button>
                    <button className="btn btn-error" onClick={onValidate} disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <span className="loading loading-spinner loading-sm"></span>
                                Suppression en cours...
                            </>
                        ) : (
                            'Supprimer'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
