import { cn } from '../../../utils/cn';

import type { FieldError } from 'react-hook-form';

type CustomSelectProps = {
    label: string;
    data: Array<string | number>;
    defaultText: string;
    className?: string;
    error?: FieldError;
} & React.SelectHTMLAttributes<HTMLSelectElement>;

export const CustomSelect = ({ label, data, defaultText, className, error, ...rest }: CustomSelectProps) => {
    return (
        <div className="flex flex-col">
            {label && (
                <label className="font-bold text-sm mb-1 pb-2" htmlFor={rest.name}>
                    {label}
                </label>
            )}

            <select className={cn('select rounded-radius-field', className)} defaultValue={rest.defaultValue ?? ""} {...rest}>
                <option value="" disabled>
                    {defaultText}
                </option>
                {data.map((item, i) => (
                    <option key={i} value={item}>
                        {String(item)}
                    </option>
                ))}
            </select>

            {error && <span className="text-red-500">{error?.message}</span>}
        </div>
    );
};
