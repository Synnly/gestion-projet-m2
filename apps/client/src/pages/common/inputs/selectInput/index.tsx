export interface SelectInputProps {
    options: string[];
    label: string;
    /** Controlled value for the select (optional) */
    value?: string;
    /** Called when the select value changes */
    onChange?: (value: string) => void;
}
export const FilterInput: React.FC<SelectInputProps> = ({ options, label, value, onChange }) => {
    return (
        <div className="flex">
            <select
                className="select select-sm bg-base-200 max-w-[140px]"
                value={value ?? ''}
                onChange={(e) => onChange && onChange(e.target.value)}
                aria-label={label}
            >
                <option value="">{label}</option>
                {options.map((option) => (
                    <option key={option} value={option} className="text-sm">
                        {option}
                    </option>
                ))}
            </select>
        </div>
    );
};
