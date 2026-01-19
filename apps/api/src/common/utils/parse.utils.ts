/**
 * Converts the input value to a finite number if possible; otherwise, returns undefined.
 * Special numeric values such as Infinity, -Infinity, and NaN (including their string
 * representations) are treated as invalid and result in undefined.
 * @param value the input value
 * @returns a number or undefined
 */
export function toNumberOrUndefined(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    if (typeof value === 'string') {
        const normalized = value.trim();
        if (
            normalized === 'Infinity' ||
            normalized === '-Infinity' ||
            normalized.toLowerCase() === 'nan'
        ) {
            return undefined;
        }
    }
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n : undefined;
}

/**
 * Converts the input value to a string if possible; otherwise, returns undefined.
 * @param value the input value
 * @returns a string or undefined
 */
export function toStringOrUndefined(value: unknown): string | undefined {
    if (value === null || value === undefined) return undefined;
    const s = String(value).trim();
    return s.length > 0 ? s : undefined;
}
