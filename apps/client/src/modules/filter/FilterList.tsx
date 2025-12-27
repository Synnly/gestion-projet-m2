import { useState, useEffect } from 'react';
import { RotateCcw, MapPin, ListFilter } from 'lucide-react';
import { FilterInput } from '../../components/inputs/selectInput';
import { internshipFilters, mapOptionToPayload } from './filters';
import { useInternshipStore } from '../../store/useInternshipStore';
import SortSelect from './SortSelect';
import CityRadiusModal from '../../components/CityRadius/CityRadiusModal';
import SalaryRangeSelector from '../../components/inputs/range/SalaryRangeSelector';
import { userStore } from '../../store/userStore.ts';

export function FilterList() {
    const filters = useInternshipStore((s) => s.filters);
    const setFilters = useInternshipStore((s) => s.setFilters);
    const toggleShowMyApplicationsOnly = useInternshipStore((s) => s.toggleShowMyApplicationsOnly);
    const access = userStore((state) => state.access);
    const get = userStore((state) => state.get);
    const [minimal, setMinimal] = useState<boolean>(true);
    const [mapOpen, setMapOpen] = useState(false);
    const [_, setSalaryRange] = useState<{ min: number; max: number }>({
        min: (filters as any).minSalary ?? 0,
        max: (filters as any).maxSalary ?? 2500,
    });

    useEffect(() => {
        setSalaryRange({ min: (filters as any).minSalary ?? 0, max: (filters as any).maxSalary ?? 2500 });
    }, [(filters as any).minSalary, (filters as any).maxSalary]);

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
        <div className="w-full space-y-2 pb-4">
            <div className="card bg-base-100 shadow-md shadow-base-300">
                <div className="card-body p-3">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            {get(access)?.role === 'STUDENT' && (
                                <label className="swap btn">
                                    <input type="checkbox" defaultChecked />
                                    <div className="swap-off" onClick={toggleShowMyApplicationsOnly}>
                                        Toutes les annonces
                                    </div>
                                    <div className="swap-on" onClick={toggleShowMyApplicationsOnly}>
                                        Mes candidatures
                                    </div>
                                </label>
                            )}
                            <button
                                type="button"
                                className="btn btn-xs btn-ghost flex items-center"
                                onClick={resetFilters}
                                title="Réinitialiser"
                            >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Réinitialiser
                            </button>

                            <div className="ml-2">
                                <SortSelect />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setMapOpen(true)}>
                                <MapPin className="h-4 w-4 text-base-content" />
                                <div>
                                    <div className="text-xs font-medium">Localisation</div>
                                    <div className="text-xs text-base-content/60">
                                        {filters.city && filters.radiusKm
                                            ? `${filters.city} – ${filters.radiusKm} km`
                                            : 'Aucune sélection'}
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="btn btn-xs btn-ghost"
                                onClick={() => setMinimal((s) => !s)}
                                title={minimal ? 'Afficher les filtres' : 'Masquer les filtres'}
                                aria-pressed={!minimal}
                            >
                                {minimal ? (
                                    <ListFilter className="h-4 w-4" />
                                ) : (
                                    <ListFilter className="h-4 w-4 rotate-180" />
                                )}
                                Filtrer
                            </button>
                        </div>
                        <div
                            className={`flex flex-row gap-x-6 items-center transition-all duration-300 ease-in-out ${
                                minimal
                                    ? 'opacity-0 pointer-events-none'
                                    : 'opacity-100 ml-6 pl-4 border-l border-base-200'
                            }`}
                            aria-hidden={minimal}
                        >
                            {internshipFilters
                                .filter((f) => f.key !== 'city' && f.key !== 'radiusKm')
                                .map((f) => {
                                    if (f.key === 'minSalary') {
                                        return (
                                            <SalaryRangeSelector
                                                key="salary-range"
                                                min={(filters as any).minSalary}
                                                max={(filters as any).maxSalary}
                                                onChange={({ min, max }) => {
                                                    setFilters({ minSalary: min, maxSalary: max, page: 1 });
                                                }}
                                            />
                                        );
                                    }

                                    // Render normal des autres filtres
                                    if (f.key === 'maxSalary') return null;

                                    return (
                                        <div key={f.key} className="form-control min-w-[150px]">
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
                    </div>
                </div>
            </div>

            <CityRadiusModal
                open={mapOpen}
                initialCity={filters.city ?? ''}
                initialRadius={filters.radiusKm ?? 20}
                onClose={() => setMapOpen(false)}
                onConfirm={({ city, radius }) => {
                    setFilters({ city: city || undefined, radiusKm: radius || undefined, page: 1 });
                }}
            />
        </div>
    );
}
