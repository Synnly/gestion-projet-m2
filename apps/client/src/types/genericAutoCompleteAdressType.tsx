import React from 'react';
export type BaseProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
    value?: string | null;
    onChange: (value: string | null) => void;
    label?: string;
    error?: string;
};

export type AutocompleteEnabledProps<T> = BaseProps & {
    isAutocompleteEnabled: true;
    fetcher: (searchTerm: string) => Promise<T[]>;
    getLabel: (item: T) => string;
};

export type AutocompleteDisabledProps<T> = BaseProps & {
    isAutocompleteEnabled?: false;
    fetcher?: (searchTerm: string) => Promise<T[]>;
    getLabel?: (item: T) => string;
};

export type GenericProps<T> = AutocompleteEnabledProps<T> | AutocompleteDisabledProps<T>;
