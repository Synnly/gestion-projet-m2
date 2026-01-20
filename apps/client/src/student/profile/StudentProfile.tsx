import { userStore } from '../../store/userStore.ts';
import { useBlob } from '../../hooks/useBlob.tsx';
import { useEffect, useState } from 'react';
import { Navbar } from '../../components/navbar/Navbar.tsx';
import { NavLink } from 'react-router';
import { useGetStudentProfile } from '../../hooks/useGetStudentProfile.ts';
import { StudentProfileInfo } from './StudentProfileInfo.tsx';

export function StudentProfile() {
    const access = userStore((state) => state.access);
    const getUserInfo = userStore((state) => state.get);
    const userInfo = access ? getUserInfo(access) : null;

    const { data: profile, isError, isLoading, error } = useGetStudentProfile(userInfo?.id || '');

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

    return (
        <div className="min-h-screen bg-base-100">
            <Navbar />
            <div className="p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-base-900">Profil étudiant</h1>
                        <div className="flex gap-4">
                            <NavLink to="/student/profile/edit" className="btn btn-primary rounded-xl">
                                Modifier le profil
                            </NavLink>
                            <NavLink to="/student/profile/change-password" className="btn btn-error rounded-xl">
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
                        <div className="w-full mt-8">
                            <StudentProfileInfo profile={profile} logoUrl={logoUrl} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
