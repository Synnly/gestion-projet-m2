import type { FieldError, UseFormRegister } from 'react-hook-form';
import type { companyFormSignUp } from '../authCompany/companySignup/type';

type FormInput = {
    label: string;
    register: ReturnType<UseFormRegister<companyFormSignUp>>;
    error?: FieldError;
} & React.InputHTMLAttributes<HTMLInputElement>;

export const FormInput = ({ label, register, error, ...props }: FormInput) => (
    <div className="flex flex-col w-full">
        {label && <label className="font-bold text-sm">{label}</label>}
        <input {...register} {...props} className="border rounded-lg p-2" />
        {error && <span className="text-red-500">{error.message}</span>}
    </div>
);
