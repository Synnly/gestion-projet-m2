import { useEffect, type ChangeEvent } from 'react';
import type { VerifyEmailForm } from '..';
import { FormSubmit } from '../../../components/FormSubmit';
import type { FieldErrors, SubmitHandler, UseFormRegister, UseFormSetValue } from 'react-hook-form';

export type CodeInputProps = {
    handleSubmit: (onValid: SubmitHandler<VerifyEmailForm>) => (e?: React.BaseSyntheticEvent) => Promise<void>;
    register: UseFormRegister<VerifyEmailForm>;
    errors: FieldErrors<VerifyEmailForm>;
    onSubmit: SubmitHandler<VerifyEmailForm>;
    isSendingError?: boolean;
    sendingError?: Error;
    setValue: UseFormSetValue<VerifyEmailForm>;
    isPending?: boolean;
    refsInputs: React.MutableRefObject<Array<HTMLInputElement | null>>;
} & Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'>;

export const CodeInput = ({
    handleSubmit,
    setValue,
    register,
    onSubmit,
    refsInputs,
    errors,
    isSendingError,
    sendingError,
    isPending,
    ...rest
}: CodeInputProps) => {
    useEffect(() => {
        refsInputs.current[0]?.focus();
    }, [refsInputs]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>, idx: number) => {
        const rawValue = e.target.value;
        //filter only digits
        const digits = rawValue.replace(/\D/g, '');
        const lastDigit = digits.slice(-1);
        e.target.value = lastDigit;
        if (lastDigit && idx < 5) {
            refsInputs.current[idx + 1]?.focus();
        }
        if (lastDigit && idx === 5) {
            refsInputs.current[idx]?.blur();
            if (refsInputs.current.every((input) => input?.value !== '')) {
                handleSubmit((data: VerifyEmailForm) => onSubmit(data))();
            }
        }
    };
    const keyDownHandler = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
        const inputs = refsInputs.current;

        if (e.key === 'Backspace') {
            e.preventDefault();

            if (inputs[idx]?.value) {
                inputs[idx].value = '';
                setValue(`code${idx + 1}` as keyof VerifyEmailForm, '', { shouldValidate: true });
            } else if (idx > 0) {
                inputs[idx - 1]?.focus();
                inputs[idx - 1]!.value = '';
                setValue(`code${idx}` as keyof VerifyEmailForm, '', { shouldValidate: true });
            }
        }

        if (e.key === 'ArrowRight' && idx < inputs.length - 1) {
            inputs[idx + 1]?.focus();
        }

        if (e.key === 'ArrowLeft' && idx > 0) {
            inputs[idx - 1]?.focus();
        }
    };
    const pasteHandler = (e: React.ClipboardEvent<HTMLInputElement>, startIndex: number) => {
        e.preventDefault();

        const pasteData = e.clipboardData.getData('text').replace(/\D/g, '');
        if (!pasteData) return;

        const inputs = refsInputs.current;
        const maxIndex = inputs.length - 1;

        const allEmpty = inputs.every((input) => input?.value === '');
        const pasteStart = allEmpty ? 0 : startIndex;

        for (let i = 0; i < pasteData.length && pasteStart + i <= maxIndex; i++) {
            const idx = pasteStart + i;
            const char = pasteData[i];
            setValue(`code${idx + 1}` as keyof VerifyEmailForm, char, { shouldValidate: true });
            if (inputs[idx]) inputs[idx]!.value = char; // mettre à jour l'UI
        }

        const nextEmpty = inputs.slice(pasteStart).find((input) => input && input.value === '');
        if (nextEmpty) {
            nextEmpty.focus();
            return;
        }

        inputs[maxIndex]?.blur();
        const allFilled = inputs.every((input) => input?.value !== '');
        if (allFilled) handleSubmit(onSubmit)();
    };
    return (
        <>
            <form className="mt-8 space-y-6 flex flex-col items-center" onSubmit={handleSubmit(onSubmit)} {...rest}>
                {errors.root && (
                    <span className="text-red-500 mt-1 bg-red-100 text-center p-3 text-sm">{errors.root.message}</span>
                )}
                <div className="space-y-4 rounded-md">
                    <div className="flex justify-center gap-2 sm:gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i}>
                                <label className="sr-only" htmlFor={`code-${i}`}>
                                    {`${i}ème chiffre`}
                                </label>
                                <input
                                    id={`code-${i}`}
                                    type="text"
                                    className="w-12 h-12 sm:w-14 sm:h-14 text-center text-xl sm:text-2xl font-semibold rounded-lg border text-black   focus:border-yellow-500 focus:ring-yellow-500"
                                    {...register(`code${i}` as keyof VerifyEmailForm)}
                                    onChange={(e) => handleChange(e, i - 1)}
                                    onKeyDown={(e) => keyDownHandler(e, i - 1)}
                                    onPaste={(e) => pasteHandler(e, i - 1)}
                                    //react hook form has his own ref, we need to combine both refs
                                    ref={(e) => {
                                        register(`code${i}` as keyof VerifyEmailForm).ref(e);
                                        refsInputs.current[i - 1] = e;
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <FormSubmit
                        title="Vérifier"
                        pendingTitle="Vérification..."
                        isError={isSendingError}
                        error={sendingError}
                        isPending={isPending}
                        className="group relative flex w-full justify-center rounded-lg border border-transparent bg-primary py-3 px-4 text-sm font-semibold text-gray-900 hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 dark:focus:ring-offset-background-dark transition-colors"
                    />
                </div>
            </form>
        </>
    );
};
