import { PostType } from '../../../src/post/post-type.enum';
import PostTypeDefault from '../../../src/post/post-type.enum';

describe('PostType', () => {
    it('should have Presentiel value when PostType is defined', () => {
        expect(PostType.Presentiel).toBe('Présentiel');
    });

    it('should have Teletravail value when PostType is defined', () => {
        expect(PostType.Teletravail).toBe('Télétravail');
    });

    it('should have Hybride value when PostType is defined', () => {
        expect(PostType.Hybride).toBe('Hybride');
    });

    it('should have exactly 3 values when PostType is defined', () => {
        const values = Object.values(PostType);
        expect(values).toHaveLength(3);
    });

    it('should export default PostType when default import is used', () => {
        expect(PostTypeDefault).toBe(PostType);
    });

    it('should have all expected keys when PostType is defined', () => {
        const keys = Object.keys(PostType);
        expect(keys).toContain('Presentiel');
        expect(keys).toContain('Teletravail');
        expect(keys).toContain('Hybride');
    });

    it('should return correct values for each key when accessed', () => {
        expect(PostType['Presentiel']).toBe('Présentiel');
        expect(PostType['Teletravail']).toBe('Télétravail');
        expect(PostType['Hybride']).toBe('Hybride');
    });
});
