import { useForm } from 'react-hook-form';
import { type companyFormLogin } from '../type';
import { FormInput } from '../../../components/form/FormInput';
import { FormSubmit } from '../../../components/form/FormSubmit';
import { CustomForm } from '../../../components/form/CustomForm';
import { useLogin } from '../../../hooks/useLogin';
import { NavLink } from 'react-router';
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
        <div className=" rounded-(--radius-box) flex-col flex items-center just py-10 px-5 my-5 max-w-[700px]">
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
                    pendingTitle="Connexion en cours..."
                    className="bg-primary rounded-lg cursor-pointer w-full text-black"
                />
            </CustomForm>
            <div className="flex flex-row gap-5 w-full mt-2">
                <NavLink to="/company/signup" className="mt-4 text-sm text-center text-gray-500 underline">
                    Créer un compte entreprise
                </NavLink>
            </div>
        </div>
    );
};
