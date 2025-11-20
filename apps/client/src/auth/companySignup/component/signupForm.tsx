import { useForm, type Resolver, type SubmitHandler } from 'react-hook-form';
import { type companyFormSignUp, type registerForm } from '../type';
import { useMutation } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormSubmit } from '../../../components/FormSubmit';
import { CustomForm } from '../../../components/CustomForm';
import { companyFormSignUpSchema } from '../type';
import { useNavigate } from 'react-router';
import { FormInput } from '../../../components/FormInput';
import { userStore } from '../../../store/userStore';

export const SignupForm = () => {
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

    const setAccess = userStore((state) => state.set);
    const navigate = useNavigate();

    const API_URL = import.meta.env.VITE_APIURL || 'http://localhost:3000';

    const { mutateAsync, isPending, isError, error, reset } = useMutation({
        mutationFn: async ({ url, data }: registerForm) => {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
                credentials: 'include',
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(translateError(errorData.message) || 'Une erreur est survenue');
            }
            return res;
        },
    });

    const onSubmit: SubmitHandler<companyFormSignUp> = async (data: companyFormSignUp) => {
        const { repeatPassword, ...registerData } = data;
        const res = await mutateAsync({
            url: `${API_URL}/api/companies`,
            data: { ...registerData, role: 'COMPANY' },
        });

        if (res.ok) {
            const loginRes = await mutateAsync({
                url: `${API_URL}/api/auth/login`,
                data: { email: registerData.email, password: registerData.password },
            });

            const accessToken = await loginRes.text();
            setAccess(accessToken);
            //send code mail to verify
            await mutateAsync({
                url: `${API_URL}/api/mailer/auth/send-verification`,
                data: { email: registerData.email },
            });
            navigate('/verify');
        }
    };

    const handleBlur = async () => {
        await trigger(['password', 'repeatPassword']);
    };

    return (
        <div className="rounded-(--radius-box) flex-col flex items-center just py-10 px-5 my-5 max-w-[700px]">
            <CustomForm
                label="Accès à des milliers de talents. Inscrivez votre entreprise dès aujourd'hui."
                role="form"
                onSubmit={handleSubmit((data) => onSubmit(data))}
                className=" flex flex-col gap-8 mt-4 items-center"
                onClick={() => {
                    clearErrors();
                    reset();
                }}
            >
                <div className="w-full flex flex-col gap-5 justify-around">
                    <FormInput<companyFormSignUp>
                        register={register('name')}
                        placeholder="Nom"
                        label="Nom de l'entreprise"
                        type="text"
                        error={errors.name}
                    />
                    <FormInput<companyFormSignUp>
                        register={register('email')}
                        placeholder="Email"
                        label="Email"
                        type="email"
                        error={errors.email}
                    />

                    <FormInput<companyFormSignUp>
                        placeholder="Mot de passe"
                        register={register('password', { required: true, onBlur: handleBlur })}
                        label="Mot de passe"
                        type="password"
                        error={errors.password}
                    />

                    <FormInput<companyFormSignUp>
                        label="Repeter le mot de passe"
                        register={register('repeatPassword', { required: true, onBlur: handleBlur })}
                        error={errors.repeatPassword}
                        type="password"
                        placeholder="Repeter le mot de passe"
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
function translateError(message: string): string | undefined {
    const regex = /Company with email ([\w.-]+@[\w.-]+\.\w+) already exists/i;
    if (regex.test(message)) {
        return 'Une entreprise avec cet email existe déjà.';
    }
}
