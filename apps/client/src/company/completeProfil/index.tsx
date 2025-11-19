import { zodResolver } from '@hookform/resolvers/zod';

import penSvg from '../../../assets/edit-pen-svgrepo-com.svg?url';
import { useForm, type Resolver } from 'react-hook-form';
import {
    type completeProfilFormType,
    nafCode,
    StructureType,
    LegalStatus,
    completeProfilForm,
    type SignedUrlResponse,
} from './type';
import { FormSection } from '../../components/FormSection';
import { FormInput } from '../../components/FormInput';
import { CustomSelect } from '../../components/select';
import { FormSubmit } from '../../components/FormSubmit';
import { useMutation } from '@tanstack/react-query';
import { Navigate, useNavigate, useOutletContext } from 'react-router';
import { profileStore } from '../../store/profileStore';
import { ProfilePicture } from '../../components/profilPicture';
import type { companyProfile } from '../../types';
import { useFile } from '../../hooks/useFile';
import { useBlob } from '../../hooks/useBlob';
import type { userContext } from '../../protectedRoutes/type';
import { useUploadFile } from '../../hooks/useUploadFile';
import { useEffect, useState } from 'react';
export const CompleteProfil = () => {
    const formInputStyle = 'p-3';
    const navigate = useNavigate();
    const profil: companyProfile | null = profileStore((state) => state.profile);
    const updateProfil = profileStore((state) => state.updateProfil);
    const API_URL = import.meta.env.VITE_APIURL;
    const user = useOutletContext<userContext>();
    const payload = user.get(user.accessToken);
    const logoBlob = useBlob(profil?.logo ?? '');
    const logoFile = useFile(logoBlob, profil?.logo);
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
    const upload = useUploadFile();
    const {
        register,
        handleSubmit,
        formState: { errors },
        clearErrors,
    } = useForm<completeProfilFormType>({
        mode: 'onSubmit',
        resolver: zodResolver(completeProfilForm) as Resolver<completeProfilFormType>,
        defaultValues: {
            siretNumber: profil?.siretNumber ?? '',
            streetNumber: profil?.streetNumber ?? '',
            nafCode: profil?.nafCode,
            structureType: profil?.structureType,
            legalStatus: profil?.legalStatus,
            postalCode: profil?.postalCode ?? '',
            country: profil?.country ?? '',
            city: profil?.city ?? '',
            streetName: profil?.streetName ?? '',
            logo: logoFile,
        },
    });

    const { isPending, isError, error, mutateAsync } = useMutation({
        mutationFn: async (data: Omit<completeProfilFormType, 'logo'> & { logo?: string }) => {
            const res = await fetch(`${API_URL}/api/companies/${payload.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.accessToken}`,
                },
                credentials: 'include',
                body: JSON.stringify(data),
            });
            return res;
        },
        onSuccess: (_data, variables) => {
            //
            const payload: Partial<companyProfile> = {
                ...variables,
                siretNumber: variables.siretNumber ?? undefined,
                nafCode: variables.nafCode ?? undefined,
                structureType: variables.structureType ?? undefined,
                legalStatus: variables.legalStatus ?? undefined,
                streetNumber: variables.streetNumber ?? undefined,
                streetName: variables.streetName ?? undefined,
                postalCode: variables.postalCode ?? undefined,
                city: variables.city ?? undefined,
                country: variables.country ?? undefined,
            };
            updateProfil(payload);
        },
    });
 const onSubmit = async (data: completeProfilFormType) => {
    const { logo: fileLogo, ...rest } = data;

    const base: Omit<completeProfilFormType, "logo"> = rest;
    const dataToSend: Omit<completeProfilFormType, "logo"> & { logo?: string } = { ...base };

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

        // On ajoute logo typé automatiquement comme string
        dataToSend.logo = logo;
    }

    else if (typeof fileLogo === "string" && fileLogo ) {
        dataToSend.logo = fileLogo;
    }
    await mutateAsync(dataToSend);
    navigate(`/${payload.role.toLowerCase}/dashboard`)
};   
    return (
        <div className="flex flex-col w-full min-h-screen flex-grow items-start bg-(--color-base-200)">
            <div className="w-full max-w-7xl mx-auto flex flex-col px-4 py-8 items-center">
                <p className="text-3xl font-bold mt-10 ml-15"> Compléter le profil de votre entreprise</p>
                <p className="text-sm mt-4 ml-15 italic">
                    Ces informations nous aiderons à valider votre entreprise. elles ne seront pas toutes affichées
                    publiquement.
                </p>
                <form
                    className="mt-8 w-full max-w-3xl flex flex-col flex-1 "
                    onSubmit={handleSubmit(onSubmit)}
                    role="form"
                >
                    <FormSection
                        title="Photo de profil de l'entreprise"
                        className="bg-(--color-base-100) p-6 rounded-(--radius-box) shadow-md mb-6 flex flex-col gap-4"
                    >
                        <div className="flex flex-row items-center justify-around gap-4">
                            <div className="w-[110px] h-[110px]">
                                <ProfilePicture
                                    src={logoUrl!}
                                    overlay
                                    overlayPicture={penSvg}
                                    register={register('logo')}
                                    error={errors.logo}
                                />
                            </div>

                            <div className="flex flex-col">
                                <span className="font-stretch-105% italic mb-1">
                                    Téléchargez le logo de votre entreprise, il sera visible publiquement.
                                </span>
                                <span className="text-sm text-gray-600 italic">PNG, JPG jusqu'à 5MB.</span>
                            </div>
                        </div>
                    </FormSection>
                    <FormSection
                        title="Informations légales et administratives"
                        className=" bg-(--color-base-100) p-6 rounded-(--radius-box) shadow-md mb-6 flex flex-col gap-4"
                    >
                        <FormInput<completeProfilFormType>
                            type="text"
                            label="Numéro SIRET"
                            placeholder="14 chiffres"
                            className={`${formInputStyle}`}
                            register={register('siretNumber', {
                                required: true,
                                onChange: () => clearErrors('siretNumber'),
                            })}
                            error={errors.siretNumber}
                        />
                        <div className="flex w-full flex-row">
                            <div className="w-1/2">
                                <CustomSelect
                                    data={Object.values(nafCode)}
                                    label="Code NAF"
                                    defaultText="Selectionnez un code"
                                    error={errors.nafCode}
                                    className="bg-base-100"
                                    {...register('nafCode')}
                                />
                            </div>
                            <div className="w-1/2">
                                <CustomSelect
                                    data={Object.values(StructureType)}
                                    label="Type de structure"
                                    defaultText="Selectionnez un type"
                                    error={errors.structureType}
                                    className="bg-base-100"
                                    {...register('structureType')}
                                />
                            </div>
                        </div>
                        <div className="w-full flex flex-col">
                            <CustomSelect
                                data={Object.values(LegalStatus)}
                                label="Status légal"
                                defaultText="Selectionnez un statut"
                                error={errors.legalStatus}
                                className="bg-base-100 w-full"
                                {...register('legalStatus')}
                            />
                        </div>
                    </FormSection>
                    <FormSection
                        title="Adresse du siège social"
                        className=" bg-(--color-base-100) p-6 rounded-(--radius-box) shadow-md mb-6 flex flex-col gap-4"
                    >
                        <div className="flex w-full flex-row gap-6">
                            <div className="w-1/2">
                                <FormInput<completeProfilFormType>
                                    type="text"
                                    label="Numéro du rue"
                                    placeholder="ex:12 bis"
                                    className={`${formInputStyle}`}
                                    register={register('streetNumber', {
                                        required: true,
                                        onChange: () => clearErrors('streetNumber'),
                                    })}
                                    error={errors.streetNumber}
                                />
                            </div>
                            <div className="w-1/2">
                                <FormInput<completeProfilFormType>
                                    type="text"
                                    label="Nom de rue"
                                    placeholder="ex:Avenue des champs-élysées"
                                    className={`${formInputStyle}`}
                                    register={register('streetName', {
                                        required: true,
                                        onChange: () => clearErrors('streetName'),
                                    })}
                                    error={errors.streetName}
                                />
                            </div>
                        </div>
                        <div className="w-full flex flex-row gap-6">
                            <div className="w-1/2">
                                <FormInput<completeProfilFormType>
                                    type="text"
                                    label="Code postal"
                                    placeholder="ex: 75008"
                                    className={`${formInputStyle}`}
                                    register={register('postalCode', {
                                        required: true,
                                        onChange: () => clearErrors('postalCode'),
                                    })}
                                    error={errors.postalCode}
                                />
                            </div>
                            <div className="w-1/2">
                                <FormInput<completeProfilFormType>
                                    type="text"
                                    label="Ville"
                                    placeholder="ex: Paris"
                                    className={`${formInputStyle}`}
                                    register={register('city', {
                                        required: true,
                                        onChange: () => clearErrors('city'),
                                    })}
                                    error={errors.city}
                                />
                            </div>
                        </div>

                        <FormInput<completeProfilFormType>
                            type="text"
                            label="Pays"
                            placeholder="ex: France"
                            className={`${formInputStyle}`}
                            register={register('country', {
                                required: true,
                                onChange: () => clearErrors('country'),
                            })}
                            error={errors.country}
                        />
                    </FormSection>
                    <FormSubmit
                        className="bg-primary w-min p-5 self-end font-bold"
                        title="Completer le profile"
                        pendingTitle="Completion"
                        error={error}
                        isError={isError}
                        isPending={isPending}
                    />
                </form>
            </div>
        </div>
    );
};
