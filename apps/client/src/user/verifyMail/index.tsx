import React, { useRef, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { FormSubmit } from '../../components/FormSubmit';

import type { userContext } from '../../authRoutes/type';
import { useNavigate, useOutletContext } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { userStore } from '../../store/userStore';
import { CodeInput } from './components/code';

export type VerifyEmailForm = {
    code1: string;
    code2: string;
    code3: string;
    code4: string;
    code5: string;
    code6: string;
};

function translateMessage(message: string): string {
    if (message === 'Invalid OTP') {
        return 'Le code est invalide.';
    }
    if (message === 'OTP expired') {
        return `Le code a expiré redemander un nouveau code.`;
    }
    if (message === 'Too many verification attempts. Please request a new code.') {
        return `Trop de tentatives de vérification. Veuillez demander un nouveau code.`;
    }
    if (message === 'User not found') {
        return `Aucun compte trouvé avec cet email.`;
    }
    if (message === 'OTP rate limit exceeded. Try again later.') {
        return `Trop de demandes. Veuillez réessayer plus tard.`;
    }
    return 'Une erreur est survenue, veuillez réessayer plus tard.';
}

export function VerifyEmail() {
    const {
        register,
        handleSubmit,
        setError,
        reset,
        clearErrors,
        formState: { errors },
    } = useForm<VerifyEmailForm>({
        mode: 'onSubmit',
    });
    const navigate = useNavigate();
    const { access, set, logout, get } = userStore.getState();
    const API_URL = import.meta.env.VITE_APIURL;
    const accessToken = useOutletContext<userContext>();
    const email = accessToken.get(accessToken.accessToken).mail;
    /* Refs for input fields */
    const refsInputs = useRef<(HTMLInputElement | null)[]>([]);
    if (refsInputs.current.length === 0) {
        // Initialize 6 refs
        refsInputs.current = Array(6).fill(null);
    }

    const sendMailMutation = useMutation({
        mutationFn: async () => {
            const body = { email: email };
            const response = await fetch(`${API_URL}/api/mailer/auth/send-verification`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    autorization: `Bearer ${accessToken}`,
                },
                credentials: 'include',
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const message = await response.json();
                throw new Error(translateMessage(message.message));
            }
        },
    });
    const verifyCodeMutation = useMutation({
        mutationFn: async (code: string) => {
            const body = { otp: code, email: email };
            const response = await fetch(`${API_URL}/api/mailer/auth/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    autorization: `Bearer ${accessToken}`,
                },
                credentials: 'include',
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const message = await response.json();
                throw new Error(translateMessage(message.message));
            }
            return response;
        },
    });

    const onSubmit = async (data: VerifyEmailForm) => {
        const code = `${data.code1}${data.code2}${data.code3}${data.code4}${data.code5}${data.code6}`;
        if (code.length !== 6) {
            setError('root', { message: 'Veuillez entrer un code valide de 6 chiffres.' });
            return;
        }
        const res = await verifyCodeMutation.mutateAsync(code);
        if (res.ok) {
            const refreshRes = await fetch(`${API_URL}/api/auth/refresh`, {
                method: 'POST',
                credentials: 'include',
                headers: { Authorization: `Bearer ${access}` },
            });

            if (!refreshRes.ok) {
                logout();
                navigate('/signin');
            }

            const refreshed = await refreshRes.text();
            const role = get(refreshed).role;
            set(refreshed);
            navigate(`/${role.toLowerCase()}/dashboard`);
        }
        reset();
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-base-300 font-display text-gray-800 dark:text-gray-200">
            <div className="w-full max-w-md space-y-8 p-5 bg-base-100 dark:bg-base-200 rounded-lg shadow-md">
                {/* Logo */}
                <div className="text-center">
                    <img
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBCyGZHkXQD-SQhpDh7YcLyhsxmM4KXOXYrUfNmFccX7oASPRULTj9IZa2uZZt8ZVbOtNh5LZn3gWWO_ldBzGIkOiyJkQ3SoqLsUWSkOwLlDdDyHSmSoYC0tNdWQjxXuK7YTaLuHtvOD3R67v4y6mC7TUVl0XHPCQhT0L7hlJHqu0tMYSMpn9b0LDlAoF8JzM5rKcCAkByrB3ZEtqFwEP3-lzO7VHY7EqwY0hgpKqh2MPxxYridXTsjDb3FYiyBG1Z4PBud9UAU1l-0"
                        alt="Logo de l'application"
                        className="mx-auto h-10 w-auto"
                    />
                </div>
                {/* Title & description */}
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold tracking-tight text-black">Vérifier votre compte</h1>
                    <p className="text-sm text-gray-700 dark:text-gray-400">
                        Un code a été envoyé à votre adresse email. Veuillez le saisir ci-dessous.
                    </p>
                </div>
                <CodeInput
                    refsInputs={refsInputs}
                    errors={errors}
                    handleSubmit={handleSubmit}
                    onSubmit={onSubmit}
                    register={register}
                    isSendingError={verifyCodeMutation.isError}
                    isPending={verifyCodeMutation.isPending}
                    sendingError={verifyCodeMutation.error ?? undefined}
                    onClick={() => {
                        verifyCodeMutation.reset();
                        sendMailMutation.reset();
                        clearErrors();
                    }}
                />
                {/* Resend */}
                <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Vous n'avez pas reçu de code ?{' '}
                        <button
                            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                            onClick={() => {
                                sendMailMutation.mutate();
                            }}
                        >
                            {sendMailMutation.isPending ? 'Renvoi du code...' : 'Renvoyer le code'}
                        </button>
                    </p>
                </div>
                {sendMailMutation.isSuccess && (
                    <p className="text-primary bg-gray-200 p-2 text-sm text-center">Envoie réussi</p>
                )}
            </div>
        </div>
    );
}
