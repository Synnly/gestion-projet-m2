/**
 * Escapes special regex characters in a string to safely use it in a regex pattern.
 * @param value the input string
 * @returns the escaped string
 */
export function escapeRegexLiteral(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');
}
