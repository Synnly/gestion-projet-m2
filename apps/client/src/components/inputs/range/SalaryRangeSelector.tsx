import { useState, useEffect, useRef } from 'react';

interface SalaryRangeSelectorProps {
    min: number | undefined;
    max: number | undefined;
    onChange: (range: { min: number | undefined; max: number | undefined }) => void;
    minAllowed?: number;
    maxAllowed?: number;
    step?: number;
}

export default function SalaryRangeSelector({
    min,
    max,
    onChange,
    minAllowed = 0,
    maxAllowed = 2500,
    step = 25,
}: SalaryRangeSelectorProps) {
    const [range, setRange] = useState({
        min: min ?? minAllowed,
        max: max ?? maxAllowed,
    });

    const minInputRef = useRef<HTMLInputElement>(null);
    const maxInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setRange({
            min: min ?? minAllowed,
            max: max ?? maxAllowed,
        });
    }, [min, max, minAllowed, maxAllowed]);

    const updateMin = (value: number) => {
        const newMin = Math.min(value, range.max - step);
        const newRange = { ...range, min: newMin };
        setRange(newRange);

        const filterMin = newMin === minAllowed ? undefined : newMin;
        const filterMax = range.max === maxAllowed ? undefined : range.max;
        onChange({ min: filterMin, max: filterMax });
    };

    const updateMax = (value: number) => {
        const newMax = Math.max(value, range.min + step);
        const newRange = { ...range, max: newMax };
        setRange(newRange);

        const filterMin = range.min === minAllowed ? undefined : range.min;
        const filterMax = newMax === maxAllowed ? undefined : newMax;
        onChange({ min: filterMin, max: filterMax });
    };

    const formatSalary = (value: number) => {
        return value.toLocaleString('fr-FR');
    };

    const minPercent = ((range.min - minAllowed) / (maxAllowed - minAllowed)) * 100;
    const maxPercent = ((range.max - minAllowed) / (maxAllowed - minAllowed)) * 100;

    return (
        <div className="form-control w-80">
            <label className="label py-0.5 pb-2">
                <span className="label-text text-sm font-medium">Salaire mensuel</span>
            </label>

            <div className="flex items-center justify-between gap-2 mb-4">
                <div className="badge badge-lg badge-primary gap-2">
                    <span className="text-xs opacity-70">Min</span>
                    <span className="font-semibold">{formatSalary(range.min)}€</span>
                </div>
                <div className="divider divider-horizontal mx-0 w-8"></div>
                <div className="badge badge-lg badge-secondary gap-2">
                    <span className="text-xs opacity-70">Max</span>
                    <span className="font-semibold">{formatSalary(range.max)}€</span>
                </div>
            </div>

            <div className="relative pt-2 pb-6">
                <div className="absolute top-1/2 left-0 right-0 h-2 -translate-y-1/2 bg-base-300 rounded-full"></div>

                <div
                    className="absolute top-1/2 h-2 -translate-y-1/2 bg-linear-to-r from-primary to-secondary rounded-full shadow-sm"
                    style={{
                        left: `${minPercent}%`,
                        right: `${100 - maxPercent}%`,
                    }}
                ></div>

                <input
                    ref={minInputRef}
                    type="range"
                    className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-base-100 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-base-100 [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:hover:scale-110 [&::-moz-range-thumb]:transition-transform"
                    style={{ zIndex: range.min > maxAllowed - (maxAllowed - minAllowed) * 0.3 ? 5 : 3 }}
                    min={minAllowed}
                    max={maxAllowed}
                    step={step}
                    value={range.min}
                    onChange={(e) => updateMin(Number(e.target.value))}
                    aria-label="Salaire minimum"
                />

                <input
                    ref={maxInputRef}
                    type="range"
                    className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-secondary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-base-100 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-secondary [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-base-100 [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:hover:scale-110 [&::-moz-range-thumb]:transition-transform"
                    style={{ zIndex: range.max < minAllowed + (maxAllowed - minAllowed) * 0.3 ? 5 : 4 }}
                    min={minAllowed}
                    max={maxAllowed}
                    step={step}
                    value={range.max}
                    onChange={(e) => updateMax(Number(e.target.value))}
                    aria-label="Salaire maximum"
                />
            </div>

            <div className="flex justify-between text-xs text-base-content/60 px-1">
                <span>{formatSalary(minAllowed)}€</span>
                <span>{formatSalary(maxAllowed)}€</span>
            </div>
        </div>
    );
}
