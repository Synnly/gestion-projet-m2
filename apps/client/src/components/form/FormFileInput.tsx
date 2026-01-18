import type { FieldError, FieldValues, UseFormRegister } from 'react-hook-form';
import { cn } from '../../utils/cn';

export type FormInputProps<T extends FieldValues> = {
    label?: string;
    register: ReturnType<UseFormRegister<T>>;
    error?: FieldError;
    className?: string;
    setFile: (file: File | null) => void;
} & React.InputHTMLAttributes<HTMLInputElement>;

export function FormFileInput<T extends FieldValues>({
    name,
    label,
    register,
    error,
    className,
    setFile,
    ...props
}: FormInputProps<T>) {
    return (
        <div className="flex flex-col w-full">
            {label && (
                <label className="font-bold text-sm pb-2 uppercase" htmlFor={name}>
                    {label}
                </label>
            )}

            <input
                type="file"
                {...register}
                {...props}
                value={undefined}
                onChange={(e) => {
                    register.onChange(e);
                    props.onChange?.(e);
                    if (e.target.files?.[0]) setFile(e.target.files?.[0]);
                }}
                className={cn('file-input file-input-primary w-full', error && 'border-error', className)}
                accept=".doc,.docx,.pdf"
            />

            {error && error.message && (
                <span className="text-error-content mt-1 bg-error p-3">
                    {error.message.charAt(0).toUpperCase() + error.message.slice(1)}
                </span>
            )}
        </div>
    );
}
