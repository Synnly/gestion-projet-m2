import { escapeRegexLiteral } from '../../../../src/common/utils/regex.utils';

describe('regex.utils', () => {
    describe('escapeRegexLiteral', () => {
        it('escapes dot (.)', () => {
            expect(escapeRegexLiteral('hello.world')).toBe('hello\\.world');
            expect(escapeRegexLiteral('...')).toBe('\\.\\.\\.');
        });

        it('escapes asterisk (*)', () => {
            expect(escapeRegexLiteral('hello*world')).toBe('hello\\*world');
            expect(escapeRegexLiteral('***')).toBe('\\*\\*\\*');
        });

        it('escapes plus (+)', () => {
            expect(escapeRegexLiteral('hello+world')).toBe('hello\\+world');
            expect(escapeRegexLiteral('+++')).toBe('\\+\\+\\+');
        });

        it('escapes question mark (?)', () => {
            expect(escapeRegexLiteral('hello?world')).toBe('hello\\?world');
            expect(escapeRegexLiteral('???')).toBe('\\?\\?\\?');
        });

        it('escapes caret (^)', () => {
            expect(escapeRegexLiteral('^start')).toBe('\\^start');
            expect(escapeRegexLiteral('^^^')).toBe('\\^\\^\\^');
        });

        it('escapes dollar ($)', () => {
            expect(escapeRegexLiteral('end$')).toBe('end\\$');
            expect(escapeRegexLiteral('$$$')).toBe('\\$\\$\\$');
        });

        it('escapes curly braces ({})', () => {
            expect(escapeRegexLiteral('hello{world}')).toBe('hello\\{world\\}');
            expect(escapeRegexLiteral('{3,5}')).toBe('\\{3,5\\}');
        });

        it('escapes parentheses (())', () => {
            expect(escapeRegexLiteral('(hello)')).toBe('\\(hello\\)');
            expect(escapeRegexLiteral('((()))')).toBe('\\(\\(\\(\\)\\)\\)');
        });

        it('escapes pipe (|)', () => {
            expect(escapeRegexLiteral('hello|world')).toBe('hello\\|world');
            expect(escapeRegexLiteral('|||')).toBe('\\|\\|\\|');
        });

        it('escapes square brackets ([])', () => {
            expect(escapeRegexLiteral('[hello]')).toBe('\\[hello\\]');
            expect(escapeRegexLiteral('[a-z]')).toBe('\\[a\\-z\\]');
        });

        it('escapes backslash (\\)', () => {
            expect(escapeRegexLiteral('hello\\world')).toBe('hello\\\\world');
            expect(escapeRegexLiteral('\\\\\\')).toBe('\\\\\\\\\\\\');
        });

        it('escapes hyphen (-)', () => {
            expect(escapeRegexLiteral('hello-world')).toBe('hello\\-world');
            expect(escapeRegexLiteral('a-z')).toBe('a\\-z');
        });

        it('escapes multiple special characters together', () => {
            expect(escapeRegexLiteral('.*+?^$')).toBe('\\.\\*\\+\\?\\^\\$');
            expect(escapeRegexLiteral('{}()|[]')).toBe('\\{\\}\\(\\)\\|\\[\\]');
        });

        it('escapes complex patterns', () => {
            expect(escapeRegexLiteral('dev.*+?^${}()|[]\\\\')).toBe('dev\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\\\\\');
        });

        it('leaves regular text unchanged', () => {
            expect(escapeRegexLiteral('hello')).toBe('hello');
            expect(escapeRegexLiteral('world')).toBe('world');
            expect(escapeRegexLiteral('test123')).toBe('test123');
        });

        it('handles empty string', () => {
            expect(escapeRegexLiteral('')).toBe('');
        });

        it('handles mixed text and special characters', () => {
            expect(escapeRegexLiteral('user@example.com')).toBe('user@example\\.com');
            expect(escapeRegexLiteral('price: $100')).toBe('price: \\$100');
            expect(escapeRegexLiteral('file.txt')).toBe('file\\.txt');
        });

        it('handles whitespace', () => {
            expect(escapeRegexLiteral('hello world')).toBe('hello world');
            expect(escapeRegexLiteral('  spaces  ')).toBe('  spaces  ');
            expect(escapeRegexLiteral('\t\n')).toBe('\t\n');
        });

        it('handles unicode characters', () => {
            expect(escapeRegexLiteral('café')).toBe('café');
            expect(escapeRegexLiteral('你好')).toBe('你好');
            expect(escapeRegexLiteral('🎉')).toBe('🎉');
        });

        it('creates valid escaped patterns for regex', () => {
            // Test that escaped strings work in actual RegExp
            const specialChars = '.*+?^${}()|[]\\-';
            const escaped = escapeRegexLiteral(specialChars);
            const regex = new RegExp(escaped);
            
            // Should match the literal special characters
            expect(regex.test(specialChars)).toBe(true);
        });

        it('escapes patterns that would be regex quantifiers', () => {
            expect(escapeRegexLiteral('a*')).toBe('a\\*');
            expect(escapeRegexLiteral('b+')).toBe('b\\+');
            expect(escapeRegexLiteral('c?')).toBe('c\\?');
            expect(escapeRegexLiteral('d{2,3}')).toBe('d\\{2,3\\}');
        });

        it('escapes patterns that would be regex anchors', () => {
            expect(escapeRegexLiteral('^start$')).toBe('\\^start\\$');
        });

        it('escapes patterns that would be regex character classes', () => {
            expect(escapeRegexLiteral('[a-z]')).toBe('\\[a\\-z\\]');
            expect(escapeRegexLiteral('[^abc]')).toBe('\\[\\^abc\\]');
        });

        it('escapes patterns that would be regex groups', () => {
            expect(escapeRegexLiteral('(group)')).toBe('\\(group\\)');
            expect(escapeRegexLiteral('(a|b)')).toBe('\\(a\\|b\\)');
        });

        it('handles consecutive special characters', () => {
            expect(escapeRegexLiteral('...')).toBe('\\.\\.\\.');
            expect(escapeRegexLiteral('***')).toBe('\\*\\*\\*');
            expect(escapeRegexLiteral('???')).toBe('\\?\\?\\?');
        });

        it('handles real-world examples', () => {
            // Email-like patterns
            expect(escapeRegexLiteral('user+tag@example.com')).toBe('user\\+tag@example\\.com');
            
            // File paths
            expect(escapeRegexLiteral('C:\\Users\\test')).toBe('C:\\\\Users\\\\test');
            
            // URLs
            expect(escapeRegexLiteral('https://example.com?query=value')).toBe('https://example\\.com\\?query=value');
            
            // Mathematical expressions
            expect(escapeRegexLiteral('(x+y)*2')).toBe('\\(x\\+y\\)\\*2');
        });
    });
});
