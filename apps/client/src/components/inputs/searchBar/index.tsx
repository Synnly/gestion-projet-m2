import { Search } from 'lucide-react';
import { FilterInput } from '../selectInput';
import type { SearchBarProps } from './type';

export const SearchBar: React.FC<SearchBarProps> = ({ searchQuery, setSearchQuery, selects }) => {
    return (
        <div className="bg-base-100/80 pt-4 pb-6 backdrop-blur-sm">
            <div className="flex flex-col gap-4">
                <label className="form-control">
                    <div className="input-group">
                        <span className="bg-base-200/70">
                            <Search size={18} className="text-base-content/70" />
                        </span>
                        <input
                            className="input input-bordered w-full bg-transparent text-base text-base-content placeholder:text-base-content/60"
                            placeholder="Search by title, company, or keyword..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
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
