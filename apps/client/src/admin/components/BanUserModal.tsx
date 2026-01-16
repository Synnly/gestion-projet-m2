import React, { useState } from 'react';
import { banUser } from '../../api/users';
import { toast } from 'react-toastify';
import { Ban } from 'lucide-react';

interface BanUserModalProps {
    userId: string;
    userEmail: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export const BanUserModal: React.FC<BanUserModalProps> = ({ userId, userEmail, isOpen, onClose, onSuccess }) => {
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await banUser(userId, reason.trim() || undefined);
            toast.success(`L'utilisateur ${userEmail} a été banni avec succès`);
            setReason('');
            onClose();
            onSuccess?.();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erreur lors du bannissement';
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setReason('');
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
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-error bg-opacity-10 p-3 rounded-full">
                            <Ban className="text-error" size={24} />
                        </div>
                        <h3 className="text-xl font-bold">Bannir l'utilisateur</h3>
                    </div>

                    <div className="mb-4 p-3 bg-warning bg-opacity-10 border border-warning rounded-lg">
                        <p className="text-sm">
                            Vous êtes sur le point de bannir l'utilisateur :<br />
                            <span className="font-bold">{userEmail}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                            Cette action empêchera l'utilisateur de se connecter et d'accéder à la plateforme.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label className="label">
                                <span className="label-text font-semibold">Raison du bannissement (optionnel)</span>
                            </label>
                            <textarea
                                className="textarea textarea-bordered w-full h-24"
                                placeholder="Décrivez la raison du bannissement..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                maxLength={500}
                            />
                            <label className="label">
                                <span className="label-text-alt text-gray-500">{reason.length}/500</span>
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
                                        Bannissement...
                                    </>
                                ) : (
                                    <>
                                        <Ban size={16} />
                                        Bannir l'utilisateur
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};
