import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { Model, Types } from 'mongoose';

import { AuthGuard } from '../../../src/auth/auth.guard';
import { RolesGuard } from '../../../src/common/roles/roles.guard';
import { ForumAccessGuard } from '../../../src/forum/guards/forum-access.guard';
import { Topic, TopicDocument } from '../../../src/forum/topic/topic.schema';
import { Message, MessageDocument } from '../../../src/forum/message/message.schema';
import { Student, StudentDocument } from '../../../src/student/student.schema';
import { Company, CompanyDocument } from '../../../src/company/company.schema';
import { CompanyModule } from '../../../src/company/company.module';
import { ForumModule } from '../../../src/forum/forum.module';
describe('Message Integration Tests', () => {
    let app: INestApplication;
    let mongod: MongoMemoryServer;
    let jwtService: JwtService;
    let topicModel: Model<TopicDocument>;
    let messageModel: Model<MessageDocument>;
    let forumId: Types.ObjectId;
    let userId: Types.ObjectId;
    let accessToken: string;
    let studentModel: Model<StudentDocument>;
    let companyModel: Model<CompanyDocument>;
    let objectId: Types.ObjectId;
    const JWT_SECRET = 'test-secret-key';

    beforeAll(async () => {
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({ isGlobal: true }),
                MongooseModule.forRoot(uri),
                JwtModule.register({ secret: JWT_SECRET, signOptions: { expiresIn: '1h' } }),
                ForumModule,
                CompanyModule,
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
            .overrideGuard(RolesGuard)
            .useValue({ canActivate: () => true })
            .overrideGuard(ForumAccessGuard)
            .useValue({ canActivate: () => true })
            .compile();

        app = moduleFixture.createNestApplication({ logger: false });
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
        await app.init();

        jwtService = moduleFixture.get(JwtService);
        topicModel = moduleFixture.get<Model<TopicDocument>>(getModelToken(Topic.name));
        messageModel = moduleFixture.get<Model<MessageDocument>>(getModelToken(Message.name));
        studentModel = moduleFixture.get<Model<StudentDocument>>(getModelToken(Student.name));
        companyModel = moduleFixture.get<Model<CompanyDocument>>(getModelToken(Company.name));
        forumId = new Types.ObjectId();
        userId = new Types.ObjectId();
        objectId = new Types.ObjectId();
        accessToken = jwtService.sign({
            sub: userId.toString(),
            email: 'test@example.com',
            role: 'Student',
        });
    });

    afterEach(async () => {
        await topicModel.deleteMany({}).exec();
        await messageModel.deleteMany({}).exec();
        await studentModel.deleteMany({}).exec();
        await companyModel.deleteMany({}).exec();
    });

    afterAll(async () => {
        await app.close();
        if (mongod) await mongod.stop();
    });

    const createTopic = async (data: Partial<Topic> | Partial<TopicDocument>): Promise<TopicDocument> => {
        return await topicModel.create({
            author: userId,
            forumId: forumId,
            title: 'bonjour',
            ...data,
        });
    };
    const createMessage = async (data: Partial<Message> | Partial<MessageDocument>): Promise<MessageDocument> => {
        return await messageModel.create({
            title: 'Default Title',
            authorId: userId,
            topicId: new Types.ObjectId(),
            content: 'bonjour',
            ...data,
        });
    };
    const createStudent = async (): Promise<StudentDocument> => {
        return await studentModel.create({
            email: 'toto@toto.com',
            lastName: 'toto',
            firstName: 'tata',
            studentNumber: '0213',
            password: 'A12345678z!',
        });
    };
    const createCompany = async (): Promise<CompanyDocument> => {
        return await companyModel.create({ email: 'toto@toto.com', name: 'toto', password: 'A12345678z!' });
    };
    describe('GET /api/forum/:forumId/topic/:topicId/message - Find All Message for one topic', () => {
        it('should return paginate message with the good topic', async () => {
            const topic = await createTopic({ title: 'topic1' });
            const msg1 = await createMessage({ content: 'coucou', topicId: topic._id });
            const msg2 = await createMessage({ content: 'coucou', topicId: topic._id });
            const res = await request(app.getHttpServer())
                .get(`/api/forum/${forumId}/topic/${topic._id}/message?limit=2&page=1`)
                .set('Authorization', 'Bearer ' + accessToken)
                .expect(200);

            expect(res.body.data[0]._id).toEqual(msg1._id.toString());
            expect(res.body.data[1]._id).toEqual(msg2._id.toString());
            expect(res.body.total).toBe(2);
            expect(res.body.page).toBe(1);
            expect(Array.isArray(res.body.data)).toBe(true);
        });
        it('should return paginate message with the oldest message when limit and page equals 1', async () => {
            const topic = await createTopic({ title: 'topic1' });
            const msg1 = await createMessage({ content: 'coucou', topicId: topic._id });
            const msg2 = await createMessage({ content: 'coucou', topicId: topic._id });
            const res = await request(app.getHttpServer())
                .get(`/api/forum/${forumId}/topic/${topic._id}/message?limit=1&page=1`)
                .set('Authorization', 'Bearer ' + accessToken)
                .expect(200);

            expect(res.body.data[0]._id).toEqual(msg1._id.toString());
            expect(res.body.total).toBe(2);
            expect(res.body.page).toBe(1);
            expect(Array.isArray(res.body.data)).toBe(true);
        });
        it('should return empty paginated result when no messages exist', async () => {
            const topic = await createTopic({});
            const res = await request(app.getHttpServer())
                .get(`/api/forum/${forumId}/topic/${topic._id}/message?page=1&limit=1`)
                .set('Authorization', 'Bearer ' + accessToken)
                .expect(200);

            expect(res.body.data).toEqual([]);
            expect(res.body.total).toBe(0);
            expect(res.body.page).toBe(1);
            expect(Array.isArray(res.body.data)).toBe(true);
        });
        it('should return 400 when invalid page number is provided', async () => {
            const topic = await createTopic({});
            await request(app.getHttpServer())
                .get(`/api/forum/${forumId}/topic/${topic._id.toString()}/message?page=-1&limit= 1`)
                .set('Authorization', 'Bearer ' + accessToken)
                .expect(400);
        });

        it('should return 400 when invalid limit is provided', async () => {
            const topic = await createTopic({});
            await request(app.getHttpServer())
                .get(`/api/forum/${forumId}/topic/${topic._id.toString()}/message?limit=-4&page=1`)
                .set('Authorization', 'Bearer ' + accessToken)
                .expect(400);
        });
        it('should use default pagination values when none are provided', async () => {
            const topic = await createTopic({ title: 'Test Topic' });
            const message1 = await createMessage({ topicId: topic._id });
            const message2 = await createMessage({ topicId: topic._id });
            const message3 = await createMessage({ topicId: topic._id });
            const message4 = await createMessage({ topicId: topic._id });
            const message5 = await createMessage({ topicId: topic._id });
            const message6 = await createMessage({ topicId: topic._id });
            const message7 = await createMessage({ topicId: topic._id });
            const message8 = await createMessage({ topicId: topic._id });
            const message9 = await createMessage({ topicId: topic._id });
            const message10 = await createMessage({ topicId: topic._id });
            const message11 = await createMessage({ topicId: topic._id });
            const res = await request(app.getHttpServer())
                .get(`/api/forum/${forumId}/topic/${topic._id.toString()}/message`)
                .set('Authorization', 'Bearer ' + accessToken)
                .expect(200);

            expect(res.body).toHaveProperty('page');
            expect(res.body.page).toEqual(1);
            expect(res.body).toHaveProperty('limit');
            expect(res.body.limit).toEqual(10);
            expect(res.body).toHaveProperty('total');
            expect(res.body.total).toEqual(11);
            expect(res.body).toHaveProperty('totalPages');
            expect(res.body.totalPages).toEqual(2);
            expect(res.body).toHaveProperty('hasNext');
            expect(res.body.hasNext).toEqual(true);
            expect(res.body).toHaveProperty('hasPrev');
            expect(res.body.hasPrev).toEqual(false);
        });
    });

    describe('POST /api/forum/topic/:topicId/message - Find All Message for one topic', () => {
        it('should send message to valid topic', async () => {
            const topic = await createTopic({});
            const user = await createStudent();
            const payload = { content: 'coucou', authorId: user._id };
            const message = await request(app.getHttpServer())
                .post(`/api/forum/topic/${topic._id}/message`)
                .send(payload)
                .set('Authorization', 'Bearer ' + accessToken);
            expect(message.body).not.toBeNull();
        });
        it("should return 404 if topic doesn't exist", async () => {
            const user = await createStudent();
            const payload = { content: 'coucou', authorId: user._id };
            const message = await request(app.getHttpServer())
                .post(`/api/forum/topic/${objectId}/message`)
                .send(payload)
                .set('Authorization', 'Bearer ' + accessToken)
                .expect(404);
        });
    });
});
