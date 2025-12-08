import { useState } from 'react';
import { RotateCcw, MapPin, ChevronUp, Map, Filter } from 'lucide-react';
import { FilterInput } from '../../components/inputs/selectInput';
import { internshipFilters, mapOptionToPayload } from './filters';
import { useInternshipStore } from '../../store/useInternshipStore';
import CityRadiusMap from '../../components/cityRadiusMap';
import SortSelect from './SortSelect';

export default function FilterList() {
    const filters = useInternshipStore((s) => s.filters);
    const setFilters = useInternshipStore((s) => s.setFilters);
    const [showMap, setShowMap] = useState(false);

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
        <div className="w-full space-y-1.5 pb-4">
            <div className="card bg-base-100 shadow-md">
                <div className="card-body p-3 -mt-8">
                    <div className="flex justify-between items-center mb-2">
                        <button type="button" className="btn btn-xs btn-ghost" onClick={resetFilters}>
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Réinitialiser
                        </button>
                    </div>

                    <div className="flex flex-row gap-x-8">
                        {internshipFilters
                            .filter((f) => f.key !== 'city' && f.key !== 'radiusKm')
                            .map((f) => (
                                <div key={f.key} className="form-control">
                                    <label className="label py-0.5">
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
                            ))}
                             <SortSelect />
                    </div>
                </div>
                <div className="card-body p-3">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-base font-semibold flex items-center">
                            <MapPin className="h-4 w-4 mr-2" />
                            Localisation
                        </h3>
                        <button type="button" className="btn btn-xs btn-ghost" onClick={() => setShowMap(!showMap)}>
                            {showMap ? (
                                <>
                                    <ChevronUp className="h-3 w-3 mr-1" />
                                    Masquer
                                </>
                            ) : (
                                <>
                                    <Map className="h-3 w-3 mr-1" />
                                    Afficher
                                </>
                            )}
                        </button>
                    </div>

                    {showMap && (
                        <CityRadiusMap
                            city={filters.city ?? ''}
                            radius={filters.radiusKm ?? 20}
                            onCityChange={(city: string) => setFilters({ city: city || undefined, page: 1 })}
                            onRadiusChange={(radius: number) => setFilters({ radiusKm: radius, page: 1 })}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
