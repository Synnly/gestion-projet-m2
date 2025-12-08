import { ChevronUp, ChevronDown, Filter } from 'lucide-react';
import { useInternshipStore } from '../../store/useInternshipStore';

export default function SortSelect() {
    const filters = useInternshipStore((s) => s.filters);
    const setFilters = useInternshipStore((s) => s.setFilters);

    const current = filters.sort ?? undefined;

    return (
        <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-xs">
                <Filter className="h-4 w-4" />
            </label>
            <ul tabIndex={0} className="dropdown-content menu p-1 shadow bg-base-100 rounded-box w-40">
                <li>
                    <button
                        type="button"
                        className={`flex items-center justify-between w-full ${current === 'dateDesc' ? 'font-semibold' : ''}`}
                        onClick={() => setFilters({ sort: 'dateDesc', page: 1 })}
                    >
                        <span>Plus récentes</span>
                        <ChevronUp className="h-4 w-4 ml-2" />
                    </button>
                </li>
                <li>
                    <button
                        type="button"
                        className={`flex items-center justify-between w-full ${current === 'dateAsc' ? 'font-semibold' : ''}`}
                        onClick={() => setFilters({ sort: 'dateAsc', page: 1 })}
                    >
                        <span>Plus anciennes</span>
                        <ChevronDown className="h-4 w-4 ml-2" />
                    </button>
                </li>
            </ul>
        </div>
    );
}
