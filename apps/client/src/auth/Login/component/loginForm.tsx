import { useForm } from 'react-hook-form';
import { type companyFormLogin } from '../types';
import { FormInput } from '../../../components/FormInput';
import { FormSubmit } from '../../../components/FormSubmit';
import { useMutation } from '@tanstack/react-query';
import { CustomForm } from '../../../components/CustomForm';
import { userStore } from '../../../store/userStore';
import { useNavigate } from 'react-router';
export const LoginForm = () => {
    const {
        register,
        handleSubmit,
        formState: { errors },
        clearErrors,
    } = useForm<companyFormLogin>({
        mode: 'onSubmit',
    });
    const getUser = userStore((state) => state.get);
    const setUser = userStore((state) => state.set);
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_APIURL;
    const { mutateAsync, isPending, isError, error, reset } = useMutation({
        mutationFn: async (data: companyFormLogin) => {
            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });
            return res.text();
        },
    });

    const onSubmit = async (data: companyFormLogin): Promise<void> => {
        const accessToken = await mutateAsync(data);
        setUser(accessToken);
        const user = getUser(accessToken);
        if (user && user.role === 'COMPANY') {
            //redirect to company dashboard
            navigate('/complete-profil');
        }
    };
    return (
        <div className=" rounded-(--radius-box) flex-col flex items-center just py-10 px-5 my-5 max-w-[700px]">
            <CustomForm
                label="Accèder à votre compte entreprise"
                role="form"
                onSubmit={handleSubmit(onSubmit)}
                onClick={() => {
                    clearErrors();
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
                        error={errors.email}
                    />
                </div>
                <FormSubmit
                    isPending={isPending}
                    isError={isError}
                    error={error}
                    title="S'inscrire"
                    pendingTitle="Inscription"
                    className="bg-primary p-3 rounded-lg cursor-pointer w-full text-black"
                />
            </CustomForm>
        </div>
    );
};
