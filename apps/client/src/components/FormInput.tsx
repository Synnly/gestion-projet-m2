import type { FieldError, FieldValues, UseFormRegister } from 'react-hook-form';
import { cn } from '../utils/cn';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
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
    const [showPassword, setShowPassword] = useState(false);

    // Ne change le type que si c'est password et que showPassword est true
    const inputType = props.type === 'password' && showPassword ? 'text' : props.type;

    return (
        <div className="flex flex-col w-full">
            {label && (
                <label className="font-bold text-sm pb-2 uppercase" htmlFor={name}>
                    {label}
                </label>
            )}

            <div className="flex flex-col w-full relative">
                <input
                    {...register}
                    {...props}
                    type={inputType}
                    className={cn(
                        ' border-gray-200 border-2 rounded-lg p-4',
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
            {error && error.message && (
                <span className="text-red-500 mt-1 rounded-lg bg-red-300 p-3">
                    {error?.message.charAt(0).toUpperCase() + error?.message.slice(1)}
                </span>
            )}
        </div>
    );
}
