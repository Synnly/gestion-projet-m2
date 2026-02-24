import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Navbar } from '../common/navbar/Navbar';
import { useGetCompanyPublicProfile } from '../../hooks/useGetCompanyPublicProfile';
import { fetchFileFromSignedUrl, fetchPublicSignedUrl } from '../../hooks/useBlob';
import { useQuery } from '@tanstack/react-query';

export function PublicCompanyProfile() {
    const params = useParams();
    const companyId = params.companyId || '';

    const { data: profile, isError, isLoading, error } = useGetCompanyPublicProfile(companyId);

    const { data: logoBlob } = useQuery({
        queryKey: ['public-company-logo', profile?.logo],
        queryFn: async () => {
            const signedUrl = await fetchPublicSignedUrl(profile?.logo);
            if (!signedUrl) return null;
            return fetchFileFromSignedUrl(signedUrl);
        },
        enabled: !!profile?.logo,
        staleTime: 1000 * 60 * 60,
        gcTime: 1000 * 60 * 60,
    });
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

    if (!companyId) return <Navigate to={'/'} />;

    return (
        <div className="min-h-screen bg-base-100">
            <Navbar />
            <div className="p-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold text-base-900">Profil de l'entreprise</h1>
                    </div>

                    {isLoading && (
                        <div className="bg-base-100 rounded-lg shadow p-6">
                            <p className="text-base-500">Chargement...</p>
                        </div>
                    )}

                    {isError && (
                        <div className="bg-error-100 border border-error rounded-lg p-6">
                            <p className="text-error">Erreur lors du chargement du profil: {error?.message}</p>
                        </div>
                    )}

                    {profile && (
                        <>
                            <div className="bg-base-200 rounded-lg shadow p-6">
                                <div className="flex items-start gap-6">
                                    {logoUrl ? (
                                        <img src={logoUrl} alt="Logo entreprise" className="w-24 h-24 object-contain" />
                                    ) : (
                                        <div className="w-24 h-24 rounded-lg bg-base-300 flex items-center justify-center text-3xl font-bold">
                                            {profile.name?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="flex flex-col flex-1 justify-center">
                                        <h2 className="text-2xl font-semibold text-base-900 mb-2">{profile.name}</h2>
                                        {profile.description && <p className="text-base-700">{profile.description}</p>}
                                    </div>
                                </div>
                            </div>

                            {(profile.telephone || profile.emailContact || profile.website) && (
                                <div className="bg-base-200 rounded-lg shadow p-6">
                                    <h3 className="text-lg font-semibold text-base-900 mb-4">Contact</h3>
                                    <div className="space-y-2 text-base-700">
                                        {profile.telephone && (
                                            <p>
                                                <span className="text-base-500 text-sm">Téléphone: </span>
                                                {profile.telephone}
                                            </p>
                                        )}
                                        {profile.emailContact && (
                                            <p>
                                                <span className="text-base-500 text-sm">Email: </span>
                                                {profile.emailContact}
                                            </p>
                                        )}
                                        {profile.website && (
                                            <p>
                                                <span className="text-base-500 text-sm">Site web: </span>
                                                <a
                                                    href={profile.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="link link-primary"
                                                >
                                                    {profile.website}
                                                </a>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {(profile.streetNumber || profile.streetName || profile.postalCode || profile.city || profile.country) && (
                                <div className="bg-base-200 rounded-lg shadow p-6">
                                    <h3 className="text-lg font-semibold text-base-900 mb-4">Adresse</h3>
                                    <div className="text-base-700 space-y-1">
                                        {(profile.streetNumber || profile.streetName) && (
                                            <p>
                                                {profile.streetNumber} {profile.streetName}
                                            </p>
                                        )}
                                        {(profile.postalCode || profile.city) && (
                                            <p>
                                                {profile.postalCode} {profile.city}
                                            </p>
                                        )}
                                        {profile.country && <p>{profile.country}</p>}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
