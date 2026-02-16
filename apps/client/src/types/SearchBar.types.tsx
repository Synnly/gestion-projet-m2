import type { SelectInputProps } from '../types/SelectInput.types';

export interface SearchBarProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selects: SelectInputProps[];
    placeholder?: string;
}
