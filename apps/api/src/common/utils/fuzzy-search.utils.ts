import { escapeRegexLiteral } from './regex.utils';

/**
 * Map of latin characters to regex character classes including common diacritics.
 */
const ACCENT_CLASS_MAP: Readonly<Record<string, string>> = Object.freeze({
    a: '[aàáâãäåāăą]',
    e: '[eèéêëēĕėęě]',
    i: '[iìíîïĩīĭį]',
    o: '[oòóôõöøōŏő]',
    u: '[uùúûüũūŭůű]',
    c: '[cçćĉċč]',
    n: '[nñńņň]',
    y: '[yýÿŷ]',
});

/**
 * Normalize text by removing accents and converting to lowercase.
 * @param text the input text
 * @returns normalized text
 */
export function normalizeText(text: string): string {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

/**
 * Tokenize a search query into individual terms.
 * @param value the search query
 * @param maxTokens maximum number of tokens to return (default: 8)
 * @returns array of tokens
 */
export function tokenizeSearchQuery(value: string, maxTokens: number = 8): string[] {
    return value
        .split(/\s+/)
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, maxTokens);
}

/**
 * Build a fuzzy regex pattern that tolerates typos and accent variations.
 * - Accent variations: each latin char matches itself + common diacritics.
 * - Typo tolerance: for tokens >= 5 chars, allow an optional char between middle letters.
 */
export function buildFuzzyPattern(term: string): string {
    const normalized = normalizeText(term);
    const escaped = escapeRegexLiteral(normalized);

    const allowTypos = escaped.length >= 5;

    return escaped
        .split('')
        .map((char, index) => {
            const charPattern = ACCENT_CLASS_MAP[char] ?? char;
            if (allowTypos && index > 0 && index < escaped.length - 1) return `${charPattern}.?`;
            return charPattern;
        })
        .join('');
}

/**
 * Build a fuzzy regex for the given term.
 * @param term the search term
 * @returns RegExp instance
 */
export function buildFuzzyRegex(term: string): RegExp {
    return new RegExp(buildFuzzyPattern(term), 'i');
}
