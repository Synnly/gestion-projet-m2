import { useForm, type Resolver } from 'react-hook-form';
import { companyFormLoginSchema, type companyFormLogin } from '../types';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormInput } from '../../../components/FormInput';
import { FormSubmit } from '../../../components/FormSubmit';
import { useMutation } from '@tanstack/react-query';
import { CustomForm } from '../../../components/CustomForm';
import { userStore } from '../../../store/userStore';

export const CompanyLoginForm = () => {
    const {
        register,
        handleSubmit,
        formState: { errors },
        trigger,
        clearErrors,
    } = useForm<companyFormLogin>({
        resolver: zodResolver(companyFormLoginSchema) as Resolver<companyFormLogin>,
        mode: 'onSubmit',
    });
    const setUser = userStore((state) => state.setUser);
    const API_URL = import.meta.env.VITE_API_URL;
    const { mutateAsync, isPending, isError, error, reset } = useMutation({
        mutationFn: async (data: companyFormLogin) => {
            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                body: JSON.stringify(data),
            });
            return res;
        },
    });

    const onSubmit = (data: companyFormLogin) => {
        const accessToken = mutateAsync(data);
        setUser(accessToken, 'COMPANY', false);
    };
    return (
        <CustomForm
            label="connectez-vous à votre compte entreprise"
            className="flex flex-col gap-4 w-full mt-4"
            onSubmit={handleSubmit(onSubmit)}
            onClick={() => {
                clearErrors();
                reset();
            }}
        >
            <FormInput
                label="Email"
                register={register('email')}
                error={errors.email}
                type="email"
                onChange={async () => {
                    await trigger('email');
                }}
            />
            <FormInput
                label="mot de passe"
                register={register('password')}
                error={errors.password}
                type="password"
                onChange={async () => {
                    await trigger('password');
                }}
            />
            <FormSubmit
                isPending={isPending}
                isError={isError}
                error={error}
                title="Se connecter"
                pendingTitle="connexion..."
                className="bg-blue-600 text-white p-3 rounded-lg cursor-pointer"
            />
        </CustomForm>
    );
};
