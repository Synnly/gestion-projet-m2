import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type Resolver } from 'react-hook-form';
import { type completeProfilFormType, nafCode, StructureType, LegalStatus, completeProfilForm } from './type';
import { FormSection } from '../../components/FormSection';
import { FormInput } from '../../components/FormInput';
import { CustomSelect } from '../../components/select';
import { FormSubmit } from '../../components/FormSubmit';
import { useMutation } from '@tanstack/react-query';
import { useOutletContext } from 'react-router';
import type { userContext } from '../../authRoutes/type';
import { profileStore } from '../../store/profileStore';
export const CompleteProfil = () => {
    const formInputStyle = 'p-3';
    const profil: completeProfilFormType | null = profileStore((state) => state.profile);
    const setProfile = profileStore((state) => state.setProfil);
    const API_URL = import.meta.env.VITE_APIURL;
    const user = useOutletContext<userContext>();
    const payload = user.get(user.accessToken);
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
        },
    });

    const { isPending, isError, error, mutateAsync } = useMutation({
        mutationFn: async (data: completeProfilFormType) => {
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
        onSuccess: (data, variables) => {
            setProfile(variables);
        },
    });
    const onSubmit = async (data: completeProfilFormType) => {
        await mutateAsync(data);
        setProfile(data);
    };
    if (!profil) {
        return <></>;
    }
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
