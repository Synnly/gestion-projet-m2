import { FilterInput } from '../../components/inputs/selectInput';
import { sortOptions } from './filters';
import { useInternshipStore } from '../../store/useInternshipStore';

export default function SortSelect() {
    const filters = useInternshipStore((s) => s.filters);
    const setFilters = useInternshipStore((s) => s.setFilters);

    const current = filters.sort ?? '';

    return (
        <div className="w-44">
            <div className="form-control">
                <label className="label">
                    <span className="label-text text-sm">Trier</span>
                </label>
                <FilterInput
                    label="Trier"
                    options={sortOptions.map((s) => s.label)}
                    value={sortOptions.find((s) => s.value === current)?.label ?? ''}
                    onChange={(label) => {
                        const sel = sortOptions.find((s) => s.label === label);
                        setFilters({ sort: sel?.value ?? undefined, page: 1 });
                    }}
                />
            </div>
        </div>
    );
}
