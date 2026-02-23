import { AlertTriangle, X, Trash2 } from 'lucide-react';

interface DeleteStudentModalProps {
    studentName: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export default function DeleteStudentModal({
    studentName,
    onConfirm,
    onCancel,
    isLoading = false,
}: DeleteStudentModalProps) {
    return (
        <div className="modal modal-open">
            <div className="modal-box">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-error">
                        <Trash2 className="h-5 w-5" />
                        Supprimer le compte étudiant
                    </h3>
                    <button onClick={onCancel} className="btn btn-sm btn-circle btn-ghost" disabled={isLoading}>
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="py-4">
                    <p className="text-gray-600 mb-4">
                        Vous êtes sur le point de supprimer le compte de : <span className="font-bold text-base-content">{studentName}</span>.
                    </p>
                    
                    <div className="alert alert-warning shadow-sm">
                        <AlertTriangle className="h-5 w-5" />
                        <div>
                            <h3 className="font-bold text-xs md:text-sm">Suppression différée (Soft Delete)</h3>
                            <div className="text-xs">
                                Les données seront conservées pendant <span className="font-bold">30 jours</span> avant d'être définitivement effacées de la base de données. Le compte sera désactivé immédiatement.
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal-action">
                    <button className="btn btn-ghost" onClick={onCancel} disabled={isLoading}>
                        Annuler
                    </button>
                    <button 
                        className="btn btn-error" 
                        onClick={onConfirm} 
                        disabled={isLoading}
                    >
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
    );
}