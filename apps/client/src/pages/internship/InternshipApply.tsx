import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Navbar } from '../../components/navbar/Navbar';
import { Navigate, useNavigate, useParams } from 'react-router';
import FileInput from '../../components/inputs/fileInput/FileInput';
import InternshipDetail from '../../modules/internship/InternshipDetail';
import { useState, type FormEvent } from 'react';
import { userStore } from '../../store/userStore';
import { useUploadFile } from '../../hooks/useUploadFile';
import { toast } from 'react-toastify';
import type { Internship } from '../../types/internship.types';

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
            let errorMessage = `Erreur HTTP ${res.status}`;
            throw new Error(errorMessage);
        },

        enabled: !!payload?.id && !!internshipId,
        staleTime: 1 * 60 * 1000, // 5 minutes
    });
    const { data, isLoading } = useQuery<Internship>({
        queryKey: ['internship', internshipId],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_APIURL}/api/company/0/posts/${internshipId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });
            if (!res.ok) {
                throw new Error('Failed to fetch internship data');
            }
            return res.json();
        },
    });

    const [cv, setCv] = useState<File | null>(null);
    const [coverLetter, setCoverLetter] = useState<File | null>(null);
    const mutation = useMutation({
        mutationFn: async () => {
            if (!cv || (data?.isCoverLetterRequired && !coverLetter)) return;
            const fetchApply = await fetch(`${import.meta.env.VITE_APIURL}/api/application`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    studentId: payload?.id,
                    postId: internshipId,
                    cvExtension: getfileExtension(cv),
                    lmExtension: getfileExtension(coverLetter),
                }),
                credentials: 'include',
            });
            if (!fetchApply.ok) {
                return false;
            }
            const link = await fetchApply.json();
            upload(cv, link.cvUrl);
            if (coverLetter) upload(coverLetter, link.lmUrl);
            queryClient.invalidateQueries({ queryKey: ['application', payload?.id, internshipId] });
            return true;
        },
    });

    async function apply(e: FormEvent<HTMLFormElement>): Promise<void> {
        e.preventDefault();
        if (!data) return;
        if (!cv || (data.isCoverLetterRequired && !coverLetter)) return;
        const result = await mutation.mutateAsync();
        if (result) {
            setCoverLetter(null);
            setCv(null);
            toast.success('Candidature envoyée avec succès.', { toastId: 'application-success' });
            navigate('/');
        }
    }
    if (application) {
        toast.error('Vous avez déjà postulé à cette offre.', { toastId: 'already-applied-error' });
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
                                        <div className="flex flex-row gap-3">
                                            <FileInput
                                                title="CV"
                                                file={cv}
                                                setFile={setCv}
                                                svgColor="text-blue-600"
                                                required={true}
                                                dropMessage="Déposer votre CV ici"
                                            />
                                            <FileInput
                                                title="Lettre de motivation"
                                                file={coverLetter}
                                                setFile={setCoverLetter}
                                                svgColor="text-red-600"
                                                required={data.isCoverLetterRequired}
                                                dropMessage="Déposer votre lettre de motivation ici"
                                            />
                                        </div>
                                        {cv &&
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
