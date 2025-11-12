import type { FieldError } from 'react-hook-form';

type CustomSelectProps<T extends readonly unknown[]> = {
    label: string;
    data: T;
    defaultText: string;
    className: string;
    error?: FieldError;
} & React.SelectHTMLAttributes<HTMLSelectElement>;

export const CustomSelect = <T extends readonly unknown[]>({
    label,
    data,
    defaultText,
    className,
    error,
    ...rest
}: CustomSelectProps<T>) => {
    return (
        <>
            {label && (
                <label className="font-bold text-sm" htmlFor={label}>
                    {label}
                </label>
            )}
            <select className={className} {...rest} defaultValue="" name={label}>
                <option value="" disabled>
                    {defaultText}
                </option>
                {data.map((item, i) => (
                    <option key={i} value={String(item)}>
                        {String(item)}
                    </option>
                ))}
            </select>

            {error && <span className="text-red-500">{error?.message}</span>}
        </>
    );
};
