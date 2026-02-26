import React from 'react';
import { Trash2 } from 'lucide-react';

interface DeleteMessageModalProps {
    messageId: string;
    messageContent: string;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (messageId: string) => void;
    isDeleting?: boolean;
}

export const DeleteMessageModal: React.FC<DeleteMessageModalProps> = ({
    messageId,
    messageContent,
    isOpen,
    onClose,
    onConfirm,
    isDeleting = false,
}) => {
    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm(messageId);
    };

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>

            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                <div className="bg-base-100 rounded-lg shadow-xl max-w-md w-full p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-error bg-opacity-10 p-3 rounded-full">
                            <Trash2 className="text-error" size={24} />
                        </div>
                        <h3 className="text-xl font-bold">Supprimer le message</h3>
                    </div>

                    <div className="mb-4">
                        <p className="text-sm mb-3">
                            Voulez-vous vraiment supprimer ce message ?
                        </p>
                        <div className="p-3 bg-base-200 rounded-lg border border-base-300 max-h-40 overflow-y-auto">
                            <p className="text-sm text-gray-600 italic">
                                {messageContent}
                            </p>
                        </div>
                        <p className="text-xs text-warning mt-3">
                            ⚠️ Cette action marquera le message comme supprimé et il ne sera plus visible sur le forum.
                        </p>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={onClose}
                            disabled={isDeleting}
                        >
                            Non, annuler
                        </button>
                        <button
                            type="button"
                            className="btn btn-error"
                            onClick={handleConfirm}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Suppression...
                                </>
                            ) : (
                                <>
                                    <Trash2 size={16} />
                                    Oui, supprimer
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};
