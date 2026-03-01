import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Navbar } from '../common/navbar/Navbar';
import { useGetCompanyPublicProfile } from '../../hooks/useGetCompanyPublicProfile';
import { fetchFileFromSignedUrl, fetchPublicSignedUrl } from '../../hooks/useBlob';
import { useQuery } from '@tanstack/react-query';
import { Globe, Mail, MapPin, Phone } from 'lucide-react';

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

    const companyTitle = profile?.name ?? "l'entreprise";
    const aboutParagraphs = profile?.description
        ? profile.description
              .split(/\n{2,}/)
              .map((paragraph) => paragraph.trim())
              .filter(Boolean)
        : [];
    const companyAddress = profile?.address?.trim()
        ? [profile.address.trim()]
        : [
              [profile?.streetNumber, profile?.streetName].filter(Boolean).join(' '),
              [profile?.postalCode, profile?.city].filter(Boolean).join(' '),
              profile?.country,
          ].filter(Boolean);

    const websiteHref = profile?.website
        ? profile.website.startsWith('http://') || profile.website.startsWith('https://')
            ? profile.website
            : `https://${profile.website}`
        : null;
    const websiteLabel = profile?.website?.replace(/^https?:\/\//, '');

    return (
        <div className="min-h-screen bg-base-200">
            <Navbar />
            <div className="mx-auto w-full max-w-[1400px] px-4 py-8 md:px-8 md:py-10 lg:px-10">
                <div className="space-y-6">

                    {isLoading && (
                        <div className="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm">
                            <p className="text-base-500">Chargement...</p>
                        </div>
                    )}

                    {isError && (
                        <div className="rounded-2xl border border-error bg-error-100 p-6">
                            <p className="text-error">Erreur lors du chargement du profil: {error?.message}</p>
                        </div>
                    )}

                    {profile && (
                        <div className="grid gap-6 lg:grid-cols-[360px_1fr] xl:grid-cols-[400px_1fr]">
                            <aside className="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm md:p-7">
                                <div className="flex flex-col items-center text-center">
                                    {logoUrl ? (
                                        <img
                                            src={logoUrl}
                                            alt="Logo entreprise"
                                            className="h-24 w-24 rounded-2xl object-contain"
                                        />
                                    ) : (
                                        <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-base-200 text-3xl font-bold text-base-700">
                                            {profile.name?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <h2 className="mt-5 text-4xl font-semibold text-base-content">{profile.name}</h2>
                                </div>

                                <div className="mt-8 border-t border-base-300 pt-6">
                                    <div className="flex items-start gap-3">
                                        <MapPin className="mt-0.5 h-5 w-5 text-base-content/70" />
                                        <div>
                                            <p className="text-lg font-semibold text-base-content">Siège Social</p>
                                            {companyAddress.length > 0 ? (
                                                companyAddress.map((line) => (
                                                    <p key={line} className="text-base text-base-content/70">
                                                        {line}
                                                    </p>
                                                ))
                                            ) : (
                                                <p className="text-base text-base-content/50">Adresse non renseignée</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 space-y-4 border-t border-base-300 pt-6">
                                    {websiteHref && websiteLabel && (
                                        <div className="flex items-center gap-3 text-base">
                                            <Globe className="h-5 w-5 text-base-content/70" />
                                            <a
                                                href={websiteHref}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-medium text-primary hover:underline"
                                            >
                                                {websiteLabel}
                                            </a>
                                        </div>
                                    )}
                                    {profile.telephone && (
                                        <div className="flex items-center gap-3 text-base-content">
                                            <Phone className="h-5 w-5 text-base-content/70" />
                                            <p className="text-base font-medium">{profile.telephone}</p>
                                        </div>
                                    )}
                                    {profile.emailContact && (
                                        <div className="flex items-center gap-3 text-base-content">
                                            <Mail className="h-5 w-5 text-base-content/70" />
                                            <p className="break-all text-base font-medium">{profile.emailContact}</p>
                                        </div>
                                    )}
                                </div>
                            </aside>

                            <section className="rounded-2xl border border-base-300 bg-base-100 p-7 shadow-sm md:p-8">
                                <h3 className="text-4xl font-semibold leading-tight text-base-content">À propos de {companyTitle}</h3>
                                <div className="mt-6 space-y-5 text-lg leading-relaxed text-base-content/75">
                                    {aboutParagraphs.length > 0 ? (
                                        aboutParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)
                                    ) : (
                                        <p>
                                            Cette entreprise n&apos;a pas encore renseigné de description publique.
                                        </p>
                                    )}
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
