import { CheckCircle, Clock } from 'lucide-react';

interface DeleteAccountSuccessModalProps {
    onConfirm: () => void;
}

export function DeleteAccountSuccessModal({ onConfirm }: DeleteAccountSuccessModalProps) {
    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-2xl">
                <div className="flex flex-col items-center text-center space-y-6">
                    <div className="w-20 h-20 bg-success bg-opacity-20 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-12 w-12 text-success" />
                    </div>

                    <h3 className="font-bold text-2xl text-base-900">
                        Votre compte a été marqué pour suppression
                    </h3>

                    <div className="alert alert-info">
                        <Clock className="h-6 w-6 shrink-0" />
                        <div>
                            <h4 className="font-bold text-base-900">Vous disposez de 30 jours pour le restaurer</h4>
                            <p className="text-sm mt-1 text-base-900">
                                Reconnectez-vous à tout moment pour annuler la suppression et restaurer votre compte.
                            </p>
                        </div>
                    </div>

                    <div className="bg-base-200 p-4 rounded-lg w-full text-left">
                        <h4 className="font-semibold mb-2">Que va-t-il se passer ?</h4>
                        <ul className="text-sm space-y-2">
                            <li className="flex items-start gap-2">
                                <span className="text-base-900 mt-1">•</span>
                                <span>
                                    Votre compte sera <span className="font-semibold">suspendu</span> pendant 30 jours
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-base-900 mt-1">•</span>
                                <span>
                                    Vous pouvez le <span className="font-semibold">restaurer à tout moment</span> en vous reconnectant
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-base-900 mt-1">•</span>
                                <span>
                                    Après 30 jours, toutes vos données seront <span className="font-semibold">définitivement supprimées</span>
                                </span>
                            </li>
                        </ul>
                    </div>

                    <div className="w-full">
                        <button onClick={onConfirm} className="btn btn-primary w-full text-base-900">
                            Compris, se déconnecter
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
