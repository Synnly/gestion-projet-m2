import { CreationFailedError } from 'src/errors/creationFailedError';

describe('CreationFailedError', () => {
    it('has default message and correct name', () => {
        const err = new CreationFailedError();
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe('Creation failed');
        expect(err.name).toBe('CreationFailedError');
    });

    it('uses provided message when specified', () => {
        const err = new CreationFailedError('custom');
        expect(err.message).toBe('custom');
    });
});
