/**
 * Formats a number into a more readable string with 'k' for thousands and 'M' for millions.
 * @param num - The number to format.
 * @returns The formatted number as a string.
 */
export function formatNumber(num: number): string {
    if (num >= 1_000_000) {
        const value = num / 1_000_000;
        return (value % 1 === 0 ? String(value) : value.toFixed(1).replace(/\.0$/, '')) + 'M';
    }
    if (num >= 1000) {
        const value = num / 1000;
        return (value % 1 === 0 ? String(value) : value.toFixed(1).replace(/\.0$/, '')) + 'k';
    }
    return String(num);
}
