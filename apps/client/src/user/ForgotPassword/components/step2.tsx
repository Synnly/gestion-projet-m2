import { useRef, type Dispatch, type SetStateAction } from 'react';
import { useForm } from 'react-hook-form';
import { CodeInput } from '../../verifyMail/components/code';
import type { VerifyEmailForm } from '../../verifyMail';
import { useMutation } from '@tanstack/react-query';

export const ForgotPasswordStep2 = ({
    setStep,
    mailRef,
}: {
    setStep: Dispatch<SetStateAction<number>>;
    mailRef: React.MutableRefObject<string>;
}) => {
    const {
        register,
        handleSubmit,
        setValue,
        setError,
        clearErrors,
        reset,
        formState: { errors },
    } = useForm<VerifyEmailForm>({
        mode: 'onSubmit',
    });

    const verifyPasswordResetOtpMutation = useMutation({
        mutationFn: async (code: string) => {
            const API_URL = import.meta.env.VITE_APIURL;
            try {
                const response = await fetch(`${API_URL}/api/mailer/password/reset/verify-otp`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email: mailRef.current, otp: code }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message);
                }

                return response;
            } catch (error) {
                if (error instanceof Error) {
                    throw new Error(translateError(error.message) || 'Une erreur est survenue');
                }
            }
        },
    });
    const { isPending, isError, error, mutateAsync } = verifyPasswordResetOtpMutation;
    const onSubmit = async (data: VerifyEmailForm) => {
        const code = `${data.code1}${data.code2}${data.code3}${data.code4}${data.code5}${data.code6}`;
        if (code.length !== 6) {
            setError('root', { message: 'Veuillez entrer un code valide de 6 chiffres.' });
            return;
        }
        try {
            const res = await mutateAsync(code);
            if (res && res.ok) {
                setStep(3);
            }
        } catch {
            reset();
        }
    };
    /* Refs for input fields */
    const refsInputs = useRef<(HTMLInputElement | null)[]>([]);
    if (refsInputs.current.length === 0) {
        // Initialize 6 refs
        refsInputs.current = Array(6).fill(null);
    }
    return (
        <div className="w-full max-w-md space-y-8 p-5 bg-base-100 dark:bg-base-200 rounded-lg shadow-md flex justify-center flex-col">
            {/* Logo */}
            <div className="text-center">
                <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBCyGZHkXQD-SQhpDh7YcLyhsxmM4KXOXYrUfNmFccX7oASPRULTj9IZa2uZZt8ZVbOtNh5LZn3gWWO_ldBzGIkOiyJkQ3SoqLsUWSkOwLlDdDyHSmSoYC0tNdWQjxXuK7YTaLuHtvOD3R67v4y6mC7TUVl0XHPCQhT0L7hlJHqu0tMYSMpn9b0LDlAoF8JzM5rKcCAkByrB3ZEtqFwEP3-lzO7VHY7EqwY0hgpKqh2MPxxYridXTsjDb3FYiyBG1Z4PBud9UAU1l-0"
                    alt="Logo de l'application"
                    className="mx-auto h-10 w-auto"
                />
            </div>
            <div className="text-center space-y-4">
                <h1 className="text-2xl font-bold tracking-tight text-black">Saisissez le code</h1>
                <p className="text-sm text-gray-700 dark:text-gray-400">Un code a été envoyé à votre adresse email.</p>
                <p className="text-sm text-gray-700 dark:text-gray-400">Veuillez le saisir ci-dessous.</p>
            </div>

            <CodeInput
                setValue={setValue}
                handleSubmit={handleSubmit}
                register={register}
                onSubmit={onSubmit}
                isSendingError={isError}
                sendingError={error as Error}
                isPending={isPending}
                refsInputs={refsInputs}
                errors={errors}
                onClick={() => {
                    clearErrors();
                    reset();
                }}
            />
        </div>
    );
};
function translateError(message: string): string | undefined {
    if (message === 'Invalid OTP') return 'Le code saisi est invalide.';
}
