import { useRef, type Dispatch, type SetStateAction } from 'react';
import { useForm } from 'react-hook-form';
import { CodeInput } from '../../verifyMail/components/code';
import type { VerifyEmailForm } from '../../verifyMail';

export const ForgotPasswordStep2 = ({
    setStep,
    codeRef,
    errorCode,
    resetMain,
}: {
    setStep: Dispatch<SetStateAction<number>>;
    codeRef: React.MutableRefObject<string>;
    errorCode?: Error;
    resetMain: () => void;
}) => {
    const {
        register,
        handleSubmit,
        setValue,
        setError,
        clearErrors,
        formState: { errors },
    } = useForm<VerifyEmailForm>({
        mode: 'onSubmit',
    });

    const onSubmit = (data: VerifyEmailForm) => {
        const code = `${data.code1}${data.code2}${data.code3}${data.code4}${data.code5}${data.code6}`;
        console.log('Submitted code:', code);
        if (code.length !== 6) {
            setError('root', { message: 'Veuillez entrer un code valide de 6 chiffres.' });
            return;
        }
        codeRef.current = code;
        setStep(3);
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
                refsInputs={refsInputs}
                errors={errors}
                onClick={() => {
                    clearErrors();
                    resetMain();
                }}
            />
            {errorCode && (
                <span className="text-red-500 mx-auto mt-1 bg-red-100 text-center p-3 text-sm">
                    {errorCode.message}
                </span>
            )}
        </div>
    );
};
