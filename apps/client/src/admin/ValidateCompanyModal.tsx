import { CheckCircle2, X } from 'lucide-react';

interface ValidateCompanyModalProps {
    companyName: string;
    onValidate: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export default function ValidateCompanyModal({
    companyName,
    onValidate,
    onCancel,
    isLoading = false,
}: ValidateCompanyModalProps) {
    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success" />
                        Valider l'entreprise
                    </h3>
                    <button onClick={onCancel} className="btn btn-sm btn-circle btn-ghost" disabled={isLoading}>
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="mb-6">
                    <p className="text-sm text-gray-600">
                        Vous êtes sur le point de valider l'entreprise :{' '}
                        <span className="font-semibold">{companyName}</span>
                    </p>
                </div>

                <div className="modal-action">
                    <button className="btn btn-ghost" onClick={onCancel} disabled={isLoading}>
                        Annuler
                    </button>
                    <button className="btn btn-success" onClick={onValidate} disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <span className="loading loading-spinner loading-sm"></span>
                                Validation en cours...
                            </>
                        ) : (
                            'Confirmer la validation'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
