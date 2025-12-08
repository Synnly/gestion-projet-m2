// FilterList.tsx
import React, { useState, useMemo } from 'react';
import { RotateCcw, MapPin, ChevronUp, Map, Settings } from 'lucide-react';
import { FilterInput } from '../../components/inputs/selectInput';
import { internshipFilters, mapOptionToPayload } from './filters';
import { useInternshipStore } from '../../store/useInternshipStore';
import SortSelect from './SortSelect';
import CityRadiusModal from '../../components/CityRadius/CityRadiusModal';

function FilterChip({
    label,
    onRemove,
    children,
}: {
    label: string;
    onRemove?: () => void;
    children?: React.ReactNode;
}) {
    return (
        <div className="badge badge-outline gap-2 rounded-md px-2 py-1 flex items-center">
            <span className="text-sm">{children ?? label}</span>
            {onRemove && (
                <button
                    type="button"
                    className="btn btn-ghost btn-xs p-0 ml-1"
                    onClick={onRemove}
                    aria-label={`Retirer ${label}`}
                >
                    <ChevronUp className="h-3 w-3 transform rotate-45" />
                </button>
            )}
        </div>
    );
}

export default function FilterList() {
    const filters = useInternshipStore((s) => s.filters);
    const setFilters = useInternshipStore((s) => s.setFilters);
    const [minimal, setMinimal] = useState<boolean>(true);
    const [mapOpen, setMapOpen] = useState(false);

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

    const activeChips = useMemo(() => {
        const chips: Array<{ key: string; label: string; value: any }> = [];

        internshipFilters.forEach((f) => {
            // skip standalone city display; we'll only show combined location when radius exists
            if (f.key === 'city') return;

            const value = (filters as any)[f.key];
            if (value !== undefined && value !== null && value !== '') {
                if (f.key === 'radiusKm') {
                    const city = (filters as any).city;
                    if (city) chips.push({ key: 'location', label: `${city} – ${value} km`, value });
                } else {
                    chips.push({ key: f.key, label: `${f.label}: ${String(value)}`, value });
                }
            }
        });

        return chips;
    }, [filters]);

    return (
        <div className="w-full space-y-2 pb-4">
            <div className="card bg-base-100 shadow-md">
                <div className="card-body p-3">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
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
                            <button
                                type="button"
                                className="btn btn-xs btn-ghost flex items-center"
                                onClick={() => setMapOpen(true)}
                                title="Afficher la carte"
                            >
                                <Map className="h-4 w-4 mr-1" />
                                Localisation
                            </button>

                            <button
                                type="button"
                                className="btn btn-xs btn-ghost"
                                onClick={() => setMinimal((s) => !s)}
                                title={minimal ? 'Afficher les options' : 'Masquer les options'}
                                aria-pressed={!minimal}
                            >
                                <Settings className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap mt-2">
                        {activeChips.length === 0 ? (
                            <span className="text-sm text-base-content/60">Aucun filtre actif</span>
                        ) : (
                            activeChips.map((c) => (
                                <FilterChip
                                    key={c.key}
                                    label={c.label}
                                    onRemove={() => {
                                        if (c.key === 'location') {
                                            setFilters({ city: undefined, radiusKm: undefined, page: 1 });
                                        } else {
                                            const payload: any = {};
                                            payload[c.key] = undefined;
                                            payload.page = 1;
                                            setFilters(payload);
                                        }
                                    }}
                                >
                                    {c.label}
                                </FilterChip>
                            ))
                        )}
                    </div>

                    <div
                        className={`mt-3 flex flex-row gap-x-4 items-start transition-all duration-200 ${
                            minimal
                                ? 'max-h-0 overflow-hidden opacity-0 pointer-events-none'
                                : 'max-h-[200px] opacity-100'
                        }`}
                        aria-hidden={minimal}
                    >
                        {internshipFilters
                            .filter((f) => f.key !== 'city' && f.key !== 'radiusKm')
                            .map((f) => (
                                <div key={f.key} className="form-control min-w-[150px]">
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

                        <div className="min-w-[120px]">
                            <label className="label py-0.5">
                                <span className="label-text text-sm">&nbsp;</span>
                            </label>
                            <div className="mt-1">
                                <SortSelect />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card-body p-3 pt-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <div>
                                <div className="text-sm font-medium">Localisation</div>
                                <div className="text-xs text-base-content/60">
                                    {filters.city && filters.radiusKm
                                        ? `${filters.city} – ${filters.radiusKm} km`
                                        : 'Aucune sélection'}
                                </div>
                            </div>
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
