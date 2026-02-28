import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ConfigModule } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import cookieParser from 'cookie-parser';
import { UnauthorizedException } from '@nestjs/common';

import { StatsModule } from '../../../src/stats/stats.module';
import { AuthModule } from '../../../src/auth/auth.module';
import { AuthGuard } from '../../../src/auth/auth.guard';
import { UsersModule } from '../../../src/user/user.module';
import { CompanyModule } from '../../../src/company/company.module';
import { StudentModule } from '../../../src/student/student.module';
import { ApplicationModule } from '../../../src/application/application.module';
import { PostModule } from '../../../src/post/post.module';

import { User, UserDocument } from '../../../src/user/user.schema';
import { Company, CompanyDocument } from '../../../src/company/company.schema';
import { Student, StudentDocument } from '../../../src/student/student.schema';
import { Application, ApplicationDocument } from '../../../src/application/application.schema';
import { Post, PostDocument, PostType } from '../../../src/post/post.schema';
import { Role } from '../../../src/common/roles/roles.enum';
import { MailerService } from '../../../src/mailer/mailer.service';

describe('Stats Integration Tests', () => {
    let app: INestApplication;
    let mongod: MongoMemoryServer;

    let userModel: Model<UserDocument>;
    let companyModel: Model<CompanyDocument>;
    let studentModel: Model<StudentDocument>;
    let postModel: Model<PostDocument>;
    let applicationModel: Model<ApplicationDocument>;

    const ACCESS_TOKEN_SECRET = 'test-access-secret';
    const REFRESH_TOKEN_SECRET = 'test-refresh-secret';
    const ACCESS_TOKEN_LIFESPAN_MINUTES = 5;
    const REFRESH_TOKEN_LIFESPAN_MINUTES = 60;

    const mockMailerService = {
        sendVerificationEmail: jest.fn().mockResolvedValue(true),
    };

    beforeAll(async () => {
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();

        let jwtService: any;

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    isGlobal: true,
                    load: [
                        () => ({
                            ACCESS_TOKEN_SECRET,
                            REFRESH_TOKEN_SECRET,
                            ACCESS_TOKEN_LIFESPAN_MINUTES,
                            REFRESH_TOKEN_LIFESPAN_MINUTES,
                        }),
                    ],
                }),
                MongooseModule.forRoot(uri),
                UsersModule,
                AuthModule,
                CompanyModule,
                StudentModule,
                PostModule,
                ApplicationModule,
                StatsModule,
            ],
        })
            .overrideGuard(AuthGuard)
            .useValue({
                canActivate: (context: any) => {
                    const req = context.switchToHttp().getRequest();
                    const auth = req.headers?.authorization;
                    if (!auth) throw new UnauthorizedException();
                    const token = auth.replace('Bearer ', '');
                    try {
                        const payload = jwtService.verify(token, { secret: ACCESS_TOKEN_SECRET });
                        req.user = payload;
                        return true;
                    } catch {
                        throw new UnauthorizedException();
                    }
                },
            })
            .overrideProvider(MailerService)
            .useValue(mockMailerService)
            .compile();

        app = moduleFixture.createNestApplication();
        app.use(cookieParser());
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
        await app.init();

        jwtService = moduleFixture.get<any>(require('@nestjs/jwt').JwtService);

        userModel = moduleFixture.get<Model<UserDocument>>(getModelToken(User.name));
        companyModel = moduleFixture.get<Model<CompanyDocument>>(getModelToken(Company.name));
        studentModel = moduleFixture.get<Model<StudentDocument>>(getModelToken(Student.name));
        postModel = moduleFixture.get<Model<PostDocument>>(getModelToken(Post.name));
        applicationModel = moduleFixture.get<Model<ApplicationDocument>>(getModelToken(Application.name));
    });

    afterEach(async () => {
        await userModel.deleteMany({});
        await postModel.deleteMany({});
        await applicationModel.deleteMany({});
    });

    afterAll(async () => {
        await app.close();
        if (mongod) await mongod.stop();
    });

    const loginAsAdmin = async () => {
        const password = 'AdminPassword1!';
        const admin = await userModel.create({
            email: 'admin@test.com',
            password: password,
            role: Role.ADMIN,
            isVerified: true,
            isValid: true,
        });

        const res = await request(app.getHttpServer())
            .post('/api/auth/login')
            .send({ email: 'admin@test.com', password });

        return res.text; // Access token
    };

    describe('GET /api/stats', () => {
        it('should return 401 if not authenticated', async () => {
            await request(app.getHttpServer()).get('/api/stats').expect(401);
        });

        it('should return 403 if not admin', async () => {
            const password = 'StudentPassword1!';
            await studentModel.create({
                email: 'student@test.com',
                password: password,
                role: Role.STUDENT,
                firstName: 'John',
                lastName: 'Doe',
                studentNumber: '12345',
                isVerified: true,
                isValid: true,
            });

            const loginRes = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email: 'student@test.com', password });

            const token = loginRes.text;

            await request(app.getHttpServer()).get('/api/stats').set('Authorization', `Bearer ${token}`).expect(403);
        });

        it('should return stats for admin', async () => {
            const token = await loginAsAdmin();

            // Seed some data
            const company = await companyModel.create({
                email: 'company@test.com',
                password: 'Password1!',
                name: 'Test Company',
                role: Role.COMPANY,
                isVerified: true,
                isValid: true,
            });

            const student = await studentModel.create({
                email: 'student2@test.com',
                password: 'Password1!',
                role: Role.STUDENT,
                firstName: 'Jane',
                lastName: 'Doe',
                studentNumber: '67890',
                isVerified: true,
                isValid: true,
            });

            const post = await postModel.create({
                title: 'Internship',
                description: 'Description',
                company: company._id,
                type: PostType.Teletravail,
                isVisible: true,
            });

            await applicationModel.create({
                post: post._id,
                student: student._id,
                status: 'Accepted',
                cv: 'cv.pdf',
            });

            const res = await request(app.getHttpServer())
                .get('/api/stats')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(res.body.totalUsers).toBe(3); // admin + company + student
            expect(res.body.totalCompanies).toBe(1);
            expect(res.body.totalStudents).toBe(1);
            expect(res.body.totalApplications).toBe(1);
            expect(res.body).toHaveProperty('applicationAcceptanceByCompany');
            expect(res.body).toHaveProperty('applicationAcceptanceByStudent');
            expect(res.body.applicationAcceptanceByCompany[company._id.toString()]).toEqual({ count: 1, rate: 100 });
            expect(res.body.applicationAcceptanceByStudent[student._id.toString()]).toEqual({
                count: 1,
                rate: 100,
                total: 1,
            });
        });
    });

    describe('GET /api/stats/public', () => {
        it('should return public stats without authentication', async () => {
            const company = await companyModel.create({
                email: 'pub-company@test.com',
                password: 'Password1!',
                name: 'Pub Company',
                role: Role.COMPANY,
                isVerified: true,
                isValid: true,
            });

            await postModel.create({
                title: 'Pub Post',
                description: 'Description',
                company: company._id,
                type: PostType.Teletravail,
                isVisible: true,
            });

            const res = await request(app.getHttpServer()).get('/api/stats/public').expect(200);

            expect(res.body).toHaveProperty('totalPosts');
            expect(res.body).toHaveProperty('totalCompanies');
            expect(res.body).toHaveProperty('totalStudents');
            expect(res.body.totalPosts).toBe('1');
        });
    });

    describe('GET /api/stats/public/posts', () => {
        it('should return latest public posts without authentication', async () => {
            const company = await companyModel.create({
                email: 'posts-company@test.com',
                password: 'Password1!',
                name: 'Posts Company',
                role: Role.COMPANY,
                isVerified: true,
                isValid: true,
            });

            await postModel.create({
                title: 'Latest Post',
                description: 'Description',
                company: company._id,
                type: PostType.Teletravail,
                isVisible: true,
            });

            const res = await request(app.getHttpServer()).get('/api/stats/public/posts').expect(200);

            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(1);
            expect(res.body[0].title).toBe('Latest Post');
            expect(res.body[0].company.name).toBe('Posts Company');
        });

        it('should respect the limit query parameter', async () => {
            const company = await companyModel.create({
                email: 'limit-company@test.com',
                password: 'Password1!',
                name: 'Limit Company',
                role: Role.COMPANY,
                isVerified: true,
                isValid: true,
            });

            for (let i = 0; i < 5; i++) {
                await postModel.create({
                    title: `Post ${i}`,
                    description: 'Description',
                    company: company._id,
                    type: PostType.Teletravail,
                    isVisible: true,
                });
            }

            const res = await request(app.getHttpServer()).get('/api/stats/public/posts?limit=2').expect(200);

            expect(res.body.length).toBe(2);
        });
    });
});
