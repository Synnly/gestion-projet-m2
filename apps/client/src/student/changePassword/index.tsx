import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type Resolver } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { userStore } from '../../store/userStore';
import { Navbar } from '../../components/navbar/Navbar';
import { FormSection } from '../../components/form/FormSection';
import { FormInputEdit } from '../../components/form/FormInputEdit';
import { FormSubmit } from '../../components/form/FormSubmit';
import { UseAuthFetch } from '../../hooks/useAuthFetch';

// Validation schema for password change
const changePasswordSchema = z
    .object({
        newPassword: z
            .string()
            .min(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
            .regex(/[A-Z]/, { message: 'Le mot de passe doit contenir au moins une lettre majuscule' })
            .regex(/[a-z]/, { message: 'Le mot de passe doit contenir au moins une lettre minuscule' })
            .regex(/[0-9]/, { message: 'Le mot de passe doit contenir au moins un chiffre' })
            .regex(/[^A-Za-z0-9]/, { message: 'Le mot de passe doit contenir au moins un symbole' }),
        confirmPassword: z.string().min(1, { message: 'Veuillez confirmer le mot de passe' }),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: 'Les mots de passe ne correspondent pas',
        path: ['confirmPassword'],
    });

type ChangePasswordFormType = z.infer<typeof changePasswordSchema>;

export function ChangePassword() {
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_APIURL;

    // Retrieve user information
    const access = userStore((state) => state.access);
    const getUserInfo = userStore((state) => state.get);
    const userInfo = access ? getUserInfo(access) : null;
    const authFetch = UseAuthFetch();
    const {
        register,
        handleSubmit,
        formState: { errors },
        clearErrors,
    } = useForm<ChangePasswordFormType>({
        resolver: zodResolver(changePasswordSchema) as Resolver<ChangePasswordFormType>,
    });

    const {
        mutateAsync,
        isPending,
        isError,
        error,
        reset: resetMutation,
    } = useMutation({
        mutationFn: async (data: ChangePasswordFormType) => {
            if (!userInfo) throw new Error('Utilisateur non connecté');
            const res = await authFetch(`${API_URL}/api/students/${userInfo.id}/profile`, {
                method: 'PUT',
                data: JSON.stringify({
                    password: data.newPassword,
                    isFirstTime: false,
                }),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Erreur lors du changement de mot de passe');
            }
            return res;
        },
        onSuccess: () => {
            navigate('/');
        },
    });

    const onSubmit = async (data: ChangePasswordFormType): Promise<void> => {
        console.log;
        await mutateAsync(data);
    };

    const formInputStyle = 'input input-primary w-full rounded-xl';

    return (
        <div className="min-h-screen bg-base-100">
            <Navbar />
            <div className="p-8">
                <div className="w-full max-w-4xl mx-auto px-4 py-8 flex flex-col items-center bg-base-100 rounded-lg shadow shadow-base-300">
                    <h1 className="text-3xl font-bold text-base-content text-center">Changer votre mot de passe</h1>
                    <p className="text-sm mt-2 italic text-base-content mb-4">
                        Pour des raisons de sécurité, vous devez changer votre mot de passe lors de votre première
                        connexion.
                    </p>
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="mt-4 w-full max-w-md flex flex-col flex-1"
                        onChange={() => {
                            clearErrors();
                            resetMutation();
                        }}
                    >
                        <FormSection title="Nouveau mot de passe" className="mb-8 space-y-4">
                            <FormInputEdit<ChangePasswordFormType>
                                className={formInputStyle}
                                register={register('newPassword')}
                                label="Nouveau mot de passe"
                                type="password"
                                error={errors.newPassword}
                                placeholder="Entrez votre nouveau mot de passe"
                            />
                            <div className="mt-2 text-xs text-base-content space-y-1">
                                <p>Le mot de passe doit contenir :</p>
                                <ul className="list-disc list-inside pl-2 space-y-1">
                                    <li>Au moins 8 caractères</li>
                                    <li>Une lettre majuscule</li>
                                    <li>Une lettre minuscule</li>
                                    <li>Un chiffre</li>
                                    <li>Un symbole (!@#$%^&*...)</li>
                                </ul>
                            </div>
                            <FormInputEdit<ChangePasswordFormType>
                                className={formInputStyle}
                                register={register('confirmPassword')}
                                label="Confirmer le mot de passe"
                                type="password"
                                error={errors.confirmPassword}
                                placeholder="Confirmez votre nouveau mot de passe"
                            />
                            <FormSubmit
                                isPending={isPending}
                                isError={isError}
                                error={error}
                                title="Changer le mot de passe"
                                pendingTitle="Changement en cours..."
                                className="w-full btn btn-primary text-black rounded-xl"
                            />
                        </FormSection>
                    </form>
                </div>
            </div>
        </div>
    );
}
