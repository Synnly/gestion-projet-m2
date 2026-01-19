import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface RejectCompanyModalProps {
    companyName: string;
    onReject: (rejectionReason: string) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

const PREDEFINED_REASONS = [
    { id: 'incomplete_info', label: 'Informations incomplètes ou manquantes' },
    { id: 'invalid_siret', label: 'Numéro SIRET invalide ou introuvable' },
    { id: 'wrong_activity', label: "Activité ne correspondant pas au secteur d'accueil de stages" },
    { id: 'duplicate_account', label: 'Compte déjà existant pour cette entreprise' },
    { id: 'suspicious_data', label: 'Données suspectes ou incohérentes' },
    { id: 'no_legal_status', label: 'Statut légal non renseigné ou incorrect' },
    { id: 'invalid_email', label: 'Email professionnel non valide' },
    { id: 'incomplete_address', label: 'Adresse incomplète ou invalide' },
];

export default function RejectCompanyModal({
    companyName,
    onReject,
    onCancel,
    isLoading = false,
}: RejectCompanyModalProps) {
    const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
    const [customMessage, setCustomMessage] = useState('');

    const handleToggleReason = (reasonId: string) => {
        setSelectedReasons((prev) =>
            prev.includes(reasonId) ? prev.filter((id) => id !== reasonId) : [...prev, reasonId],
        );
    };

    const handleSubmit = () => {
        const selectedReasonTexts = selectedReasons.map(
            (id) => PREDEFINED_REASONS.find((r) => r.id === id)?.label || '',
        );

        const parts: string[] = [];

        if (selectedReasonTexts.length > 0) {
            parts.push('Raisons du rejet :');
            selectedReasonTexts.forEach((reason, index) => {
                parts.push(`${index + 1}. ${reason}`);
            });
        }

        if (customMessage.trim()) {
            if (parts.length > 0) parts.push('');
            parts.push('Message complémentaire :');
            parts.push(customMessage.trim());
        }

        const finalMessage = parts.join('\n');
        onReject(finalMessage || 'Compte rejeté');
    };

    const canSubmit = selectedReasons.length > 0 || customMessage.trim().length > 0;

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-error" />
                        Rejeter l'entreprise
                    </h3>
                    <button onClick={onCancel} className="btn btn-sm btn-circle btn-ghost" disabled={isLoading}>
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="mb-4">
                    <p className="text-sm text-gray-600">
                        Vous êtes sur le point de rejeter : <span className="font-semibold">{companyName}</span>
                    </p>
                </div>

                <div className="divider my-2"></div>

                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold mb-3 text-sm">
                            Raisons du rejet (sélectionnez une ou plusieurs raisons) :
                        </h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto p-2 bg-base-200 rounded-lg">
                            {PREDEFINED_REASONS.map((reason) => (
                                <label
                                    key={reason.id}
                                    className="flex items-start gap-3 p-2 rounded hover:bg-base-300 cursor-pointer transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-sm mt-0.5"
                                        checked={selectedReasons.includes(reason.id)}
                                        onChange={() => handleToggleReason(reason.id)}
                                        disabled={isLoading}
                                    />
                                    <span className="text-sm flex-1">{reason.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-2 text-sm">Message personnalisé (optionnel) :</h4>
                        <textarea
                            className="textarea textarea-bordered w-full h-32"
                            placeholder="Ajoutez un message personnalisé pour préciser les raisons du rejet..."
                            value={customMessage}
                            onChange={(e) => setCustomMessage(e.target.value)}
                            disabled={isLoading}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Ce message sera envoyé à l'entreprise avec les raisons sélectionnées ci-dessus.
                        </p>
                    </div>

                    {selectedReasons.length > 0 && (
                        <div className="alert alert-info">
                            <div className="text-sm">
                                <strong>{selectedReasons.length}</strong> raison(s) sélectionnée(s)
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-action">
                    <button className="btn btn-ghost" onClick={onCancel} disabled={isLoading}>
                        Annuler
                    </button>
                    <button
                        className="btn btn-error"
                        onClick={handleSubmit}
                        disabled={!canSubmit || isLoading}
                    >
                        {isLoading ? (
                            <>
                                <span className="loading loading-spinner loading-sm"></span>
                                Rejet en cours...
                            </>
                        ) : (
                            'Confirmer le rejet'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
