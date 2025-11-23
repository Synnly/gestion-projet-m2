import { Navbar } from '../../components/Navbar';
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
    const { data: profile, isLoading, isError, error } = useGetCompanyProfile(userInfo?.id || '');

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
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">Profil de l'entreprise</h1>
                        <div className='flex gap-4'>
                            <NavLink
                                to="/company/profile/edit"
                                className="btn btn-primary text-black rounded-xl"
                            >
                                Modifier le profil
                            </NavLink>
                            <NavLink
                                to="/company/profile/change-password"
                                className="btn btn-warning bg-red-500 text-white rounded-xl"
                            >
                                Modifier le mot de passe
                            </NavLink>

                        </div>
                    </div>

                    {isLoading && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <p className="text-gray-500">Chargement...</p>
                        </div>
                    )}

                    {isError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                            <p className="text-red-600">
                                Erreur lors du chargement du profil: {error?.message}
                            </p>
                        </div>
                    )}

                    {profile && (
                        <div className="space-y-6">
                            {/* Informations principales */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-start gap-6">
                                    {logoUrl && (
                                        <img
                                            src={logoUrl}
                                            alt="Logo"
                                            className="w-24 h-24 object-contain"
                                        />
                                    )}
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                                            {profile.name}
                                        </h2>
                                        <p className="text-gray-600">{profile.email}</p>
                                        <div className="flex gap-4 mt-3">
                                            <span
                                                className={`px-3 py-1 rounded-full text-sm ${profile.isVerified
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                                    }`}
                                            >
                                                {profile.isVerified ? '✓ Email vérifié' : 'Email non vérifié'}
                                            </span>
                                            <span
                                                className={`px-3 py-1 rounded-full text-sm ${profile.isValid
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                    }`}
                                            >
                                                {profile.isValid ? '✓ Compte validé' : 'Compte en attente'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Informations légales */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Informations légales
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {profile.siretNumber && (
                                        <div>
                                            <span className="text-gray-500 text-sm">SIRET</span>
                                            <p className="font-medium">{profile.siretNumber}</p>
                                        </div>
                                    )}
                                    {profile.nafCode && (
                                        <div>
                                            <span className="text-gray-500 text-sm">Code NAF</span>
                                            <p className="font-medium">{profile.nafCode}</p>
                                        </div>
                                    )}
                                    {profile.structureType && (
                                        <div>
                                            <span className="text-gray-500 text-sm">Type de structure</span>
                                            <p className="font-medium">{profile.structureType}</p>
                                        </div>
                                    )}
                                    {profile.legalStatus && (
                                        <div>
                                            <span className="text-gray-500 text-sm">Statut juridique</span>
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
                                    <div className="bg-white rounded-lg shadow p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Adresse</h3>
                                        <div className="text-gray-700 space-y-1">
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
