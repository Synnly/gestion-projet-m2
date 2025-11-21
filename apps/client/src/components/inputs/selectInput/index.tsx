import type { SelectInputProps } from './type';

export const FilterInput: React.FC<SelectInputProps> = ({ options, label }) => {
    return (
        <div className="flex">
            <select className="select select-bordered select-sm bg-base-200/70 min-w-[140px]">
                <option value="" disabled selected>
                    {label}
                </option>
                {options.map((option) => (
                    <option key={option} value={option} className="text-sm">
                        {option}
                    </option>
                ))}
            </select>
        </div>
    );
};
