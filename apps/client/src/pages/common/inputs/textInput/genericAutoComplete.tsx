import { forwardRef, useEffect, type ReactElement } from 'react';
import React, { useState } from 'react';
import type { GenericProps } from '../../../../types/genericAutoCompleteAdressType';
import { useDebounce } from '../../../../hooks/useDebounce';
import { useAutocomplete } from '../../../../hooks/useAutoComplete';
import { Check, X } from 'lucide-react';
const Inner = <T,>(
    { isAutocompleteEnabled = true, value, onChange, error, label, fetcher, getLabel, ...rest }: GenericProps<T>,
    ref: React.Ref<HTMLInputElement>,
) => {
    const [searchTerm, setSearchTerm] = useState(value || '');
    const [isValid, setIsValid] = useState(!!value || false);
    const [isOpen, setIsOpen] = useState(false);
    const debouncedSearch = useDebounce(searchTerm, 400);

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
            setIsValid(false);
            onChange(null);
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
        setIsValid(true);
        onChange(fullValue);
    };
    return (
        <div className="form-control w-full relative">
            {label && (
                <label className="label">
                    <span className="label-text">{label}</span>
                </label>
            )}

            <div className="relative flex flex-row items-center gap-1 ">
                <input
                    {...rest}
                    ref={ref}
                    className={`input input-bordered w-full ${error ? 'input-error' : ''}`}
                    value={searchTerm}
                    onChange={handleInputChange}
                    onFocus={() => isAutocompleteEnabled && setIsOpen(true)}
                    autoComplete="off"
                />
                {isAutocompleteEnabled && isValid ? (
                    <Check className="text-green-800" />
                ) : (
                    <X className="text-red-600" />
                )}
                {isAutocompleteEnabled && isLoading && (
                    <span className="loading loading-spinner loading-xs right-3 top-4"></span>
                )}
            </div>

            {isAutocompleteEnabled && getLabel && isOpen && suggestions && suggestions.length > 0 && (
                <ul className="bg-base-100 absolute z-100 w-full shadow-2xl border border-base-300 mt-1 rounded-box p-2 max-h-60 overflow-y-auto">
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
