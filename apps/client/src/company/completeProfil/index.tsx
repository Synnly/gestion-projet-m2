import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, type Resolver } from 'react-hook-form';
import {
    type completeProfilFormType,
    nafCode,
    StructureType,
    LegalStatus,
    completeProfilForm,
    type SignedUrlResponse,
} from './type';
import { FormSection } from '../../components/form/FormSection';
import { FormInput } from '../../components/form/FormInput';
import { CustomSelect } from '../../components/inputs/select/select';
import { FormSubmit } from '../../components/form/FormSubmit';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useOutletContext } from 'react-router';
import { profileStore } from '../../store/profileStore';
import { ProfilePicture } from '../../components/profile/profilPicture';
import type { companyProfile } from '../../types';
import { useFile } from '../../hooks/useFile';
import { useBlob } from '../../hooks/useBlob';
import type { userContext } from '../../protectedRoutes/type';
import { useUploadFile } from '../../hooks/useUploadFile';
import { useEffect, useState } from 'react';
import { UseAuthFetch } from '../../hooks/useAuthFetch';
import { GenericAutocomplete } from '../../components/inputs/autoComplete/genericAutoComplete';
import { type NominatimAddress, addressFetcher, getAddressLabel } from '../../api/autoCompleteAdress.tsx';
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
    const authFetch = UseAuthFetch();
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
        control,
        handleSubmit,
        formState: { errors },
        clearErrors,
    } = useForm<completeProfilFormType>({
        mode: 'onSubmit',
        resolver: zodResolver(completeProfilForm) as Resolver<completeProfilFormType>,
        defaultValues: {
            siretNumber: profil?.siretNumber ?? '',
            nafCode: profil?.nafCode,
            structureType: profil?.structureType,
            legalStatus: profil?.legalStatus,
            address: profil?.address ?? '',
            logo: logoFile,
        },
    });

    const { isPending, isError, error, mutateAsync } = useMutation({
        mutationFn: async (data: Omit<completeProfilFormType, 'logo'> & { logo?: string }) => {
            try {
                const res = await authFetch(`${API_URL}/api/companies/${payload.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${user.accessToken}`,
                    },
                    data: JSON.stringify(data),
                });
                return res;
            } catch (err) {
                if (err instanceof Error) {
                    throw new Error('Une erreur est survenue');
                }
            }
        },
        onSuccess: (_data, variables) => {
            //
            const payload: Partial<companyProfile> = {
                ...variables,
                siretNumber: variables.siretNumber ?? undefined,
                nafCode: variables.nafCode ?? undefined,
                structureType: variables.structureType ?? undefined,
                legalStatus: variables.legalStatus ?? undefined,
                address: variables.address ?? undefined,
            };
            updateProfil(payload);
        },
    });
    const onSubmit = async (data: completeProfilFormType) => {
        const { logo: fileLogo, ...rest } = data;

        const base: Omit<completeProfilFormType, 'logo'> = rest;
        const dataToSend: Omit<completeProfilFormType, 'logo'> & { logo?: string } = { ...base };

        if (fileLogo instanceof FileList && fileLogo.length > 0) {
            const file = fileLogo[0];

            const response = await authFetch(`${API_URL}/api/files/signed/logo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                data: JSON.stringify({ originalFilename: file.name }),
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
        navigate(`/`);
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
                        className="bg-base-100 p-6 shadow-md mb-6 flex flex-col gap-4"
                    >
                        <div className="flex flex-row items-center justify-around gap-4">
                            <div className="w-[110px] h-[110px]">
                                <ProfilePicture
                                    src={logoUrl!}
                                    overlay
                                    register={register('logo')}
                                    error={errors.logo}
                                />
                            </div>

                            <div className="flex flex-col">
                                <span className="font-stretch-105% italic mb-1">
                                    Téléchargez le logo de votre entreprise, il sera visible publiquement.
                                </span>
                                <span className="text-sm text-base-600 italic">PNG, JPG jusqu'à 5MB.</span>
                            </div>
                        </div>
                    </FormSection>
                    <FormSection
                        title="Informations légales et administratives"
                        className=" bg-base-100 p-6 shadow-md mb-6 flex flex-col gap-4"
                    >
                        <FormInput<completeProfilFormType>
                            type="text"
                            label="Numéro SIRET"
                            placeholder="14 chiffres"
                            className={`${formInputStyle}`}
                            register={register('siretNumber')}
                            onChange={() => clearErrors('siretNumber')}
                            error={errors.siretNumber}
                        />
                        <div className="flex w-full flex-row">
                            <div className="w-1/2">
                                <CustomSelect
                                    data={Object.values(nafCode)}
                                    label="Code NAF"
                                    defaultText="Sélectionnez un code"
                                    error={errors.nafCode}
                                    className="bg-base-100"
                                    {...register('nafCode')}
                                />
                            </div>
                            <div className="w-1/2">
                                <CustomSelect
                                    data={Object.values(StructureType)}
                                    label="Type de structure"
                                    defaultText="Sélectionnez un type"
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
                                defaultText="Sélectionnez un statut"
                                error={errors.legalStatus}
                                className="bg-base-100 w-full"
                                {...register('legalStatus')}
                            />
                        </div>
                    </FormSection>
                    <FormSection
                        title="Adresse du siège social"
                        className=" bg-base-100 p-6 shadow-md mb-6 flex flex-col gap-4"
                    >
                        <div className="flex w-full flex-row gap-6">
                            <div className="flex-1">
                                <Controller
                                    name="address"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <GenericAutocomplete<NominatimAddress>
                                            {...field}
                                            label="Adresse complète"
                                            placeholder="Tapez votre adresse..."
                                            isAutocompleteEnabled={false}
                                            fetcher={addressFetcher}
                                            getLabel={getAddressLabel}
                                            error={fieldState.error?.message}
                                        />
                                    )}
                                />
                            </div>
                        </div>
                    </FormSection>
                    <FormSubmit
                        className="btn-primary w-min self-end font-bold"
                        title="Compléter le profile"
                        pendingTitle="Complétion..."
                        error={error}
                        isError={isError}
                        isPending={isPending}
                    />
                </form>
            </div>
        </div>
    );
};
