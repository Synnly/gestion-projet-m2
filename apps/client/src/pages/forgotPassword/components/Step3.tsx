import { useForm, type Resolver } from 'react-hook-form';
import { passwordSchema } from '../../../auth/companySignup/type';
import z from 'zod';
import { CustomForm } from '../../../components/form/CustomForm';
import { FormInput } from '../../../components/form/FormInput';
import { FormSubmit } from '../../../components/form/FormSubmit';
import { zodResolver } from '@hookform/resolvers/zod';

const forgotPasswordTypeStep3Schema = z
    .object({
        password: passwordSchema,
        confirmPassword: z.string(),
    })
    .refine((data) => !data.password || !data.confirmPassword || data.password === data.confirmPassword, {
        message: 'Les mots de passe ne correspondent pas.',
        path: ['confirmPassword'],
    });

export type forgotPasswordTypeStep3 = z.infer<typeof forgotPasswordTypeStep3Schema>;

export function ForgotPasswordStep3({
    sendRequest,
    isPending,
    isError,
    error,
    reset,
}: {
    sendRequest: (data: forgotPasswordTypeStep3) => void;
    isPending: boolean;
    error?: Error;
    isError: boolean;
    reset: () => void;
}) {
    const {
        register,
        handleSubmit,
        formState: { errors },
        clearErrors,
        trigger,
    } = useForm<forgotPasswordTypeStep3>({
        resolver: zodResolver(forgotPasswordTypeStep3Schema) as Resolver<forgotPasswordTypeStep3>,
        mode: 'onSubmit',
    });
    const onSubmit = (data: forgotPasswordTypeStep3) => {
        sendRequest(data);
    };
    const handleBlur = async () => {
        await trigger(['password', 'confirmPassword']);
    };
    const onChange = (fieldName: 'password' | 'confirmPassword') => {
        clearErrors(fieldName);
    };
    return (
        <CustomForm
            label="Definissez votre nouveau mot de passe"
            role="form"
            onSubmit={handleSubmit(onSubmit)}
            className=" flex flex-col gap-8 mt-4 items-center "
            onClick={() => {
                reset();
            }}
        >
            <div className="w-full flex flex-col gap-5 justify-around">
                <FormInput<forgotPasswordTypeStep3>
                    register={register('password')}
                    onBlur={handleBlur}
                    onChange={() => onChange('password')}
                    placeholder="Nouveau mot de passe"
                    label="Nouveau mot de passe"
                    type="password"
                    error={errors.password}
                />

                <FormInput<forgotPasswordTypeStep3>
                    placeholder="Confirmer le mot de passe"
                    register={register('confirmPassword')}
                    onBlur={handleBlur}
                    onChange={() => onChange('confirmPassword')}
                    label="Confirmer le mot de passe"
                    type="password"
                    error={errors.confirmPassword}
                />
            </div>
            <FormSubmit
                title="Définir le nouveau mot de passe"
                isPending={isPending}
                pendingTitle="Envoi en cours..."
                className="bg-primary p-3 rounded-lg cursor-pointer w-full text-black"
                isError={isError}
                error={error}
            />
        </CustomForm>
    );
}
