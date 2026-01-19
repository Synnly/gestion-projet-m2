import { forwardRef, type ReactElement } from 'react';
import React, { useEffect, useState } from 'react';
import { useAutocomplete } from '../../../hooks/useAutocomplete';
import { useDebounce } from '../../../hooks/useDebounce';
type BaseProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
    value?: string | null;
    onChange: (value: string) => void;
    label?: string;
    error?: string;
};

type AutocompleteEnabledProps<T> = BaseProps & {
    isAutocompleteEnabled: true;
    fetcher: (searchTerm: string) => Promise<T[]>;
    getLabel: (item: T) => string;
};

type AutocompleteDisabledProps<T> = BaseProps & {
    isAutocompleteEnabled?: false;
    fetcher?: (searchTerm: string) => Promise<T[]>;
    getLabel?: (item: T) => string;
};

type GenericProps<T> = AutocompleteEnabledProps<T> | AutocompleteDisabledProps<T>;
const Inner = <T,>(
    { isAutocompleteEnabled = true, value, onChange, error, label, fetcher, getLabel, ...rest }: GenericProps<T>,
    ref: any,
) => {
    const [searchTerm, setSearchTerm] = useState(value || '');
    const [isOpen, setIsOpen] = useState(false);
    const debouncedSearch = useDebounce(searchTerm, 400);
    useEffect(() => {
        setSearchTerm(value || '');
    }, [value]);

    const canRunAutocomplete = isAutocompleteEnabled && fetcher && getLabel;

    const { data: suggestions, isLoading } = useAutocomplete({
        searchTerm: debouncedSearch,
        fetcher: fetcher!,
        enabled: !!(canRunAutocomplete && isOpen),
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchTerm(val);

        if (canRunAutocomplete) {
            setIsOpen(true);
            onChange('');
        } else {
            setIsOpen(false);
            onChange(val);
        }
    };
    const handleSelect = (item: T) => {
        if (!getLabel) return;

        const fullValue = getLabel(item);

        setSearchTerm(fullValue);
        setIsOpen(false);

        onChange(fullValue);
    };
    return (
        <div className="form-control w-full relative">
            {label && (
                <label className="label">
                    <span className="label-text">{label}</span>
                </label>
            )}

            <div className="relative">
                <input
                    {...rest}
                    ref={ref}
                    className={`input input-bordered w-full ${error ? 'input-error' : ''}`}
                    value={searchTerm}
                    onChange={handleInputChange}
                    onFocus={() => isAutocompleteEnabled && setIsOpen(true)}
                    autoComplete="off"
                />
                {isAutocompleteEnabled && isLoading && (
                    <span className="loading loading-spinner loading-xs absolute right-3 top-4"></span>
                )}
            </div>

            {isAutocompleteEnabled && getLabel && isOpen && suggestions && suggestions.length > 0 && (
                <ul className="menu bg-base-100 absolute z-[100] w-full shadow-2xl border border-base-300 mt-1 rounded-box p-2 max-h-60 overflow-y-auto">
                    {suggestions.map((item, idx) => (
                        <li key={idx}>
                            <button type="button" onClick={() => handleSelect(item)} className="py-2 hover:bg-base-200">
                                {getLabel(item)}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            {error && <p className="text-error text-xs mt-1">{error}</p>}
        </div>
    );
};
export const GenericAutocomplete = forwardRef(Inner) as <T>(
    props: GenericProps<T> & { ref?: React.Ref<HTMLInputElement> },
) => ReactElement;
