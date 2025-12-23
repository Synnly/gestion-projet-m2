import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Share2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ApplicationStatus } from './ApplicationStatus';
import { toast } from 'react-toastify';
import { UseAuthFetch } from '../../../hooks/useAuthFetch';

export const ApplicationStatusChecker = ({ studentId, adId }: { studentId?: string; adId: string }) => {
    const authFetch = UseAuthFetch();
    const { data: application, isLoading } = useQuery({
        queryKey: ['application', studentId, adId],

        queryFn: async () => {
            const url = `${import.meta.env.VITE_APIURL}/api/application/check?studentId=${studentId}&postId=${adId}`;

            const res = await authFetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (res.ok) {
                try {
                    const responseData = await res.json();
                    return responseData;
                } catch (e) {
                    return null;
                }
            }
            const errorMessage = `Erreur HTTP ${res.status}`;
            throw new Error(errorMessage);
        },

        enabled: !!studentId && !!adId,
        staleTime: 1 * 60 * 1000, // 1 minute
    });

    const navigate = useNavigate();

    const handleApply = () => {
        navigate(`/internship/apply/${adId}`);
    };

    const share = async () => {
        try {
            const internshipUrl = `${window.location.origin}/internship/detail/${adId}`;;
            await navigator.clipboard.writeText(internshipUrl);
            
            toast.success('Lien copié !', { toastId: 'post-success' });
        } catch (err) {
            console.error('Erreur lors de la copie du lien:', err);
            alert("Impossible de copier le lien (votre navigateur n'est pas supporté).");
        }
    };

    if (isLoading) {
        return (
            <button className="btn btn-primary flex h-11 flex-1 items-center justify-center gap-2">
                <ArrowUpRight size={20} />
                <span className="loading loading-spinner loading-md"></span>
            </button>
        );
    }
    return (
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
            {!application ? (
                <>
                    <button
                        onClick={handleApply}
                        className="btn btn-primary flex h-11 flex-1 items-center justify-center gap-2"
                    >
                        <ArrowUpRight size={20} />
                        <span>Candidater</span>
                    </button>
                    <button
                        onClick={share}
                        className="btn btn-ghost flex h-11 items-center justify-center gap-2">
                        <Share2 size={20} />
                        <span>Partager</span>
                    </button>
                </>
            ) : (
                <div className="flex flex-col">
                    <ApplicationStatus status={application.status} />
                    <Link
                        to={`/student/dashboard/${application._id}`}
                        className="btn btn-primary flex py-2 h-11 flex-1 items-center justify-center gap-2"
                    >
                        Voir le statut
                    </Link>
                </div>
            )}
        </div>
    );
};
