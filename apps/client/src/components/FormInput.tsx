import type { FieldError, FieldValues, UseFormRegister } from 'react-hook-form';
import { cn } from '../utils/cn';

export type FormInputProps<T extends FieldValues> = {
    label?: string;
    register: ReturnType<UseFormRegister<T>>;
    error?: FieldError;
    className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export function FormInput<T extends FieldValues>({
    name,
    label,
    register,
    error,
    className,
    ...props
}: FormInputProps<T>) {
    return (
        <div className="flex flex-col w-full">
            {label && (
                <label className="font-bold text-sm pb-2" htmlFor={name}>
                    {label}
                </label>
            )}

            <input
                {...register}
                {...props}
                className={cn('border p-5 rounded-field', error && 'border-red-500', className)}
            />

            {error && <span className="text-red-500">{error.message}</span>}
        </div>
    );
}
