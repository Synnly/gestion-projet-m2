import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm, type Resolver } from 'react-hook-form';
import z from 'zod';
import { CustomForm } from '../../../components/CustomForm';
import { FormInput } from '../../../components/FormInput';
import { FormSubmit } from '../../../components/FormSubmit';
import type { Dispatch, SetStateAction } from 'react';
import { NavLink } from 'react-router';

const passwordSchema = z.object({
    email: z.string().min(1, { message: "l'email est requis" }).email('Adresse e-mail invalide'),
});
type ForgotPasswordType = z.infer<typeof passwordSchema>;

export const ForgotPasswordStep1 = ({
    setStep,
    mailRef,
    errorAttempts,
    resetMain,
}: {
    setStep: Dispatch<SetStateAction<number>>;
    mailRef: React.MutableRefObject<string>;
    errorAttempts?: Error;
    isErrorAttempts?: boolean;
    resetMain: () => void;
}) => {
    const API_URL = import.meta.env.VITE_APIURL;
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordType>({
        resolver: zodResolver(passwordSchema) as Resolver<ForgotPasswordType>,
    });

    const { mutateAsync, isPending, isError, error, reset, isSuccess } = useMutation({
        mutationFn: async (data: ForgotPasswordType) => {
            const res = await fetch(`${API_URL}/api/mailer/password/forgot`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
                credentials: 'include',
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Une erreur est survenue');
            }
            return res;
        },
    });
    const onSubmit = async (data: ForgotPasswordType) => {
        await mutateAsync(data);
        mailRef.current = data.email;
        setStep(2);
    };
    return (
        <>
            {/* Logo */}
            <div className="text-center">
                <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBCyGZHkXQD-SQhpDh7YcLyhsxmM4KXOXYrUfNmFccX7oASPRULTj9IZa2uZZt8ZVbOtNh5LZn3gWWO_ldBzGIkOiyJkQ3SoqLsUWSkOwLlDdDyHSmSoYC0tNdWQjxXuK7YTaLuHtvOD3R67v4y6mC7TUVl0XHPCQhT0L7hlJHqu0tMYSMpn9b0LDlAoF8JzM5rKcCAkByrB3ZEtqFwEP3-lzO7VHY7EqwY0hgpKqh2MPxxYridXTsjDb3FYiyBG1Z4PBud9UAU1l-0"
                    alt="Logo de l'application"
                    className="mx-auto h-10 w-auto"
                />
            </div>
            <h1 className="text-4xl font-bold text-center">Réinitialisation du mot de passe</h1>
            <p className="mt-4 text-sm text-center text-gray-500">
                Un lien de réinitialisation du mot de passe a été envoyé à votre adresse e-mail si elle est associée à
                un compte existant.
            </p>
            <CustomForm
                onSubmit={handleSubmit(onSubmit)}
                onClick={() => {
                    reset();
                    resetMain();
                }}
            >
                <FormInput
                    placeholder="Email"
                    error={errors.email}
                    label="Email"
                    type="email"
                    className="mt-0"
                    register={register('email')}
                />

                <FormSubmit
                    isError={isError}
                    error={error}
                    isPending={isPending}
                    title="Envoyer le lien de réinitialisation"
                    pendingTitle="Envoi en cours..."
                    className="bg-primary p-3 rounded-lg cursor-pointer w-full text-black"
                />

                {errorAttempts && (
                    <span className="text-red-500 mx-auto mt-1 bg-red-100 text-center p-3 text-sm">
                        {errorAttempts.message}
                    </span>
                )}
            </CustomForm>
            {isSuccess && <p className="font-bold text-center ">Mail envoyé</p>}
            <NavLink to="/signin" className="mt-4 text-sm text-center text-gray-500 underline">
                Retour à la page de connexion
            </NavLink>
        </>
    );
};
