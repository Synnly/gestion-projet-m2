import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Navigate, useNavigate, useParams } from 'react-router';
import { useState, type FormEvent } from 'react';
import { useUploadFile } from '../../hooks/useUploadFile';
import { toast } from 'react-toastify';
import type { Internship } from '../../types/internship.types';
import { UseAuthFetch } from '../../hooks/useAuthFetch';
import { userStore } from '../../stores/userStore';
import { Navbar } from '../common/navbar/Navbar';
import InternshipDetail from './components/InternshipDetail';
import FileInput from '../common/inputs/fileInput/FileInput';
import { useGetStudentProfile } from '../../hooks/useGetStudentProfile';

const getfileExtension = (file: File | null): string | null => {
    if (!file) return null;
    const parts = file.name.lastIndexOf('.');
    return file.name.substring(parts + 1).toLowerCase();
};

export const InternshipApply = () => {
    const internshipId = useParams().postId as string;
    const user = userStore((state) => state.access);
    const get = userStore((state) => state.get);
    const payload = user ? get(user) : null;
    const navigate = useNavigate();
    const upload = useUploadFile();
    const queryClient = useQueryClient();
    //even if we hide button if application alredy exists, we still need to check to avoid unsigned user to signIn and access apply page as company
    const { data: application, isLoading: isCheckLoading } = useQuery({
        queryKey: ['application', payload?.id, internshipId],

        queryFn: async () => {
            const url = `${import.meta.env.VITE_APIURL}/api/application/check?studentId=${payload?.id}&postId=${internshipId}`;

            const res = await fetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
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

        enabled: !!payload?.id && !!internshipId,
        staleTime: 1 * 60 * 1000, // 5 minutes
    });
    const { data, isLoading } = useQuery<Internship>({
        queryKey: ['internship', internshipId],
        queryFn: async () => {
            const res = await authFetch(`${import.meta.env.VITE_APIURL}/api/company/0/posts/${internshipId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!res.ok) {
                throw new Error('Failed to fetch internship data');
            }
            return res.json();
        },
    });

    const [cv, setCv] = useState<File | null>(null);
    const [coverLetter, setCoverLetter] = useState<File | null>(null);
    const [useDefaultCv, setUseDefaultCv] = useState(false);
    const [saveCvAsDefault, setSaveCvAsDefault] = useState(false);
    const authFetch = UseAuthFetch();
    const { data: studentProfile } = useGetStudentProfile(payload?.id || '');

    const hasDefaultCv = !!studentProfile?.defaultCv;

    const mutation = useMutation({
        mutationFn: async () => {
            if (data?.isCoverLetterRequired && !coverLetter) return;

            const canUseDefaultCv = useDefaultCv && hasDefaultCv;
            if (!canUseDefaultCv && !cv) return;

            const payloadBody: {
                studentId: string | undefined;
                postId: string;
                cvExtension?: string | null;
                useDefaultCv?: boolean;
                lmExtension?: string | null;
            } = {
                studentId: payload?.id,
                postId: internshipId,
                lmExtension: getfileExtension(coverLetter),
            };

            if (canUseDefaultCv) {
                payloadBody.useDefaultCv = true;
            } else {
                payloadBody.cvExtension = getfileExtension(cv);
            }

            const fetchApply = await authFetch(`${import.meta.env.VITE_APIURL}/api/application`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                data: JSON.stringify(payloadBody),
            });
            if (!fetchApply.ok) {
                return false;
            }
            const link = await fetchApply.json();

            if (!canUseDefaultCv && cv && link.cvUrl) {
                await upload(cv, link.cvUrl);

                if (saveCvAsDefault && payload?.id && link.cvFileName) {
                    await authFetch(`${import.meta.env.VITE_APIURL}/api/students/${payload.id}/profile`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        data: JSON.stringify({ defaultCv: link.cvFileName }),
                    });
                }
            }

            if (coverLetter && link.lmUrl) {
                await upload(coverLetter, link.lmUrl);
            }

            queryClient.invalidateQueries({ queryKey: ['application', payload?.id, internshipId] });
            queryClient.invalidateQueries({ queryKey: ['student-profile', payload?.id] });
            return true;
        },
    });

    async function apply(e: FormEvent<HTMLFormElement>): Promise<void> {
        e.preventDefault();
        if (!data) return;
        const canUseDefaultCv = useDefaultCv && hasDefaultCv;
        if ((!canUseDefaultCv && !cv) || (data.isCoverLetterRequired && !coverLetter)) return;

        if (!data.isVisible) {
            toast.error("Cette offre n'est plus disponible.", { toastId: 'post-not-visible-error' });
            navigate('/');
            return;
        }

        const result = await mutation.mutateAsync();
        if (result) {
            setCoverLetter(null);
            setCv(null);
            setUseDefaultCv(false);
            setSaveCvAsDefault(false);
            toast.success('Candidature envoyée avec succès.', { toastId: 'application-success' });
            navigate('/home');
        }
    }
    if (application) {
        toast.error('Vous avez déjà postulé à cette offre.', { toastId: 'already-applied-error' });
        return <Navigate to="/home" replace={true} />;
    }

    // Vérifier que l'annonce est visible
    if (data && !data.isVisible) {
        toast.error("Cette offre n'est plus disponible.", { toastId: 'post-not-visible-error' });
        return <Navigate to="/" replace={true} />;
    }
    return (
        <>
            <div className="flex flex-col min-h-screen">
                <Navbar />
                <div className="flex-1 flex flex-col">
                    {isLoading || isCheckLoading ? (
                        <span className="loading loading-spinner loading-md"></span>
                    ) : (
                        <div className="bg-base-100 mt-5 flex-1 flex-col gap-3 flex">
                            <div className="container mx-auto bg-base-100 rounded-lg flex-1 flex-col">
                                <div className="text-3xl font-bold mb-4 flex justify-between">
                                    <span>Encore un petit effort</span>
                                </div>
                                {data && (
                                    <form className="flex flex-col gap-6" onSubmit={(e) => apply(e)}>
                                        <div className="bg-base-100 font-bold">
                                            <div className="text-3xl">Annonce</div>
                                            <div className="font-bold">
                                                <InternshipDetail internship={data} applyable={false} />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <div className="rounded-xl border border-base-300 bg-base-200 p-4">
                                                <p className="font-semibold mb-3">Choix du CV</p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <button
                                                        type="button"
                                                        className={`btn h-auto min-h-16 justify-start text-left ${
                                                            useDefaultCv ? 'btn-primary' : 'btn-outline'
                                                        }`}
                                                        onClick={() => {
                                                            if (!hasDefaultCv) {
                                                                toast.info(
                                                                    'Aucun CV par défaut trouvé dans votre profil. Importez un nouveau CV ci-dessous.',
                                                                    { toastId: 'no-default-cv-info' },
                                                                );
                                                                return;
                                                            }
                                                            setUseDefaultCv(true);
                                                            setCv(null);
                                                        }}
                                                    >
                                                        Utiliser le CV de mon profil
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`btn h-auto min-h-16 justify-start text-left ${
                                                            !useDefaultCv ? 'btn-primary' : 'btn-outline'
                                                        }`}
                                                        onClick={() => setUseDefaultCv(false)}
                                                    >
                                                        Importer un nouveau CV
                                                    </button>
                                                    {useDefaultCv && (
                                                        <p className="text-base-content/80">
                                                            Votre CV par défaut du profil sera utilisé pour cette
                                                            candidature.
                                                        </p>
                                                    )}
                                                </div>

                                                {!hasDefaultCv && (
                                                    <p className="text-sm text-base-content/70 mt-2">
                                                        Aucun CV par défaut enregistré sur votre profil.
                                                    </p>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                                                <div className="flex flex-col gap-3">
                                                    {!useDefaultCv && (
                                                        <FileInput
                                                            title="CV"
                                                            file={cv}
                                                            setFile={setCv}
                                                            svgColor="text-blue-600"
                                                            required={true}
                                                            dropMessage="Déposer votre CV ici"
                                                        />
                                                    )}
                                                </div>

                                                <FileInput
                                                    title="Lettre de motivation"
                                                    file={coverLetter}
                                                    setFile={setCoverLetter}
                                                    svgColor="text-red-600"
                                                    required={data.isCoverLetterRequired}
                                                    dropMessage="Déposer votre lettre de motivation ici"
                                                />
                                            </div>

                                            {!useDefaultCv && (
                                                <>
                                                    <label className="label cursor-pointer justify-start gap-2">
                                                        <input
                                                            type="checkbox"
                                                            className="checkbox checkbox-secondary"
                                                            checked={saveCvAsDefault}
                                                            onChange={(e) => setSaveCvAsDefault(e.target.checked)}
                                                        />
                                                        <span className="label-text">
                                                            Enregistrer ce CV comme CV par défaut dans mon profil
                                                        </span>
                                                    </label>
                                                    {saveCvAsDefault && hasDefaultCv && (
                                                        <div className="alert alert-warning">
                                                            <span>Le CV par défaut est remplacé par le nouveau.</span>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                        {(useDefaultCv || cv) &&
                                            ((data.isCoverLetterRequired && coverLetter) ||
                                                !data.isCoverLetterRequired) && (
                                                <div className="ml-full flex justify-end items-center">
                                                    <button
                                                        type="button"
                                                        className="btn btn-secondary mr-4"
                                                        onClick={() => navigate(-1)}
                                                    >
                                                        Annuler
                                                    </button>
                                                    <input
                                                        type="submit"
                                                        className="btn btn-primary  m-4"
                                                        value="Postuler"
                                                    />
                                                </div>
                                            )}
                                    </form>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
