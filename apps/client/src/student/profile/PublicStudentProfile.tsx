import { useBlob } from '../../hooks/useBlob.tsx';
import { useEffect, useState } from 'react';
import { Navbar } from '../../components/navbar/Navbar.tsx';
import { Navigate } from 'react-router';
import { useGetStudentProfile } from '../../hooks/useGetStudentProfile.ts';
import { useParams } from 'react-router-dom';
import { StudentProfileInfo } from './StudentProfileInfo.tsx';

export const PublicStudentProfile = () => {
    const params = useParams();
    const studentId = params.studentId || '';

    const { data: profile, isError, isLoading, error } = useGetStudentProfile(studentId);

    const logoBlob = useBlob(profile?.profilePicture ?? '');
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

    if (!studentId) return <Navigate to={'/'} />;

    return (
        <div className="min-h-screen bg-base-100">
            <Navbar />
            <div className="p-8">
                <div className="max-w-4xl mx-auto">
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

                    {profile && <StudentProfileInfo profile={profile} logoUrl={logoUrl} />}
                </div>
            </div>
        </div>
    );
};
