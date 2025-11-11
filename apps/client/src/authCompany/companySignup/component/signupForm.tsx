import { useForm, type Resolver, type SubmitHandler } from 'react-hook-form';
import { LegalStatus, nafCode, StructureType, type companyFormSignUp, type NafCode } from '../type';
import { companyFormSignUpSchema } from '../type';
import { useMutation } from '@tanstack/react-query';
import { userStore } from '../../../store/userStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormSection } from '../../../components/FormSection';
import { FormInput } from '../../../components/FormInput';
import { CustomSelect } from '../../../components/select';
import { FormSubmit } from '../../../components/FormSubmit';
import { CustomForm } from '../../../components/CustomForm';

type SignupFormProps = {
    askUserConfirmation: () => Promise<boolean>;
};
type loginDto = {
    email: string;
    password: string;
    role: 'COMPANY' | 'STUDENT' | 'ADMIN';
};
type registerForm = {
    url: string;
    data: companyFormSignUp | loginDto;
};

export const SignupForm = ({ askUserConfirmation }: SignupFormProps) => {
    function isComplete(data: {
        email: string;
        password: string;
        repeatPassword: string;
        name: string;
        siretNumber?: string | undefined;
        nafCode?: NafCode | undefined;
        structureType?:
            | 'Administration'
            | 'Association'
            | 'Private company'
            | 'Public company / SEM'
            | 'Mutual cooperative'
            | 'NGO'
            | undefined;
        LegalStatus?: string | undefined;
        streetNumber?: string | undefined;
        streetName?: string | undefined;
        postalCode?: string | undefined;
        city?: string | undefined;
        country?: string | undefined;
    }) {
        return (
            data.siretNumber &&
            data.nafCode &&
            data.structureType &&
            data.LegalStatus &&
            data.streetNumber &&
            data.streetName &&
            data.postalCode &&
            data.city &&
            data.country
        );
    }

    const {
        register,
        handleSubmit,
        formState: { errors },
        trigger,
        clearErrors,
    } = useForm<companyFormSignUp>({
        resolver: zodResolver(companyFormSignUpSchema) as Resolver<companyFormSignUp>,
        mode: 'onSubmit',
    });

    const API_URL = import.meta.env.VITE_APIURL || 'http://localhost:3000';

    const setUser = userStore((state) => state.set);

    const { mutateAsync, isPending, isError, error, reset } = useMutation({
        mutationFn: async ({ url, data }: registerForm) => {
            const res = await fetch(url, {
                method: 'POST',
                body: JSON.stringify(data),
            });
            return res;
        },
    });

    const onSubmit: SubmitHandler<companyFormSignUp> = async (data: companyFormSignUp) => {
        let confirmed = true;
        if (!isComplete(data)) confirmed = await askUserConfirmation();
        if (confirmed) {
            const res = await mutateAsync({ url: `${API_URL}/api/companies`, data });
            if (res.ok) {
                const loginRes = await mutateAsync({
                    url: `${API_URL}/api/auth/login`,
                    data: { email: data.email, password: data.password, role: 'COMPANY' },
                });
                const accessToken = await loginRes.text();
                setUser(accessToken, 'COMPANY', false);
            }
        }
    };

    const handleInputChange = async () => {
        await trigger(['password', 'repeatPassword']);
    };

    return (
        <CustomForm
            label="Inscrivez pour trouver vos futurs talents"
            role="form"
            onSubmit={handleSubmit(onSubmit)}
            onClick={() => {
                clearErrors();
                reset();
            }}
            className="w-full flex flex-col gap-8 mt-4 items-center"
        >
            <FormSection className="w-full flex flex-col gap-2" title="Information de connexion">
                <FormInput
                    label="Email*"
                    type="email"
                    register={register('email')}
                    error={errors.email}
                    className="border-1 rounded-lg p-2"
                />
                <FormInput
                    type="password"
                    label="Mot de passe*"
                    register={register('password', { required: true, onChange: handleInputChange })}
                    error={errors.password}
                    className="border-1 rounded-lg p-2"
                />
                <FormInput
                    type="password"
                    label="Confirmer le mot de passe*"
                    register={register('repeatPassword', {
                        required: true,
                        onChange: handleInputChange,
                    })}
                    error={errors.repeatPassword}
                    className="border-1 rounded-lg p-2"
                />
            </FormSection>
            <FormSection className="w-full flex flex-col gap-2" title="Information sur l'entreprise">
                <FormInput
                    label="Nom de l'entreprise*"
                    type="text"
                    register={register('name', { required: true })}
                    error={errors.name}
                    className="border-1 rounded-lg p-2"
                />

                <div className="flex flex-row w-full gap-1 ">
                    <div className="flex flex-col w-1/2">
                        <FormInput
                            label="Numérot SIRET (14 chiffres)"
                            type="text"
                            register={register('siretNumber')}
                            error={errors.siretNumber}
                            className="border-1 rounded-lg p-2"
                        />
                    </div>
                    <div className="flex flex-col w-1/2 justify-end">
                        <CustomSelect
                            label="code NAF"
                            data={Object.values(nafCode)}
                            {...register('nafCode')}
                            className="border-1 rounded-lg p-2 w-full"
                            defaultText="code NAF"
                            error={errors.nafCode}
                        />
                    </div>
                </div>
                <div className="flex flex-row gap-1">
                    <div className="flex flex-col w-1/2 ">
                        <CustomSelect
                            label="Statut légal"
                            data={Object.values(LegalStatus)}
                            {...register('LegalStatus')}
                            className="border-1 rounded-lg p-2 w-full"
                            defaultText="Statut légal"
                            error={errors.LegalStatus}
                        />
                    </div>
                    <div className="flex flex-col w-1/2">
                        <CustomSelect
                            label="Type de structure"
                            data={Object.values(StructureType)}
                            {...register('structureType')}
                            className="border-1 rounded-lg p-2 w-full"
                            defaultText="Type de structure"
                            error={errors.structureType}
                        />
                    </div>
                </div>
            </FormSection>
            <FormSection className="w-full flex flex-col gap-2" title="Adresse de l'entreprise">
                <div className="flex flex-row gap-1">
                    <div className="flex flex-col w-1/2">
                        <FormInput
                            label="Numero de rue"
                            register={register('streetNumber')}
                            className="border-1 rounded-lg p-2"
                            error={errors.streetNumber}
                        />
                    </div>
                    <div className="flex flex-col w-1/2">
                        <FormInput
                            label="Rue"
                            register={register('streetName')}
                            className="border-1 rounded-lg p-2"
                            error={errors.streetName}
                        />
                    </div>
                </div>
                <div className="flex flex-row gap-1">
                    <div className="flex flex-col w-1/2">
                        <FormInput
                            label="Code Postal"
                            register={register('postalCode')}
                            className="border-1 rounded-lg p-2"
                            error={errors.postalCode}
                        />
                    </div>
                    <div className="flex flex-col w-1/2">
                        <FormInput
                            label="Ville"
                            register={register('city')}
                            className="border-1 rounded-lg p-2"
                            error={errors.city}
                        />
                    </div>
                </div>
            </FormSection>
            <FormSubmit
                isPending={isPending}
                isError={isError}
                error={error}
                title="S'inscrire"
                pendingTitle="Inscription"
                className="bg-blue-600 text-white p-3 rounded-lg cursor-pointer"
            />
        </CustomForm>
    );
};
