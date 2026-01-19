import type { FieldError, FieldValues, UseFormRegister } from 'react-hook-form';
import { cn } from '../../utils/cn';

export type FormInputEditProps<T extends FieldValues> = {
    label?: string;
    register: ReturnType<UseFormRegister<T>>;
    error?: FieldError;
    className?: string;
} & React.InputHTMLAttributes<HTMLTextAreaElement>;

export function TextAreaEdit<T extends FieldValues>({
    name,
    label,
    register,
    error,
    className,
    ...props
}: FormInputEditProps<T>) {
    return (
        <div className="flex flex-col w-full">
            {label && (
                <label className="font-bold text-sm pb-2" htmlFor={name}>
                    {label}
                </label>
            )}

            <div className="flex flex-col w-full relative">
                <textarea
                    {...register}
                    {...props}
                    className={cn('rounded-lg p-4 w-full', error && 'border-red-500', className)}
                />
            </div>
            {error && <span className="text-red-500 mt-1 text-sm italic">{error.message}</span>}
        </div>
    );
}
