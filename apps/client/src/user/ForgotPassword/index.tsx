import { useRef, useState } from 'react';
import { ForgotPasswordStep1 } from './components/step1';
import { ForgotPasswordStep2 } from './components/step2';
import { ForgotPasswordStep3, type forgotPasswordTypeStep3 } from './components/Step3';
import { AnimatePresence, motion } from 'motion/react';
import { useMutation } from '@tanstack/react-query';
import { ForgotPasswordStep4 } from './components/step4';

type forgotPasswordType = {
    email: string;
    newPassword: string;
};
export function ForgotPassword() {
    const email = useRef<string>('');
    const code = useRef<string>('');
    const [step, setStep] = useState<number>(1);
    const API_URL = import.meta.env.VITE_APIURL;
    const { mutateAsync, isPending, isError, error, reset } = useMutation({
        mutationFn: async (data: forgotPasswordType) => {
            const res = await fetch(`${API_URL}/api/mailer/password/reset`, {
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
        },
    });
    const sendRequest = async (data: forgotPasswordTypeStep3) => {
        const payload = {
            email: email.current,
            newPassword: data.password,
        };
        try {
            await mutateAsync(payload);
            setStep(4);
        } catch (err) {
            if (!(err instanceof Error)) return;

            console.log('err', err.message);
            if (err.message === 'Invalid OTP' || err.message === 'OTP expired') {
                setStep(2);
                code.current = '';
            } else {
                if (err.message === 'Too many verification attempts. Please request a new code.') {
                    setStep(1);
                    code.current = '';
                    email.current = '';
                }
            }
        }
    };
    return (
        <div className="flex flex-col w-full min-h-screen flex-grow justify-center items-center bg-(--color-base-200)">
            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.div
                        key={'step1'}
                        initial={{ x: -80, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 50, opacity: 0 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="flex flex-col p-2 mb-10 bg-[var(--color-base-200)] shadow-zinc-950 rounded-[var(--radius-box)] max-w-md gap-5 justify-center"
                    >
                        <ForgotPasswordStep1
                            setStep={setStep}
                            mailRef={email}
                            errorAttempts={error ?? undefined}
                            resetMain={reset}
                        />
                    </motion.div>
                )}
                {step === 2 && (
                    <motion.div
                        key={'step2'}
                        initial={{ x: -80, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 50, opacity: 0 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="flex flex-col p-2 mb-10 bg-[var(--color-base-200)] shadow-zinc-950 rounded-[var(--radius-box)] max-w-md gap-5 justify-center"
                    >
                        <ForgotPasswordStep2 setStep={setStep} mailRef={email} />
                    </motion.div>
                )}
                {step === 3 && (
                    <motion.div
                        key={'step3'}
                        initial={{ x: -80, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 50, opacity: 0 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="flex flex-col p-2 mb-10 bg-[var(--color-base-200)] shadow-zinc-950 rounded-[var(--radius-box)] max-w-md gap-5 justify-center"
                    >
                        <ForgotPasswordStep3
                            sendRequest={sendRequest}
                            isPending={isPending}
                            isError={isError}
                            error={error ?? undefined}
                            reset={reset}
                        />
                    </motion.div>
                )}

                {step === 4 && (
                    <motion.div
                        key={'step4'}
                        initial={{ x: -80, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 50, opacity: 0 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="flex flex-col p-2 mb-10 bg-[var(--color-base-200)] shadow-zinc-950 rounded-[var(--radius-box)] max-w-md gap-5 justify-center"
                    >
                        <ForgotPasswordStep4 />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
