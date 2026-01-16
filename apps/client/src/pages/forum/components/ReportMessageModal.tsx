import React, { useState } from 'react';
import { createReport, ReportReason, REPORT_REASON_LABELS } from '../../../api/reports';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';

interface ReportMessageModalProps {
    messageId: string;
    isOpen: boolean;
    onClose: () => void;
}

export const ReportMessageModal: React.FC<ReportMessageModalProps> = ({ messageId, isOpen, onClose }) => {
    const [reason, setReason] = useState<ReportReason>(ReportReason.SPAM);
    const [explanation, setExplanation] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const queryClient = useQueryClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await createReport({
                messageId,
                reason,
                explanation: explanation.trim() || undefined,
            });

            // Invalider la requête des signalements pour mettre à jour la liste
            queryClient.invalidateQueries({ queryKey: ['myReports'] });

            toast.success('Signalement envoyé avec succès');
            onClose();
            setReason(ReportReason.SPAM);
            setExplanation('');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erreur lors du signalement';
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setReason(ReportReason.SPAM);
        setExplanation('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={handleCancel}></div>

            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                <div className="bg-base-100 rounded-lg shadow-xl max-w-md w-full p-6">
                    <h3 className="text-xl font-bold mb-4">Signaler ce message</h3>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="label">
                                <span className="label-text font-semibold">Raison du signalement *</span>
                            </label>
                            <select
                                className="select select-bordered w-full"
                                value={reason}
                                onChange={(e) => setReason(e.target.value as ReportReason)}
                                required
                            >
                                {Object.entries(REPORT_REASON_LABELS).map(([key, label]) => (
                                    <option key={key} value={key}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-6">
                            <label className="label">
                                <span className="label-text font-semibold">Explication (optionnel)</span>
                            </label>
                            <textarea
                                className="textarea textarea-bordered w-full h-24"
                                placeholder="Décrivez la raison de votre signalement..."
                                value={explanation}
                                onChange={(e) => setExplanation(e.target.value)}
                                maxLength={500}
                            />
                            <label className="label">
                                <span className="label-text-alt text-gray-500">{explanation.length}/500</span>
                            </label>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button type="button" className="btn btn-ghost" onClick={handleCancel} disabled={isSubmitting}>
                                Annuler
                            </button>
                            <button type="submit" className="btn btn-error" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm"></span>
                                        Envoi...
                                    </>
                                ) : (
                                    'Signaler'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};
