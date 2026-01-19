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
 *
 * Note: Results are intentionally truncated to at most `maxTokens` tokens
 * (default: 8). This limit helps prevent denial-of-service issues and
 * excessive regex complexity when building fuzzy search patterns from user
 * input. Callers that need to know whether truncation occurred can compare
 * the number of returned tokens with the number of raw whitespace-separated
 * segments in the original query.
 *
 * @param value the search query
 * @param maxTokens maximum number of tokens to return (default: 8)
 * @returns array of tokens, truncated to at most `maxTokens` entries
 */
export function tokenizeSearchQuery(value: string, maxTokens: number = 8): string[] {
    return (
        value
            .split(/\s+/)
            .map((t) => t.trim())
            .filter(Boolean)
            // Intentionally limit the number of tokens to avoid excessive fuzzy-regex complexity.
            .slice(0, maxTokens)
    );
}

/**
 * Build a fuzzy regex pattern that tolerates typos and accent variations.
 * - Accent variations: each latin char matches itself + common diacritics.
 * - Typo tolerance: for tokens >= 5 chars, allow an optional char between middle letters.
 *
 * Implementation note: The order of operations is:
 * 1. normalizeText() removes accents and lowercases, producing ONLY alphanumeric chars
 * 2. escapeRegexLiteral() escapes regex special chars (safe because input is alphanumeric)
 * 3. Character substitution with ACCENT_CLASS_MAP adds intentionally unescaped `[` `]`
 *    (these are regex metacharacters we want to preserve as character classes)
 *
 * This order is safe because normalization guarantees no special chars exist before escaping.
 */
export function buildFuzzyPattern(term: string): string {
    // Step 1: Normalize to alphanumeric (removes accents, lowercases)
    const normalized = normalizeText(term);

    // Step 2: Escape regex special chars (safe because normalized is alphanumeric-only)
    const escaped = escapeRegexLiteral(normalized);

    const allowTypos = escaped.length >= 5;

    // Step 3: Substitute each char with its accent class (contains unescaped [ ] by design)
    return escaped
        .split('')
        .map((char, index) => {
            // Use accent class if available, otherwise keep the escaped char as-is
            const charPattern = ACCENT_CLASS_MAP[char] ?? char;

            // Add optional typo tolerance (.?) for middle chars in longer terms
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
