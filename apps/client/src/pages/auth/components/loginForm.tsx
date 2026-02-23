import { useForm } from 'react-hook-form';

import { useLogin } from '../../../hooks/useLogin';
import { NavLink } from 'react-router';
import { FormInput } from '../../common/form/FormInput';
import { CustomForm } from '../../common/form/CustomForm';
import { FormSubmit } from '../../common/form/FormSubmit';
import type { companyFormLogin } from '../../../types/Login.types';
export const LoginForm = () => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<companyFormLogin>({
        mode: 'onSubmit',
    });
    const { login, isPending, isError, error, reset } = useLogin();
    const onSubmit = async (data: companyFormLogin): Promise<void> => {
        login(data);
    };

    return (
        <div
            className=" rounded-(--radius-box) flex-col flex items-center justify-center
            px-5 my-5 max-w-[700px] gap-2"
        >
            <CustomForm
                label="Accéder à votre compte"
                role="form"
                onSubmit={handleSubmit(onSubmit)}
                onClick={() => {
                    reset();
                }}
                className=" flex flex-col gap-8 mt-4 items-center"
            >
                <div className="w-full flex flex-col gap-5 justify-around">
                    <FormInput<companyFormLogin>
                        register={register('email')}
                        placeholder="Email"
                        label="Email"
                        type="email"
                        error={errors.email}
                    />

                    <FormInput<companyFormLogin>
                        placeholder="Mot de passe"
                        register={register('password', { required: true })}
                        label="Mot de passe"
                        type="password"
                        error={errors.password}
                    />
                </div>
                <FormSubmit
                    isPending={isPending}
                    isError={isError}
                    error={error}
                    title="Se connecter"
                    pendingTitle="connexion..."
                    className="bg-primary rounded-lg cursor-pointer w-full text-black"
                />
            </CustomForm>
        </div>
    );
};
