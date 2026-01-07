import { X } from 'lucide-react';
import { useFetchFileSignedUrl } from '../../../hooks/useFetchApplications.tsx';

interface PdfModalProps {
    selectedApplication: { id: string; type: 'cv' | 'lm' } | null;
    onClose: () => void;
}

export const PdfModal = ({ selectedApplication, onClose }: PdfModalProps) => {
    const { data: url } = useFetchFileSignedUrl(selectedApplication?.id, selectedApplication?.type);

    return (
        <div className="modal modal-open" onClick={onClose}>
            <div
                className="modal-box w-full h-full max-w-4xl max-h-[90vh] flex flex-col p-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">Aperçu</h3>
                    <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
                        <X />
                    </button>
                </div>
                <div className="flex flex-1 bg-base-200 rounded-lg overflow-hidden">
                    {!url ? (
                        <div className="flex flex-1 justify-center items-center">
                            <div className="loading loading-spinner loading-xl"></div>
                        </div>
                    ) : (
                        <iframe src={url} className="w-full h-full" title="Document" />
                    )}
                </div>
            </div>
        </div>
    );
};
