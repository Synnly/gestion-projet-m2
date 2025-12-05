import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm, type Resolver } from 'react-hook-form';
import z from 'zod';
import { CustomForm } from '../../../components/form/CustomForm';
import { FormInput } from '../../../components/form/FormInput';
import { FormSubmit } from '../../../components/form/FormSubmit';
import type { Dispatch, SetStateAction } from 'react';
import Logo from '../../../components/icons/Logo';
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
        clearErrors,
        formState: { errors },
    } = useForm<ForgotPasswordType>({
        resolver: zodResolver(passwordSchema) as Resolver<ForgotPasswordType>,
        mode: 'onSubmit',
    });

    const { mutateAsync, isPending, isError, error, reset, isSuccess } = useMutation({
        mutationFn: async (data: ForgotPasswordType) => {
            try {
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
                    throw new Error(errorData.message);
                }
                return res;
            } catch (err) {
                if (err instanceof Error) {
                    throw new Error(translateError(err.message) || 'Une erreur est survenue');
                }
            }
        },
    });
    const onSubmit = async (data: ForgotPasswordType) => {
        await mutateAsync(data);
        mailRef.current = data.email;
        setStep(2);
    };
    return (
        <>
            <div className="text-center mx-auto">
                <Logo className="text-primary" />
            </div>
            <h1 className="text-2xl py-10 font-bold text-center uppercase">Réinitialisation du mot de passe</h1>
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
                    type="text"
                    className="mt-0"
                    register={register('email')}
                    onChange={() => {
                        clearErrors('email');
                    }}
                />

                <FormSubmit
                    isError={isError}
                    error={error}
                    isPending={isPending}
                    title="Envoyer le lien de réinitialisation"
                    pendingTitle="Envoi en cours..."
                    className="bg-primary rounded-lg cursor-pointer w-full text-black"
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
function translateError(message: string): string | undefined {
    let translateMessage = "Une erreur est survenue, impossible d'envoyer l'e-mail";
    if (message === 'No account found with this email') {
        translateMessage = 'Aucun compte trouvé avec cet e-mail';
    }
    if (message === 'Too many requests. Please try again later.') {
        translateMessage = 'Veuillez réessayer plus tard.';
    }
    if (message === 'Failed to send password reset email') {
        translateMessage = "Échec de l'envoi de l'e-mail de réinitialisation du mot de passe";
    }
    return translateMessage;
}
