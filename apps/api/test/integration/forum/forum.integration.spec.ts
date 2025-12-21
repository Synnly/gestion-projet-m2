import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { Model, Types } from 'mongoose';

import { ForumModule } from '../../../src/forum/forum.module';
import { AuthGuard } from '../../../src/auth/auth.guard';
import { Forum, ForumDocument } from '../../../src/forum/forum.schema';
import { CompanyModule } from '../../../src/company/company.module';
describe('Forum Integration Tests', () => {
    let app: INestApplication;
    let mongod: MongoMemoryServer;
    let jwtService: JwtService;
    let forumModel: Model<ForumDocument>;
    let companyId: Types.ObjectId;
    let accessToken: string;

    const JWT_SECRET = 'test-secret-key';

    beforeAll(async () => {
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({ isGlobal: true }),
                MongooseModule.forRoot(uri),
                JwtModule.register({ secret: JWT_SECRET, signOptions: { expiresIn: '1h' } }),
                CompanyModule,
                ForumModule,
            ],
        })
            .overrideProvider('ConfigService')
            .useValue({ get: (key: string) => (key === 'JWT_SECRET' ? JWT_SECRET : undefined) })
            .overrideGuard(AuthGuard)
            .useValue({
                canActivate: (context: any) => {
                    const req = context.switchToHttp().getRequest();
                    const auth = req.headers?.authorization;
                    if (!auth) return false;
                    const token = auth.replace('Bearer ', '');
                    try {
                        const payload = jwtService.verify(token, { secret: JWT_SECRET });
                        req.user = payload;
                        return true;
                    } catch {
                        return false;
                    }
                },
            })
            .compile();

        app = moduleFixture.createNestApplication({ logger: false });
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
        await app.init();

        jwtService = moduleFixture.get(JwtService);
        forumModel = moduleFixture.get<Model<ForumDocument>>(getModelToken(Forum.name));

        companyId = new Types.ObjectId();
        accessToken = jwtService.sign({
            sub: new Types.ObjectId().toString(),
            email: 'test@example.com',
            role: 'Student',
        });
    });

    afterEach(async () => {
        await forumModel.deleteMany({}).exec();
    });

    afterAll(async () => {
        await app.close();
        if (mongod) await mongod.stop();
    });

    const createForum = async (data: any) => {
        return await forumModel.create(data);
    };

    describe('GET /api/forum/all - Find All Forums', () => {
        it('should return empty paginated result when no forums exist and findAll is called', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/forum/all')
                .set('Authorization', 'Bearer ' + accessToken)
                .expect(200);

            expect(res.body.data).toEqual([]);
            expect(res.body.total).toBe(0);
            expect(res.body.page).toBe(1);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        it('should return paginated result structure when forums exist and findAll is called', async () => {
            await createForum({
                company: companyId,
            });

            const res = await request(app.getHttpServer())
                .get('/api/forum/all')
                .set('Authorization', 'Bearer ' + accessToken)
                .expect(200);

            expect(res.body).toHaveProperty('data');
            expect(res.body).toHaveProperty('total');
            expect(res.body).toHaveProperty('page');
            expect(res.body).toHaveProperty('limit');
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        it('should handle pagination parameters when provided', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/forum/all?page=1&limit=10')
                .set('Authorization', 'Bearer ' + accessToken)
                .expect(200);

            expect(res.body.page).toBe(1);
            expect(res.body.limit).toBe(10);
            expect(res.body).toHaveProperty('total');
            expect(res.body).toHaveProperty('totalPages');
            expect(res.body).toHaveProperty('hasNext');
            expect(res.body).toHaveProperty('hasPrev');
        });

        it('should use default pagination values when none are provided', async () => {
            await createForum({
                company: companyId,
            });

            const res = await request(app.getHttpServer())
                .get('/api/forum/all')
                .set('Authorization', 'Bearer ' + accessToken)
                .expect(200);

            expect(res.body).toHaveProperty('page');
            expect(res.body).toHaveProperty('limit');
            expect(res.body).toHaveProperty('total');
            expect(res.body).toHaveProperty('totalPages');
            expect(res.body).toHaveProperty('hasNext');
            expect(res.body).toHaveProperty('hasPrev');
        });

        it('should return 400 when invalid page number is provided', async () => {
            await request(app.getHttpServer())
                .get('/api/forum/all?page=-1')
                .set('Authorization', 'Bearer ' + accessToken)
                .expect(400);
        });

        it('should return 400 when invalid limit is provided', async () => {
            await request(app.getHttpServer())
                .get('/api/forum/all?limit=0')
                .set('Authorization', 'Bearer ' + accessToken)
                .expect(400);
        });

        it('should filter out extraneous query parameters when they are provided', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/forum/all?page=1&limit=10&extraParam=value')
                .set('Authorization', 'Bearer ' + accessToken)
                .expect(400);

            expect(res.body.message).toBeDefined();
        });
    });
});
