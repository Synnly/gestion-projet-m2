import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type Resolver } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { userStore } from '../../store/userStore';
import { profileStore } from '../../store/profileStore';
import { Navbar } from '../../components/navbar/Navbar';
import { FormSection } from '../../components/form/FormSection';
import { TextAreaEdit } from '../../components/form/TextAreaEdit';
import { FormSubmit } from '../../components/form/FormSubmit';
import { ProfilePicture } from '../../components/profile/profilPicture';
import { useFile } from '../../hooks/useFile';
import { useBlob } from '../../hooks/useBlob';
import { useUploadFile } from '../../hooks/useUploadFile';
import { useEffect, useState } from 'react';
import { UseAuthFetch } from '../../hooks/useAuthFetch';
import { useGetStudentProfile } from '../../hooks/useGetStudentProfile.ts';
import { editProfilForm, type editProfilFormType, type studentProfile } from '../../types/student.types.ts';
import type { SignedUrlResponse } from '../../company/completeProfil/type.tsx';
import { FormFileInput } from '../../components/form/FormFileInput.tsx';
import { Eye, X } from 'lucide-react';

export const EditStudentProfile = () => {
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_APIURL;

    // Récupérer les informations utilisateur
    const access = userStore((state) => state.access);
    const getUserInfo = userStore((state) => state.get);
    const userInfo = access ? getUserInfo(access) : null;

    // Récupérer et mettre à jour le profil
    const updateProfileStore = profileStore((state) => state.updateProfil);
    const { data: profile, isLoading } = useGetStudentProfile(userInfo?.id || '');

    // Gestion de la photo de profil
    const profilePictureBlob = useBlob(profile?.profilePicture ?? '');
    const profilePictureFile = useFile(profilePictureBlob, profile?.profilePicture);
    const [profilePictureUrl, setPfpUrl] = useState<string | null>(null);

    // Gestion du CV par défaut
    const defaultCvBlob = useBlob(profile?.defaultCv ?? '');
    const defaultCvFile = useFile(defaultCvBlob, profile?.defaultCv);
    const [defaultCv, setDefaultCv] = useState<File | null>(null);

    const [modalOpen, setModalOpen] = useState(false);

    const upload = useUploadFile();
    const authFetch = UseAuthFetch();

    useEffect(() => {
        if (!profilePictureBlob) {
            setPfpUrl(null);
            return;
        }
        const objectUrl = URL.createObjectURL(profilePictureBlob);
        setPfpUrl(objectUrl);
        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [profilePictureBlob]);

    useEffect(() => {
        if (defaultCvFile?.name === defaultCv?.name) return;
        setDefaultCv(defaultCvFile ?? null);
    }, [defaultCvFile]);

    const {
        register,
        handleSubmit,
        formState: { errors },
        clearErrors,
        reset,
    } = useForm<editProfilFormType>({
        resolver: zodResolver(editProfilForm) as Resolver<editProfilFormType>,
        mode: 'onChange',
    });

    // Réinitialiser le formulaire avec les données du profil
    useEffect(() => {
        if (profile) {
            reset({
                tagLine: profile?.tagLine ?? '',
                biography: profile?.biography ?? '',
                profilePicture: profilePictureFile ?? undefined,
                defaultCv: defaultCvFile ?? undefined,
            });
        }
    }, [profile, reset]);

    const { isPending, isError, error, mutateAsync } = useMutation({
        mutationFn: async (
            data: Omit<editProfilFormType, 'profilePicture' | 'defaultCv'> & {
                profilePicture?: string;
                defaultCv?: string;
            },
        ) => {
            const res = await authFetch(`${API_URL}/api/students/${userInfo?.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${access}`,
                },
                data: JSON.stringify(data),
            });
            if (!res.ok) {
                throw new Error('Erreur lors de la mise à jour du profil');
            }
            return res;
        },
        onSuccess: (_data, variables) => {
            const payload: Partial<studentProfile> = {
                ...variables,
                tagLine: variables.tagLine ?? undefined,
                biography: variables.biography ?? undefined,
                profilePicture: variables.profilePicture ?? undefined,
                defaultCv: variables.defaultCv ?? undefined,
            };
            updateProfileStore(payload);
            navigate('/student/profile');
        },
    });

    const onSubmit = async (data: editProfilFormType) => {
        const { profilePicture: filePfp, defaultCv: fileCv, ...rest } = data;
        const base: Omit<editProfilFormType, 'profilePicture' | 'defaultCv'> = rest;
        const dataToSend: Omit<editProfilFormType, 'profilePicture' | 'defaultCv'> & {
            profilePicture?: string;
            defaultCv?: string;
        } = { ...base };

        // Uploader la photo de profil si elle a été modifiée
        if (filePfp instanceof FileList && filePfp.length > 0) {
            const file = filePfp[0];
            const response = await authFetch(`${API_URL}/api/files/signed/logo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                data: JSON.stringify({ originalFilename: file.name }),
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la récupération du lien signé');
            }

            const { fileName, uploadUrl }: SignedUrlResponse = await response.json();
            await upload(file, uploadUrl);
            dataToSend.profilePicture = fileName;
        }

        // Uploader le CV par défaut si il a été modifié
        if (fileCv instanceof FileList && fileCv.length > 0) {
            const file = fileCv[0];
            const response = await authFetch(`${API_URL}/api/files/signed/cv`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                data: JSON.stringify({ originalFilename: file.name }),
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la récupération du lien signé');
            }

            const { fileName, uploadUrl }: SignedUrlResponse = await response.json();
            await upload(file, uploadUrl);
            dataToSend.defaultCv = fileName;
        }

        await mutateAsync(dataToSend);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-base-100">
                <Navbar />
                <div className="p-8 max-w-7xl mx-auto">
                    <p className="text-base-500">Chargement...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base-100">
            <Navbar />
            <div className="p-8">
                <div className="w-full max-w-4xl mx-auto px-4 py-8 flex flex-col items-center bg-base-200 rounded-lg shadow">
                    <h1 className="text-3xl font-bold">Modifier votre profil</h1>
                    <p className="text-sm mt-2 italic text-base-600">
                        Mettez à jour les informations publiques de votre profil étudiant.
                    </p>

                    <form className="mt-8 w-full max-w-3xl flex flex-col flex-1" onSubmit={handleSubmit(onSubmit)}>
                        <FormSection title="Photo de profil" className="mb-8">
                            <div className="flex">
                                <ProfilePicture
                                    src={profilePictureUrl!}
                                    overlay
                                    register={register('profilePicture')}
                                    error={errors.profilePicture}
                                />
                                <div className="flex flex-col justify-center ml-4">
                                    <span className="font-stretch-105% italic mb-1">
                                        Téléchargez votre photo de profil, il sera visible publiquement.
                                    </span>
                                    <span className="text-sm text-base-600 italic">PNG, JPG jusqu'à 5MB.</span>
                                </div>
                            </div>
                        </FormSection>

                        <FormSection title="Informations non modifiables" className="mb-8">
                            <div className="space-y-4">
                                <div className="flex flex-row gap-4">
                                    <div className="flex-1">
                                        <div className="card-title">Nom</div>
                                        <div>{profile?.lastName || ''}</div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="card-title">Prénom</div>
                                        <div>{profile?.firstName || ''}</div>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="card-title">Email</div>
                                    <div>{profile?.email || ''}</div>
                                </div>
                            </div>
                        </FormSection>

                        <FormSection title="Informations publiques" className="mb-8 space-y-4">
                            <div className="flex flex-col gap-4">
                                <TextAreaEdit<editProfilFormType>
                                    label="Phrase d'accroche"
                                    type="text"
                                    placeholder="(max 200 caractères)"
                                    register={register('tagLine', {
                                        onChange: () => clearErrors('tagLine'),
                                    })}
                                    error={errors.tagLine}
                                    className="textarea textarea-primary"
                                />
                                <TextAreaEdit<editProfilFormType>
                                    label="Biographie"
                                    type="text"
                                    placeholder="(max 1000 caractères)"
                                    register={register('biography', {
                                        onChange: () => clearErrors('biography'),
                                    })}
                                    error={errors.biography}
                                    className="textarea textarea-primary"
                                />
                                <div className="flex flex-row gap-4 items-end">
                                    <FormFileInput<editProfilFormType>
                                        label="Cv par défaut (facultatif)"
                                        register={register('defaultCv', {
                                            onChange: () => clearErrors('defaultCv'),
                                        })}
                                        error={errors.defaultCv}
                                        setFile={setDefaultCv}
                                    />
                                    <button
                                        type="button"
                                        className={`btn btn-secondary ${!defaultCv && 'btn-disabled'}`}
                                        onClick={() => setModalOpen(true)}
                                    >
                                        Aperçu <Eye />
                                    </button>
                                </div>
                            </div>
                        </FormSection>

                        {modalOpen && defaultCv && (
                            <div className="modal modal-open" onClick={() => setModalOpen(false)}>
                                <div
                                    className="modal-box w-full h-full max-w-4xl max-h-[90vh] flex flex-col p-4"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-lg">Aperçu</h3>
                                        <button
                                            onClick={() => setModalOpen(false)}
                                            className="btn btn-sm btn-circle btn-ghost"
                                        >
                                            <X />
                                        </button>
                                    </div>
                                    <div className="flex flex-1 bg-base-200 rounded-lg overflow-hidden">
                                        <iframe
                                            src={URL.createObjectURL(defaultCv)}
                                            className="w-full h-full"
                                            title="Document"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {isError && (
                            <div className="bg-error border border-error-content rounded-lg p-4 mb-4">
                                <p className="text-error-content">Erreur: {error?.message}</p>
                            </div>
                        )}

                        <div className="flex gap-4 mt-6 justify-end">
                            <button type="button" onClick={() => navigate('/student/profile')} className="btn btn-base">
                                Annuler
                            </button>
                            <FormSubmit
                                isPending={isPending}
                                title="Enregistrer les modifications"
                                pendingTitle="Enregistrement..."
                                isError={isError}
                                error={error}
                                className="btn btn-primary"
                            />
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
