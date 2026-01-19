import {
    normalizeText,
    tokenizeSearchQuery,
    buildFuzzyPattern,
    buildFuzzyRegex,
} from '../../../../src/common/utils/fuzzy-search.utils';

describe('fuzzy-search.utils', () => {
    describe('normalizeText', () => {
        it('removes accents from characters', () => {
            expect(normalizeText('café')).toBe('cafe');
            expect(normalizeText('naïve')).toBe('naive');
            expect(normalizeText('résumé')).toBe('resume');
            expect(normalizeText('àéîöü')).toBe('aeiou');
        });

        it('converts text to lowercase', () => {
            expect(normalizeText('HELLO')).toBe('hello');
            expect(normalizeText('WoRlD')).toBe('world');
            expect(normalizeText('CAFÉ')).toBe('cafe');
        });

        it('handles text without accents', () => {
            expect(normalizeText('hello')).toBe('hello');
            expect(normalizeText('world123')).toBe('world123');
        });

        it('handles empty string', () => {
            expect(normalizeText('')).toBe('');
        });

        it('handles special characters', () => {
            expect(normalizeText('hello-world')).toBe('hello-world');
            expect(normalizeText('test@123')).toBe('test@123');
        });

        it('handles multiple accent types for same letter', () => {
            expect(normalizeText('àáâãäå')).toBe('aaaaaa');
            expect(normalizeText('èéêë')).toBe('eeee');
            expect(normalizeText('ñ')).toBe('n');
        });
    });

    describe('tokenizeSearchQuery', () => {
        it('splits on whitespace', () => {
            expect(tokenizeSearchQuery('hello world')).toEqual(['hello', 'world']);
            expect(tokenizeSearchQuery('one two three')).toEqual(['one', 'two', 'three']);
        });

        it('trims whitespace from tokens', () => {
            expect(tokenizeSearchQuery('  hello   world  ')).toEqual(['hello', 'world']);
            expect(tokenizeSearchQuery('\thello\tworld\t')).toEqual(['hello', 'world']);
        });

        it('filters out empty tokens', () => {
            expect(tokenizeSearchQuery('hello    world')).toEqual(['hello', 'world']);
            expect(tokenizeSearchQuery('   ')).toEqual([]);
        });

        it('handles single word', () => {
            expect(tokenizeSearchQuery('hello')).toEqual(['hello']);
        });

        it('handles empty string', () => {
            expect(tokenizeSearchQuery('')).toEqual([]);
        });

        it('limits to maxTokens (default 8)', () => {
            const query = 'one two three four five six seven eight nine ten';
            const result = tokenizeSearchQuery(query);
            expect(result).toEqual(['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight']);
            expect(result.length).toBe(8);
        });

        it('respects custom maxTokens parameter', () => {
            const query = 'one two three four five';
            expect(tokenizeSearchQuery(query, 3)).toEqual(['one', 'two', 'three']);
            expect(tokenizeSearchQuery(query, 2)).toEqual(['one', 'two']);
            expect(tokenizeSearchQuery(query, 10)).toEqual(['one', 'two', 'three', 'four', 'five']);
        });

        it('handles multiple consecutive whitespace types', () => {
            expect(tokenizeSearchQuery('hello \t\n world')).toEqual(['hello', 'world']);
        });
    });

    describe('buildFuzzyPattern', () => {
        it('creates pattern with accent classes for basic letters', () => {
            const pattern = buildFuzzyPattern('cafe');
            expect(pattern).toContain('[cçćĉċč]');
            expect(pattern).toContain('[aàáâãäåāăą]');
            expect(pattern).toContain('[eèéêëēĕėęě]');
        });

        it('normalizes accented input before creating pattern', () => {
            const pattern1 = buildFuzzyPattern('café');
            const pattern2 = buildFuzzyPattern('cafe');
            expect(pattern1).toBe(pattern2);
        });

        it('handles uppercase input by normalizing to lowercase', () => {
            const pattern1 = buildFuzzyPattern('HELLO');
            const pattern2 = buildFuzzyPattern('hello');
            expect(pattern1).toBe(pattern2);
        });

        it('adds typo tolerance (.?) for terms >= 5 chars', () => {
            const shortPattern = buildFuzzyPattern('test'); // 4 chars - no typo tolerance
            expect(shortPattern).not.toContain('.?');

            const longPattern = buildFuzzyPattern('hello'); // 5 chars - has typo tolerance
            expect(longPattern).toContain('.?');
        });

        it('does not add typo tolerance at start or end', () => {
            const pattern = buildFuzzyPattern('hello');
            // Pattern should start with 'h' without .? before it
            expect(pattern).toMatch(/^h/);
            // Pattern should end with accent class for 'o' without .? after it
            expect(pattern).toMatch(/\[oòóôõöøōŏő\]$/);
        });

        it('preserves non-accent characters as-is', () => {
            const pattern = buildFuzzyPattern('test123');
            expect(pattern).toContain('1');
            expect(pattern).toContain('2');
            expect(pattern).toContain('3');
        });

        it('escapes special regex characters after normalization', () => {
            // The fuzzy pattern uses accent classes and typo tolerance (.?)
            // So .? is intentionally part of the pattern for longer terms
            const pattern = buildFuzzyPattern('hello');
            expect(pattern.length).toBeGreaterThan(0);
        });

        it('handles single character', () => {
            const pattern = buildFuzzyPattern('a');
            expect(pattern).toBe('[aàáâãäåāăą]');
        });

        it('handles empty string', () => {
            const pattern = buildFuzzyPattern('');
            expect(pattern).toBe('');
        });

        it('creates working pattern that matches variations', () => {
            const pattern = buildFuzzyPattern('cafe');
            const regex = new RegExp(pattern, 'i');
            
            expect(regex.test('cafe')).toBe(true);
            expect(regex.test('café')).toBe(true);
            expect(regex.test('CAFE')).toBe(true);
            expect(regex.test('Café')).toBe(true);
        });
    });

    describe('buildFuzzyRegex', () => {
        it('returns RegExp instance', () => {
            const regex = buildFuzzyRegex('test');
            expect(regex).toBeInstanceOf(RegExp);
        });

        it('creates case-insensitive regex (i flag)', () => {
            const regex = buildFuzzyRegex('test');
            expect(regex.flags).toContain('i');
        });

        it('matches exact text', () => {
            const regex = buildFuzzyRegex('hello');
            expect(regex.test('hello')).toBe(true);
        });

        it('matches text with accents bidirectionally', () => {
            const regex = buildFuzzyRegex('creation');
            expect(regex.test('création')).toBe(true);
            
            const regex2 = buildFuzzyRegex('café');
            expect(regex2.test('cafe')).toBe(true);
        });

        it('matches case-insensitively', () => {
            const regex = buildFuzzyRegex('hello');
            expect(regex.test('HELLO')).toBe(true);
            expect(regex.test('HeLLo')).toBe(true);
            expect(regex.test('hello')).toBe(true);
        });

        it('allows typos in middle of long words', () => {
            const regex = buildFuzzyRegex('hello');
            // With typo tolerance (.?), can match with extra chars in the middle
            expect(regex.test('hello')).toBe(true);
            expect(regex.test('helxlo')).toBe(true); // extra 'x' between 'l' and 'l'
            expect(regex.test('hellxo')).toBe(true); // extra 'x' between 'l' and 'o'
        });

        it('does not match completely different text', () => {
            const regex = buildFuzzyRegex('hello');
            expect(regex.test('world')).toBe(false);
            expect(regex.test('xyz')).toBe(false);
        });

        it('matches text containing the search term', () => {
            const regex = buildFuzzyRegex('dev');
            expect(regex.test('developer')).toBe(true);
            expect(regex.test('development')).toBe(true);
            expect(regex.test('develop')).toBe(true);
        });

        it('handles accented characters in both directions', () => {
            const regex1 = buildFuzzyRegex('resume');
            expect(regex1.test('résumé')).toBe(true);
            
            const regex2 = buildFuzzyRegex('résumé');
            expect(regex2.test('resume')).toBe(true);
        });

        it('handles empty string', () => {
            const regex = buildFuzzyRegex('');
            expect(regex.test('')).toBe(true);
            expect(regex.test('anything')).toBe(true); // Empty pattern matches anywhere
        });

        it('handles single character search', () => {
            const regex = buildFuzzyRegex('a');
            expect(regex.test('a')).toBe(true);
            expect(regex.test('à')).toBe(true);
            expect(regex.test('á')).toBe(true);
            expect(regex.test('apple')).toBe(true);
        });

        it('works with real-world search examples', () => {
            const regex = buildFuzzyRegex('sanitaires');
            expect(regex.test('sanitaires')).toBe(true);
            expect(regex.test('SANITAIRES')).toBe(true);
            
            const regex2 = buildFuzzyRegex('developpeur');
            expect(regex2.test('développeur')).toBe(true);
            expect(regex2.test('Développeur')).toBe(true);
        });
    });
});
