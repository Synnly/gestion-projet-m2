import React, { useRef } from 'react';
import { FilterInput } from '../selectInput';
import type { SearchBarProps } from './type';
import { Search } from 'lucide-react';

export const SearchBar: React.FC<SearchBarProps> = ({ searchQuery, setSearchQuery, selects }) => {
    const inputRef = useRef<HTMLInputElement | null>(null);

    return (
        <div className="bg-base-100/80 backdrop-blur-sm">
            <div className="flex flex-col gap-4">
                <label className="input input-bordered w-full">
                    <Search size={16} className="opacity-50 mr-2" />
                    <input
                        ref={inputRef}
                        type="search"
                        required
                        className="w-full bg-transparent text-base text-base-content placeholder:text-base-content/60"
                        placeholder="Rechercher par titre, entreprise ou mot-clés..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        aria-label="Search internships"
                    />
                </label>

                <div className="flex flex-wrap gap-4">
                    {selects.map((select) => (
                        <FilterInput key={select.label} label={select.label} options={select.options} />
                    ))}
                </div>
            </div>
        </div>
    );
};
