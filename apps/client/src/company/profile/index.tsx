import { Navbar } from '../../components/navbar/Navbar';
import { userStore } from '../../store/userStore';
import { useGetCompanyProfile } from '../../hooks/useGetCompanyProfile';
import { useBlob } from '../../hooks/useBlob';
import { NavLink } from 'react-router';
import { useEffect, useState } from 'react';

export function CompanyProfile() {
    // Récupérer l'ID de l'utilisateur connecté depuis le token
    const access = userStore((state) => state.access);
    const getUserInfo = userStore((state) => state.get);
    const userInfo = access ? getUserInfo(access) : null;

    // Récupérer le profil complet depuis l'API
    const { data: profile, isError, isLoading, error } = useGetCompanyProfile(userInfo?.id || '');

    // Récupérer le logo depuis MinIO
    const logoBlob = useBlob(profile?.logo ?? '');
    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!logoBlob) {
            setLogoUrl(null);
            return;
        }
        const objectUrl = URL.createObjectURL(logoBlob);
        setLogoUrl(objectUrl);
        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [logoBlob]);

    return (
        <div className="min-h-screen bg-base-100">
            <Navbar />
            <div className="p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-base-900">Profil de l'entreprise</h1>
                        <div className="flex gap-4">
                            <NavLink to="/company/profile/edit" className="btn btn-primary rounded-xl">
                                Modifier le profil
                            </NavLink>
                            <NavLink to="/company/profile/change-password" className="btn btn-error rounded-xl">
                                Modifier le mot de passe
                            </NavLink>
                        </div>
                    </div>

                    {isLoading && (
                        <div className="bg-base-100 rounded-lg shadow p-6 mb-6">
                            <p className="text-base-500">Chargement...</p>
                        </div>
                    )}

                    {isError && (
                        <div className="bg-error-100 border border-error rounded-lg p-6 mb-6">
                            <p className="text-error">Erreur lors du chargement du profil: {error?.message}</p>
                        </div>
                    )}

                    {profile && (
                        <div className="space-y-6">
                            {/* Informations principales */}
                            <div className="bg-base-200 rounded-lg shadow p-6">
                                <div className="flex items-start gap-6">
                                    {logoUrl && <img src={logoUrl} alt="Logo" className="w-24 h-24 object-contain" />}
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-semibold text-base-900 mb-2">{profile.name}</h2>
                                        <p className="text-base-600">{profile.email}</p>
                                        <div className="flex gap-4 mt-3">
                                            <span
                                                className={`px-3 py-1 rounded-full text-sm ${
                                                    profile.isVerified
                                                        ? 'bg-success text-success-content'
                                                        : 'bg-warning text-warning-content'
                                                }`}
                                            >
                                                {profile.isVerified ? '✓ Email vérifié' : 'Email non vérifié'}
                                            </span>
                                            <span
                                                className={`px-3 py-1 rounded-full text-sm ${
                                                    profile.isValid
                                                        ? 'bg-success text-success-content'
                                                        : 'bg-error text-error-content'
                                                }`}
                                            >
                                                {profile.isValid ? '✓ Compte validé' : 'Compte en attente'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Informations légales */}
                            <div className="bg-base-200 rounded-lg shadow p-6">
                                <h3 className="text-lg font-semibold text-base-900 mb-4">Informations légales</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {profile.siretNumber && (
                                        <div>
                                            <span className="text-base-500 text-sm">SIRET</span>
                                            <p className="font-medium">{profile.siretNumber}</p>
                                        </div>
                                    )}
                                    {profile.nafCode && (
                                        <div>
                                            <span className="text-base-500 text-sm">Code NAF</span>
                                            <p className="font-medium">{profile.nafCode}</p>
                                        </div>
                                    )}
                                    {profile.structureType && (
                                        <div>
                                            <span className="text-base-500 text-sm">Type de structure</span>
                                            <p className="font-medium">{profile.structureType}</p>
                                        </div>
                                    )}
                                    {profile.legalStatus && (
                                        <div>
                                            <span className="text-base-500 text-sm">Statut juridique</span>
                                            <p className="font-medium">{profile.legalStatus}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Adresse */}
                            {(profile.streetNumber ||
                                profile.streetName ||
                                profile.postalCode ||
                                profile.city ||
                                profile.country) && (
                                <div className="bg-base-200 rounded-lg shadow p-6">
                                    <h3 className="text-lg font-semibold text-base-900 mb-4">Adresse</h3>
                                    <div className="text-base-700 space-y-1">
                                        {profile.streetNumber || profile.streetName ? (
                                            <p>
                                                {profile.streetNumber} {profile.streetName}
                                            </p>
                                        ) : null}
                                        {profile.postalCode || profile.city ? (
                                            <p>
                                                {profile.postalCode} {profile.city}
                                            </p>
                                        ) : null}
                                        {profile.country && <p>{profile.country}</p>}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
