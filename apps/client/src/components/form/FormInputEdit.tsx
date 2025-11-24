import type { FieldError, FieldValues, UseFormRegister } from 'react-hook-form';
import { cn } from '../../utils/cn';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export type FormInputEditProps<T extends FieldValues> = {
    label?: string;
    register: ReturnType<UseFormRegister<T>>;
    error?: FieldError;
    className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export function FormInputEdit<T extends FieldValues>({
    name,
    label,
    register,
    error,
    className,
    ...props
}: FormInputEditProps<T>) {
    const [showPassword, setShowPassword] = useState(false);

    // Ne change le type que si c'est password et que showPassword est true
    const inputType = props.type === 'password' && showPassword ? 'text' : props.type;

    return (
        <div className="flex flex-col w-full">
            {label && (
                <label className="font-bold text-sm pb-2" htmlFor={name}>
                    {label}
                </label>
            )}

            <div className="flex flex-col w-full relative">
                <input
                    {...register}
                    {...props}
                    type={inputType}
                    className={cn(
                        'rounded-lg p-4',
                        error && 'border-red-500',
                        className,
                        props.type === 'password' && 'flex items-center',
                    )}
                />

                {props.type === 'password' && (
                    <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2  transform  text-gray-500 text-sm"
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                )}
            </div>
            {error && <span className="text-red-500 mt-1 text-sm italic">{error.message}</span>}
        </div>
    );
}
