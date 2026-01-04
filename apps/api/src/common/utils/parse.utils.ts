/**
 * Converts the input value to a number if possible; otherwise, returns undefined.
 * @param value the input value
 * @returns a number or undefined
 */
export function toNumberOrUndefined(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') return undefined;
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
