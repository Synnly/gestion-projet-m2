import { useNavigate } from 'react-router';
import { AlertTriangle, Info } from 'lucide-react';
import Logo from '../components/icons/Logo';
import { userStore } from '../store/userStore';

export function PendingValidation() {
    const navigate = useNavigate();
    const { logout } = userStore.getState();

    const handleLogout = () => {
        logout();
        navigate('/signin');
    };

    return (
        <div className="hero min-h-screen">
            <div className="hero-content flex-col max-w-md">
                <div className="text-center">
                    <Logo className="h-32 w-32 mx-auto mb-6" />
                    <h1 className="text-3xl font-bold mb-8">Compte en cours de validation</h1>
                </div>

                <div className="w-full space-y-6">
                    <div className="alert alert-warning">
                        <AlertTriangle className="h-6 w-6" />
                        <div className="text-left">
                            <p className="text-sm">
                                Votre compte entreprise a été créé avec succès et est actuellement en cours de
                                vérification par notre équipe d'administration.
                            </p>
                            <p className="text-sm mt-2">
                                Cette étape
                                permet de garantir la sécurité et la qualité des offres proposées sur notre plateforme.
                            </p>
                        </div>
                    </div>

                    <div className="alert alert-info">
                        <Info className="h-6 w-6" />
                        <span className="text-sm">
                            <strong>Temps de validation :</strong> généralement sous 24 à 48 heures ouvrées.
                        </span>
                    </div>

                    <button onClick={handleLogout} className="btn btn-primary w-full">
                        Se déconnecter
                    </button>
                </div>
            </div>
        </div>
    );
}
