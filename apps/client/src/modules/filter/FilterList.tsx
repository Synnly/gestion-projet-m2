import { FilterInput } from '../../components/inputs/selectInput';
import { internshipFilters, mapOptionToPayload } from './filters';
import { useInternshipStore } from '../../store/useInternshipStore';

export default function FilterList() {
    const filters = useInternshipStore((s) => s.filters);
    const setFilters = useInternshipStore((s) => s.setFilters);

    const resetFilters = () =>
        setFilters({
            page: 1,
            limit: 10,
            sector: undefined,
            type: undefined,
            duration: undefined,
            minSalary: undefined,
            maxSalary: undefined,
            keySkills: undefined,
            city: undefined,
            radiusKm: undefined,
            searchQuery: undefined,
            sort: undefined,
        });

    return (
        <div className="w-full card bg-base-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                    {internshipFilters.map((f) => {
                        if (f.key === 'city') {
                            return (
                                <div key={f.key} className="form-control">
                                    <label className="label">
                                        <span className="label-text text-sm">{f.label}</span>
                                    </label>
                                    <input
                                        className="input input-bordered input-sm"
                                        type="text"
                                        placeholder="Ville ou adresse"
                                        value={(filters as any).city ?? ''}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            setFilters({ city: v || undefined, page: 1 });
                                        }}
                                    />
                                </div>
                            );
                        }

                        if (f.key === 'radiusKm') {
                            const current = (filters as any).radiusKm ?? 10;
                            return (
                                <div key={f.key} className="flex flex-col">
                                    <label className="label">
                                        <span className="label-text text-sm">{f.label}</span>
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="range"
                                            min={0}
                                            max={100}
                                            step={1}
                                            className="range range-primary"
                                            value={String(current)}
                                            onChange={(e) => {
                                                const v = Number(e.target.value);
                                                setFilters({ radiusKm: v, page: 1 });
                                            }}
                                        />
                                        <div className="badge badge-outline p-5">{current} km</div>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div key={f.key} className="form-control">
                                <label className="label">
                                    <span className="label-text text-sm">{f.label}</span>
                                </label>
                                <FilterInput
                                    label={f.label}
                                    options={f.options}
                                    value={(filters as any)[f.key] ? String((filters as any)[f.key]) : ''}
                                    onChange={(v) => {
                                        const payload: any = {};
                                        const mapped = mapOptionToPayload(f.key, v);
                                        if (mapped === undefined) payload[f.key] = undefined;
                                        else payload[f.key] = mapped;
                                        payload.page = 1;
                                        setFilters(payload);
                                    }}
                                />
                            </div>
                        );
                    })}
                </div>

                <div className="col-span-1 flex flex-col items-end justify-center gap-2">
                    <div className="w-full flex justify-end">
                        <button type="button" className="btn btn-sm btn-ghost mr-2" onClick={resetFilters}>
                            Réinitialiser
                        </button>
                        <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            onClick={() => setFilters({ page: 1 })}
                        >
                            Appliquer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
