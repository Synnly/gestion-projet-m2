import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type Resolver } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { userStore } from '../../store/userStore';
import { profileStore } from '../../store/profileStore';
import { Navbar } from '../../components/navbar/Navbar';
import { FormSection } from '../../components/form/FormSection';
import { FormInputEdit } from '../../components/form/FormInputEdit';
import { CustomSelect } from '../../components/inputs/select/select';
import { FormSubmit } from '../../components/form/FormSubmit';
import { ProfilePicture } from '../../components/profile/profilPicture';
import { useGetCompanyProfile } from '../../hooks/useGetCompanyProfile';
import { useFile } from '../../hooks/useFile';
import { useBlob } from '../../hooks/useBlob';
import { useUploadFile } from '../../hooks/useUploadFile';
import { useEffect, useState } from 'react';
import {
    type editProfilFormType,
    nafCode,
    StructureType,
    LegalStatus,
    editProfilForm,
    type SignedUrlResponse,
} from '../completeProfil/type';
import type { companyProfile } from '../../types';

export function EditCompanyProfile() {
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_APIURL;

    // Récupérer les informations utilisateur
    const access = userStore((state) => state.access);
    const getUserInfo = userStore((state) => state.get);
    const userInfo = access ? getUserInfo(access) : null;

    // Récupérer et mettre à jour le profil
    const updateProfileStore = profileStore((state) => state.updateProfil);
    const { data: profile, isLoading } = useGetCompanyProfile(userInfo?.id || '');

    // Gestion du logo
    const logoBlob = useBlob(profile?.logo ?? '');
    const logoFile = useFile(logoBlob, profile?.logo);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const upload = useUploadFile();

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

    const {
        register,
        handleSubmit,
        formState: { errors },
        clearErrors,
        reset,
    } = useForm<editProfilFormType>({
        resolver: zodResolver(editProfilForm) as Resolver<editProfilFormType>,
    });

    // Réinitialiser le formulaire avec les données du profil
    useEffect(() => {
        if (profile) {
            reset({
                streetNumber: profile.streetNumber ?? '',
                nafCode: profile.nafCode,
                structureType: profile.structureType,
                legalStatus: profile.legalStatus,
                postalCode: profile.postalCode ?? '',
                country: profile.country ?? '',
                city: profile.city ?? '',
                streetName: profile.streetName ?? '',
                logo: logoFile ?? undefined,
            });
        }
    }, [profile, reset]);

    const { isPending, isError, error, mutateAsync } = useMutation({
        mutationFn: async (data: Omit<editProfilFormType, 'logo'> & { logo?: string }) => {
            const res = await fetch(`${API_URL}/api/companies/${userInfo?.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${access}`,
                },
                credentials: 'include',
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                throw new Error('Erreur lors de la mise à jour du profil');
            }
            return res;
        },
        onSuccess: (_data, variables) => {
            const payload: Partial<companyProfile> = {
                ...variables,
                nafCode: variables.nafCode ?? undefined,
                structureType: variables.structureType ?? undefined,
                legalStatus: variables.legalStatus ?? undefined,
                streetNumber: variables.streetNumber ?? undefined,
                streetName: variables.streetName ?? undefined,
                postalCode: variables.postalCode ?? undefined,
                city: variables.city ?? undefined,
                country: variables.country ?? undefined,
            };
            updateProfileStore(payload);
            navigate('/company/profile');
        },
    });

    const onSubmit = async (data: editProfilFormType) => {
        const { logo: fileLogo, ...rest } = data;
        const base: Omit<editProfilFormType, 'logo'> = rest;
        const dataToSend: Omit<editProfilFormType, 'logo'> & { logo?: string } = { ...base };

        if (fileLogo instanceof FileList && fileLogo.length > 0) {
            const file = fileLogo[0];
            const response = await fetch(`${API_URL}/api/files/signed/logo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ originalFilename: file.name }),
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la récupération du lien signé');
            }

            const { fileName: logo, uploadUrl }: SignedUrlResponse = await response.json();
            await upload(file, uploadUrl);
            dataToSend.logo = logo;
        } else if (typeof fileLogo === 'string' && fileLogo) {
            dataToSend.logo = fileLogo;
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
                    <h1 className="text-3xl font-bold">Modifier le profil de votre entreprise</h1>
                    <p className="text-sm mt-2 italic text-base-600">
                        Mettez à jour les informations de votre entreprise
                    </p>

                    <form className="mt-8 w-full max-w-3xl flex flex-col flex-1" onSubmit={handleSubmit(onSubmit)}>
                        <FormSection title="Logo de l'entreprise" className="mb-8">
                            <div className="flex">
                                <ProfilePicture
                                    src={logoUrl!}
                                    overlay
                                    register={register('logo')}
                                    error={errors.logo}
                                />
                                <div className="flex flex-col justify-center ml-4">
                                    <span className="font-stretch-105% italic mb-1">
                                        Téléchargez le logo de votre entreprise, il sera visible publiquement.
                                    </span>
                                    <span className="text-sm text-base-600 italic">PNG, JPG jusqu'à 5MB.</span>
                                </div>
                            </div>
                        </FormSection>

                        <FormSection title="Informations non modifiables" className="mb-8">
                            <div className="space-y-3">
                                {/* EMAIL */}
                                <div>
                                    <label className="text-sm font-medium">Email</label>
                                    <input
                                        type="text"
                                        value={profile?.email || ''}
                                        readOnly
                                        className="input input-primary w-full cursor-not-allowed"
                                    />
                                    <span className="text-xs text-base-500 italic">
                                        L'email ne peut pas être modifié
                                    </span>
                                </div>

                                {/* SIRET */}
                                {profile?.siretNumber && (
                                    <div>
                                        <label className="text-sm font-medium">SIRET</label>
                                        <input
                                            type="text"
                                            value={profile?.siretNumber || ''}
                                            readOnly
                                            className="input input-primary w-full cursor-not-allowed"
                                        />
                                        <span className="text-xs text-base-500 italic">
                                            Le SIRET ne peut pas être modifié
                                        </span>
                                    </div>
                                )}
                            </div>
                        </FormSection>

                        <FormSection title="Informations légales" className="mb-8 space-y-4">
                            <div className="grid grid-cols-2 gap-6">
                                <CustomSelect
                                    label="Code NAF"
                                    data={Object.values(nafCode)}
                                    defaultText="Sélectionnez un code NAF"
                                    {...register('nafCode')}
                                    error={errors.nafCode}
                                    className="input input-primary w-full"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <CustomSelect
                                    label="Type de structure"
                                    data={Object.values(StructureType)}
                                    defaultText="Sélectionnez un type"
                                    {...register('structureType')}
                                    error={errors.structureType}
                                    className="input input-primary w-full"
                                />
                                <CustomSelect
                                    label="Statut juridique"
                                    data={Object.values(LegalStatus)}
                                    defaultText="Sélectionnez un statut"
                                    {...register('legalStatus')}
                                    error={errors.legalStatus}
                                    className="input input-primary w-full"
                                />
                            </div>
                        </FormSection>

                        <FormSection title="Adresse" className="mb-8 space-y-4">
                            <div className="flex gap-4">
                                <FormInputEdit<editProfilFormType>
                                    label="Numéro"
                                    type="text"
                                    placeholder="Numéro"
                                    register={register('streetNumber', {
                                        onChange: () => clearErrors('streetNumber'),
                                    })}
                                    error={errors.streetNumber}
                                    className="input input-primary"
                                />
                                <FormInputEdit<editProfilFormType>
                                    label="Rue"
                                    type="text"
                                    placeholder="Rue"
                                    register={register('streetName', {
                                        onChange: () => clearErrors('streetName'),
                                    })}
                                    error={errors.streetName}
                                    className="input input-primary"
                                />
                            </div>
                            <div className="flex gap-4">
                                <FormInputEdit<editProfilFormType>
                                    label="Code postal"
                                    type="text"
                                    placeholder="Code postal"
                                    register={register('postalCode', {
                                        onChange: () => clearErrors('postalCode'),
                                    })}
                                    error={errors.postalCode}
                                    className="input input-primary"
                                />
                                <FormInputEdit<editProfilFormType>
                                    label="Ville"
                                    type="text"
                                    placeholder="Ville"
                                    register={register('city', {
                                        onChange: () => clearErrors('city'),
                                    })}
                                    error={errors.city}
                                    className="input input-primary"
                                />
                                <FormInputEdit<editProfilFormType>
                                    label="Pays"
                                    type="text"
                                    placeholder="Pays"
                                    register={register('country', {
                                        onChange: () => clearErrors('country'),
                                    })}
                                    error={errors.country}
                                    className="input input-primary"
                                />
                            </div>
                        </FormSection>

                        {isError && (
                            <div className="bg-error border border-error-content rounded-lg p-4 mb-4">
                                <p className="text-error-content">Erreur: {error?.message}</p>
                            </div>
                        )}

                        <div className="flex gap-4 mt-6 justify-end">
                            <button
                                type="button"
                                onClick={() => navigate('/company/profile')}
                                className="btn btn-secondary"
                            >
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
}
