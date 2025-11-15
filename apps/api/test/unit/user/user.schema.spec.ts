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
});
