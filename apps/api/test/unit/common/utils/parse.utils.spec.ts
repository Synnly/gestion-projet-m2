import { toNumberOrUndefined, toStringOrUndefined } from '../../../../src/common/utils/parse.utils';

describe('parse.utils', () => {
    describe('toNumberOrUndefined', () => {
        describe('valid numbers', () => {
            it('returns numeric values as-is', () => {
                expect(toNumberOrUndefined(0)).toBe(0);
                expect(toNumberOrUndefined(42)).toBe(42);
                expect(toNumberOrUndefined(-10)).toBe(-10);
                expect(toNumberOrUndefined(3.14)).toBe(3.14);
                expect(toNumberOrUndefined(-2.5)).toBe(-2.5);
            });

            it('parses valid numeric strings', () => {
                expect(toNumberOrUndefined('0')).toBe(0);
                expect(toNumberOrUndefined('42')).toBe(42);
                expect(toNumberOrUndefined('-10')).toBe(-10);
                expect(toNumberOrUndefined('3.14')).toBe(3.14);
                expect(toNumberOrUndefined('-2.5')).toBe(-2.5);
            });

            it('handles whitespace in strings', () => {
                expect(toNumberOrUndefined('  42  ')).toBe(42);
                expect(toNumberOrUndefined('\t100\n')).toBe(100);
                expect(toNumberOrUndefined('  -3.14  ')).toBe(-3.14);
            });

            it('parses scientific notation', () => {
                expect(toNumberOrUndefined('1e3')).toBe(1000);
                expect(toNumberOrUndefined('1.5e2')).toBe(150);
                expect(toNumberOrUndefined('2e-3')).toBe(0.002);
            });
        });

        describe('invalid inputs return undefined', () => {
            it('returns undefined for null', () => {
                expect(toNumberOrUndefined(null)).toBeUndefined();
            });

            it('returns undefined for undefined', () => {
                expect(toNumberOrUndefined(undefined)).toBeUndefined();
            });

            it('returns undefined for empty string', () => {
                expect(toNumberOrUndefined('')).toBeUndefined();
            });

            it('returns undefined for non-numeric strings', () => {
                expect(toNumberOrUndefined('hello')).toBeUndefined();
                expect(toNumberOrUndefined('abc123')).toBeUndefined();
                expect(toNumberOrUndefined('12.34.56')).toBeUndefined();
            });

            it('returns undefined for Infinity', () => {
                expect(toNumberOrUndefined(Infinity)).toBeUndefined();
                expect(toNumberOrUndefined(-Infinity)).toBeUndefined();
                expect(toNumberOrUndefined('Infinity')).toBeUndefined();
                expect(toNumberOrUndefined('-Infinity')).toBeUndefined();
                expect(toNumberOrUndefined('  Infinity  ')).toBeUndefined();
            });

            it('returns undefined for NaN', () => {
                expect(toNumberOrUndefined(NaN)).toBeUndefined();
                expect(toNumberOrUndefined('NaN')).toBeUndefined();
                expect(toNumberOrUndefined('nan')).toBeUndefined();
                expect(toNumberOrUndefined('NAN')).toBeUndefined();
                expect(toNumberOrUndefined('  NaN  ')).toBeUndefined();
            });

            it('returns undefined for objects', () => {
                expect(toNumberOrUndefined({})).toBeUndefined();
                expect(toNumberOrUndefined({ value: 42 })).toBeUndefined();
                // Note: [] converts to 0, [1,2,3] converts to NaN
                expect(toNumberOrUndefined([1, 2, 3])).toBeUndefined();
            });

            it('returns undefined for boolean-like strings', () => {
                expect(toNumberOrUndefined('true')).toBeUndefined();
                expect(toNumberOrUndefined('false')).toBeUndefined();
            });
        });

        describe('edge cases', () => {
            it('handles zero correctly', () => {
                expect(toNumberOrUndefined(0)).toBe(0);
                expect(toNumberOrUndefined('0')).toBe(0);
                // Note: '-0' parses to -0 which is technically different from 0 in Object.is
                expect(toNumberOrUndefined('-0')).toBe(-0);
            });

            it('handles very large numbers', () => {
                expect(toNumberOrUndefined(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER);
                expect(toNumberOrUndefined(Number.MIN_SAFE_INTEGER)).toBe(Number.MIN_SAFE_INTEGER);
            });

            it('handles very small decimals', () => {
                expect(toNumberOrUndefined(0.0001)).toBe(0.0001);
                expect(toNumberOrUndefined('0.0001')).toBe(0.0001);
            });
        });
    });

    describe('toStringOrUndefined', () => {
        describe('valid strings', () => {
            it('returns string values as-is', () => {
                expect(toStringOrUndefined('hello')).toBe('hello');
                expect(toStringOrUndefined('world')).toBe('world');
                expect(toStringOrUndefined('test123')).toBe('test123');
            });

            it('trims whitespace from strings', () => {
                expect(toStringOrUndefined('  hello  ')).toBe('hello');
                expect(toStringOrUndefined('\tworld\n')).toBe('world');
                expect(toStringOrUndefined('  test  ')).toBe('test');
            });

            it('converts numbers to strings', () => {
                expect(toStringOrUndefined(42)).toBe('42');
                expect(toStringOrUndefined(0)).toBe('0');
                expect(toStringOrUndefined(-10)).toBe('-10');
                expect(toStringOrUndefined(3.14)).toBe('3.14');
            });

            it('converts booleans to strings', () => {
                expect(toStringOrUndefined(true)).toBe('true');
                expect(toStringOrUndefined(false)).toBe('false');
            });

            it('converts objects to strings', () => {
                expect(toStringOrUndefined({})).toBe('[object Object]');
                expect(toStringOrUndefined({ toString: () => 'custom' })).toBe('custom');
            });

            it('converts arrays to strings', () => {
                expect(toStringOrUndefined([1, 2, 3])).toBe('1,2,3');
                expect(toStringOrUndefined(['a', 'b'])).toBe('a,b');
            });
        });

        describe('invalid inputs return undefined', () => {
            it('returns undefined for null', () => {
                expect(toStringOrUndefined(null)).toBeUndefined();
            });

            it('returns undefined for undefined', () => {
                expect(toStringOrUndefined(undefined)).toBeUndefined();
            });

            it('returns undefined for empty string', () => {
                expect(toStringOrUndefined('')).toBeUndefined();
            });

            it('returns undefined for whitespace-only strings', () => {
                expect(toStringOrUndefined('   ')).toBeUndefined();
                expect(toStringOrUndefined('\t\n')).toBeUndefined();
                expect(toStringOrUndefined('  \t  \n  ')).toBeUndefined();
            });
        });

        describe('edge cases', () => {
            it('preserves special characters', () => {
                expect(toStringOrUndefined('hello@world.com')).toBe('hello@world.com');
                expect(toStringOrUndefined('test-123_abc')).toBe('test-123_abc');
                expect(toStringOrUndefined('$100')).toBe('$100');
            });

            it('handles unicode characters', () => {
                expect(toStringOrUndefined('café')).toBe('café');
                expect(toStringOrUndefined('你好')).toBe('你好');
                expect(toStringOrUndefined('🎉')).toBe('🎉');
            });

            it('handles newlines and tabs within content', () => {
                expect(toStringOrUndefined('hello\nworld')).toBe('hello\nworld');
                expect(toStringOrUndefined('one\ttwo')).toBe('one\ttwo');
            });

            it('trims but preserves internal whitespace', () => {
                expect(toStringOrUndefined('  hello world  ')).toBe('hello world');
                expect(toStringOrUndefined('  one  two  ')).toBe('one  two');
            });
        });
    });
});
