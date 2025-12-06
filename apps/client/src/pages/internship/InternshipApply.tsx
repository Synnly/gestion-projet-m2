import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Navbar } from '../../components/navbar/Navbar';
import { Navigate, useNavigate, useParams } from 'react-router';
import Spinner from '../../components/Spinner/Spinner';
import FileInput from '../../components/inputs/fileInput/FileInput';
import InternshipDetail from '../../modules/internship/InternshipDetail';
import { useRef, useState, type FormEvent } from 'react';
import { userStore } from '../../store/userStore';
import { useUploadFile } from '../../hooks/useUploadFile';
import { type ModalHandle } from '../../components/ui/modal/Modal';
import { toast } from 'react-toastify';

const getfileExtension = (file: File): string => {
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

            if (res.status === 404) {
                return null;
            }

            if (res.ok) {
                const responseData = await res.json();
                return responseData;
            }

            throw new Error(`Erreur serveur: Statut ${res.status}`);
        },

        enabled: !!payload?.id && !!internshipId,
        staleTime: 1 * 60 * 1000, // 5 minutes
    });
    const { data, isLoading } = useQuery({
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
            if (!cv || !coverLetter) return false;
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
            upload(coverLetter, link.lmUrl);
            queryClient.invalidateQueries({ queryKey: ['application', payload?.id, internshipId] });
            return true;
        },
    });

    async function apply(e: FormEvent<HTMLFormElement>): Promise<void> {
        e.preventDefault();
        if (!cv || !coverLetter) return;
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
                        <Spinner />
                    ) : (
                        <div className="bg-base-100 mt-5 flex-1 flex-col gap-3 flex">
                            <div className="container mx-auto bg-base-100 rounded-lg flex-1 flex-col">
                                <div className="text-3xl font-bold mb-4 flex justify-between">
                                    <span>Encore un petit effort</span>
                                </div>
                                <form className="flex flex-col gap-6" onSubmit={(e) => apply(e)}>
                                    <div className="bg-base-100 font-bold">
                                        <div className="text-3xl">Annonce</div>
                                        <div className="font-bold">
                                            <InternshipDetail internship={data} applyable={false} />
                                        </div>
                                    </div>
                                    <div className="flex flex-row gap-3">
                                        <FileInput title="CV" file={cv} setFile={setCv} />
                                        <FileInput
                                            title="Lettre de motivation"
                                            file={coverLetter}
                                            setFile={setCoverLetter}
                                        />
                                    </div>
                                    {cv && coverLetter && (
                                        <div className="ml-full flex justify-end items-center">
                                            <button
                                                type="button"
                                                className="btn btn-secondary mr-4"
                                                onClick={() => navigate(-1)}
                                            >
                                                Annuler
                                            </button>
                                            <input type="submit" className="btn btn-primary  m-4" value="Postuler" />
                                        </div>
                                    )}
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
