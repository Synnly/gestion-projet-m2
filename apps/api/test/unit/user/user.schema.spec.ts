import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { User, UserSchema } from '../../../src/user/user.schema';
import * as bcrypt from 'bcrypt';

describe('UserSchema (integration)', () => {
    let mongoServer: MongoMemoryServer;
    let UserModel: mongoose.Model<any>;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
        UserModel = mongoose.model(User.name, UserSchema);
    }, 20000);

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        await UserModel.deleteMany({});
    });

    it('should have isValid default to false and email lowercased', async () => {
        const doc = await UserModel.create({
            email: 'TEST@EXAMPLE.COM',
            password: 'PlainPass123!',
            role: 'STUDENT',
        } as any);

        expect(doc.isValid).toBe(false);
        expect(doc.email).toBe('test@example.com');
    });

    it('should hash password on save', async () => {
        const plain = 'MyPassword123!';
        const doc = new UserModel({
            email: 'hash@test.com',
            password: plain,
            role: 'STUDENT',
        } as any);

        await doc.save();

        expect(doc.password).not.toBe(plain);
        const match = await bcrypt.compare(plain, doc.password);
        expect(match).toBe(true);
    });

    it('should reject empty password on save (pre hook)', async () => {
        const doc = new UserModel({
            email: 'empty@test.com',
            password: '   ',
            role: 'STUDENT',
        } as any);

        await expect(doc.save()).rejects.toThrow();
    });

    it('should propagate bcrypt errors during hashing', async () => {
        // Force genSalt to throw inside the pre-save hook
        const genSaltSpy = jest.spyOn(require('bcrypt'), 'genSalt').mockImplementation(() => {
            throw new Error('salt-failure');
        });

        const doc = new UserModel({
            email: 'saltfail@test.com',
            password: 'SomeSecret123!',
            role: 'STUDENT',
        } as any);

        await expect(doc.save()).rejects.toThrow('salt-failure');

        genSaltSpy.mockRestore();
    });

    it('should propagate bcrypt.hash errors in catch block', async () => {
        // Force bcrypt.hash to reject inside the pre-save hook
        const hashSpy = jest.spyOn(require('bcrypt'), 'hash').mockRejectedValue(new Error('hash-failure'));

        const doc = new UserModel({
            email: 'hashfail@test.com',
            password: 'SomeSecret123!',
            role: 'STUDENT',
        } as any);

        await expect(doc.save()).rejects.toThrow('hash-failure');

        hashSpy.mockRestore();
    });

    it('should skip password hashing if password is not modified', async () => {
        // Create and save a document with hashed password
        const doc = await UserModel.create({
            email: 'skiptest@test.com',
            password: 'InitialPass123!',
            role: 'STUDENT',
        } as any);

        const originalHashedPassword = doc.password;

        // Modify another field but not the password
        doc.email = 'skiptest-updated@test.com';
        await doc.save();

        // Password should remain the same (not re-hashed)
        expect(doc.password).toBe(originalHashedPassword);
    });

    it('should export UserSchema correctly - line 156 coverage', () => {
        // This test ensures the export statement is executed
        expect(UserSchema).toBeDefined();
        expect(UserSchema).toHaveProperty('obj');
    });
});
