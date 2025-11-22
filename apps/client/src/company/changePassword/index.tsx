import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type Resolver } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { userStore } from '../../store/userStore';
import { Navbar } from '../../components/Navbar';
import { FormSection } from '../../components/FormSection';
import { FormInput } from '../../components/FormInput';
import { FormSubmit } from '../../components/FormSubmit';

// Schéma de validation pour le changement de mot de passe
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

    // Récupérer les informations utilisateur
    const access = userStore((state) => state.access);
    const getUserInfo = userStore((state) => state.get);
    const userInfo = access ? getUserInfo(access) : null;

    const {
        register,
        handleSubmit,
        formState: { errors },
        clearErrors,
        reset,
    } = useForm<ChangePasswordFormType>({
        resolver: zodResolver(changePasswordSchema) as Resolver<ChangePasswordFormType>,
    });

    const { isPending, isError, error, mutateAsync } = useMutation({
        mutationFn: async (password: string) => {
            const res = await fetch(`${API_URL}/api/companies/${userInfo?.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${access}`,
                },
                credentials: 'include',
                body: JSON.stringify({ password }),
            });
            if (!res.ok) {
                throw new Error('Erreur lors de la modification du mot de passe');
            }
            return res;
        },
        onSuccess: () => {
            reset();
            navigate('/company/profile');
        },
    });

    const onSubmit = async (data: ChangePasswordFormType) => {
        await mutateAsync(data.newPassword);
    };

    const formInputStyle = 'p-3';

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="w-full max-w-7xl mx-auto flex flex-col px-4 py-8 items-center">
                <h1 className="text-3xl font-bold mt-10">Modifier le mot de passe</h1>
                <p className="text-sm mt-4 italic text-gray-600">
                    Choisissez un nouveau mot de passe sécurisé
                </p>

                <form className="mt-8 w-full max-w-md flex flex-col flex-1" onSubmit={handleSubmit(onSubmit)}>
                    <FormSection title="Nouveau mot de passe" className="mb-8">
                        <FormInput<ChangePasswordFormType>
                            type="password"
                            placeholder="Nouveau mot de passe"
                            register={register('newPassword', {
                                onChange: () => clearErrors('newPassword'),
                            })}
                            error={errors.newPassword}
                            className={formInputStyle}
                        />
                        <div className="mt-2 text-xs text-gray-600 space-y-1">
                            <p>Le mot de passe doit contenir :</p>
                            <ul className="list-disc list-inside pl-2 space-y-1">
                                <li>Au moins 8 caractères</li>
                                <li>Une lettre majuscule</li>
                                <li>Une lettre minuscule</li>
                                <li>Un chiffre</li>
                                <li>Un symbole (!@#$%^&*...)</li>
                            </ul>
                        </div>
                    </FormSection>

                    <FormSection title="Confirmation" className="mb-8">
                        <FormInput<ChangePasswordFormType>
                            type="password"
                            placeholder="Confirmez le mot de passe"
                            register={register('confirmPassword', {
                                onChange: () => clearErrors('confirmPassword'),
                            })}
                            error={errors.confirmPassword}
                            className={formInputStyle}
                        />
                    </FormSection>

                    {isError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                            <p className="text-red-600">Erreur: {error?.message}</p>
                        </div>
                    )}

                    <div className="flex gap-4 mt-6">
                        <button
                            type="button"
                            onClick={() => navigate('/company/profile')}
                            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Annuler
                        </button>
                        <FormSubmit
                            isPending={isPending}
                            title="Modifier le mot de passe"
                            pendingTitle="Modification..."
                            isError={isError}
                            error={error}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        />
                    </div>
                </form>
            </div>
        </div>
    );
}
