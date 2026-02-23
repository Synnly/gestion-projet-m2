import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { userStore } from '../../stores/userStore';
import { UseAuthFetch } from '../../hooks/useAuthFetch';
import { restoreCompanyAccount } from '../../apis/company';

const VITE_API = import.meta.env.VITE_APIURL;

export function AccountRestorePage() {
    const access = userStore((state) => state.access);
    const getUserInfo = userStore((state) => state.get);
    const setAccess = userStore((state) => state.set);
    const logout = userStore((state) => state.logout);
    const navigate = useNavigate();
    const authFetch = UseAuthFetch();
    
    const [isRestoring, setIsRestoring] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [daysRemaining, setDaysRemaining] = useState<number>(0);

    const user = access ? getUserInfo(access) : null;

    useEffect(() => {
        if (!user || !user.deletedAt) {
            navigate('/signin', { replace: true });
        }
    }, []);

    useEffect(() => {
        if (!user || !user.deletedAt) return;

        // Calculate days remaining
        const deletedAt = new Date(user.deletedAt);
        const now = new Date();
        const daysSinceDeletion = Math.floor(
            (now.getTime() - deletedAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        const remaining = Math.max(0, 30 - daysSinceDeletion);
        setDaysRemaining(remaining);

        // If no days remaining, logout
        if (remaining === 0) {
            logout();
            navigate('/signin', { replace: true });
        }
    }, [user?.deletedAt]);

    const handleRestore = async () => {
        if (!user) return;

        setIsRestoring(true);
        setError(null);

        try {
            await restoreCompanyAccount(authFetch, user.id);

            // Refresh the access token so the new token no longer contains deletedAt
            const refreshRes = await fetch(`${VITE_API}/api/auth/refresh`, {
                method: 'POST',
                credentials: 'include',
            });

            if (refreshRes.ok) {
                const newAccessToken = await refreshRes.text();
                setAccess(newAccessToken);
            }

            navigate('/home', { replace: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Une erreur est survenue');
        } finally {
            setIsRestoring(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/signin');
    };

    if (!user || !user.deletedAt) {
        return null;
    }

    return (
        <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
            <div className="card max-w-3xl w-full bg-base-200 shadow-xl">
                <div className="card-body">
                    <div className="flex flex-col items-center text-center space-y-6">
                        

                        <h1 className="text-3xl font-bold text-base-900">
                            Votre compte est en attente de suppression
                        </h1>

                        <div className="alert alert-warning shadow-sm">
                            <Clock className="h-6 w-6 shrink-0" />
                            <div className="text-left">
                                <h3 className="font-bold">Temps restant</h3>
                                <p className="text-sm mt-1">
                                    Il vous reste <span className="font-bold text-lg">{daysRemaining} jour{daysRemaining > 1 ? 's' : ''}</span> pour restaurer votre compte
                                </p>
                            </div>
                        </div>

                        <div className="bg-base-300 p-6 rounded-lg w-full text-left space-y-4">
                            <h4 className="font-semibold text-lg mb-3">Que va-t-il se passer ?</h4>
                            
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="mt-1">
                                        <Clock className="h-5 w-5 text-info" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">Dans {daysRemaining} jour{daysRemaining > 1 ? 's' : ''}</p>
                                        <p className="text-sm text-base-600">
                                            Votre compte et toutes les données associées (offres de stage, candidatures, messages) 
                                            seront <span className="font-semibold">définitivement supprimées</span>.
                                        </p>
                                    </div>
                                </div>

                                <div className="divider my-2"></div>

                                <div className="flex items-start gap-3">
                                    <div className="mt-1">
                                        <CheckCircle className="h-5 w-5 text-success" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">Restauration possible</p>
                                        <p className="text-sm text-base-600">
                                            Vous pouvez annuler la suppression et récupérer l'accès à votre compte 
                                            en cliquant sur le bouton "Restaurer mon compte". Seul votre compte sera restauré, les offres de stage et candidatures, forum ne seront pas récupérables.
                                        </p>
                                    </div>
                                </div>

                                <div className="divider my-2"></div>

                                <div className="flex items-start gap-3">
                                    <div className="mt-1">
                                        <XCircle className="h-5 w-5 text-error" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">Après suppression</p>
                                        <p className="text-sm text-base-600">
                                            Une fois le délai expiré, aucune récupération ne sera possible. 
                                            Vous devrez créer un nouveau compte.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="alert alert-error w-full">
                                <XCircle className="h-6 w-6 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-4 w-full mt-6">
                            <button 
                                className="btn btn-ghost flex-1" 
                                onClick={handleLogout} 
                                disabled={isRestoring}
                            >
                                Se déconnecter
                            </button>
                            <button 
                                className="btn btn-success flex-1" 
                                onClick={handleRestore} 
                                disabled={isRestoring}
                            >
                                {isRestoring ? (
                                    <>
                                        <span className="loading loading-spinner"></span>
                                        Restauration...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="h-5 w-5" />
                                        Restaurer mon compte
                                    </>
                                )}
                            </button>
                        </div>

                        <p className="text-sm text-base-500 mt-4">
                            Cette page s'affichera à chaque connexion tant que votre compte n'est pas restauré.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
