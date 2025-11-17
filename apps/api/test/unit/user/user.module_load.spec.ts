describe('User module load', () => {
    it('should require the users module file and have UsersModule defined', () => {
        const mod = require('../../../src/user/user.module');
        expect(mod).toBeDefined();
        expect(mod.UsersModule).toBeDefined();
    });
});
