import type { SelectInputProps } from '../selectInput/type';

export interface SearchBarProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selects: SelectInputProps[];
}
