import { ArrowUpRight, Eye } from 'lucide-react';
import { type Application } from '../../../types/application.types';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { PdfModal } from '../../company/applicationList/component/PdfModal';
import { formatDate } from 'date-fns';

export const ApplicationStatusChecker = ({
    application,
    isLoading,
    postId,
    isPostVisible = true,
}: {
    application: Application;
    isLoading: boolean;
    postId: string;
    isPostVisible?: boolean;
}) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [fileType, setFileType] = useState<'cv' | 'lm'>('cv');
    const navigate = useNavigate();

    if (isLoading) {
        return (
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
                <button className="btn btn-primary flex h-11 flex-1 items-center justify-center gap-2">
                    <ArrowUpRight size={20} />
                    <span className="loading loading-spinner loading-md"></span>
                </button>
            </div>
        );
    }

    const handleApply = () => {
        navigate(`/internship/apply/${postId}`);
    };

    function previewFile(type: 'cv' | 'lm') {
        setFileType(type);
        setModalOpen(true);
    }

    return (
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
            {!application ? (
                <>
                    <button
                        onClick={handleApply}
                        className="btn btn-primary flex h-11 flex-1 items-center justify-center gap-2"
                        disabled={!isPostVisible}
                        title={!isPostVisible ? 'Cette offre n\'est plus disponible' : ''}
                    >
                        <ArrowUpRight size={20} />
                        <span>{isPostVisible ? 'Candidater' : 'Offre non disponible'}</span>
                    </button>
                </>
            ) : (
                <div className="flex items-center justify-between gap-4 w-full">
                    <div>Candidaté le {formatDate(new Date(application.createdAt), 'dd/MM/yyyy')}</div>
                    {application.cv && (
                        <div className="btn grow cursor-pointer" onClick={() => previewFile('cv')}>
                            CV <Eye />
                        </div>
                    )}
                    {application.coverLetter && (
                        <div className="btn grow cursor-pointer" onClick={() => previewFile('lm')}>
                            LM <Eye />
                        </div>
                    )}
                </div>
            )}
            {modalOpen && (
                <PdfModal
                    selectedApplication={{ id: application._id, type: fileType }}
                    onClose={() => {
                        setModalOpen(false);
                    }}
                />
            )}
        </div>
    );
};
