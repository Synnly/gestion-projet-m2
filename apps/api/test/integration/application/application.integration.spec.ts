import { INestApplication, UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Model, Types } from 'mongoose';

import { ApplicationController } from '../../../src/application/application.controller';
import { ApplicationService } from '../../../src/application/application.service';
import {
    Application,
    ApplicationDocument,
    ApplicationSchema,
    ApplicationStatus,
} from '../../../src/application/application.schema';
import { PostModule } from '../../../src/post/post.module';
import { Post, PostDocument, PostType } from '../../../src/post/post.schema';
import { StudentModule } from '../../../src/student/student.module';
import { UsersModule } from '../../../src/user/user.module';
import { AuthGuard } from '../../../src/auth/auth.guard';
import { Role } from '../../../src/common/roles/roles.enum';
import { ApplicationOwnerGuard } from '../../../src/common/roles/applicationOwner.guard';
import { S3Service } from '../../../src/s3/s3.service';
import { Company, CompanyDocument } from '../../../src/company/company.schema';
import { User, UserDocument } from '../../../src/user/user.schema';
import { Student, StudentDocument } from '../../../src/student/student.schema';
import { PaginationService } from 'src/common/pagination/pagination.service';

describe('Application Integration Tests', () => {
    let app: INestApplication;
    let mongod: MongoMemoryServer;
    let jwtService: JwtService;
    let applicationModel: Model<ApplicationDocument>;
    let postModel: Model<PostDocument>;
    let companyModel: Model<CompanyDocument>;
    let studentModel: Model<StudentDocument>;
    let userModel: Model<UserDocument>;

    const ACCESS_TOKEN_SECRET = 'test-access-secret';
    const REFRESH_TOKEN_SECRET = 'test-refresh-secret';
    const ACCESS_TOKEN_LIFESPAN_MINUTES = 60;
    const REFRESH_TOKEN_LIFESPAN_MINUTES = 1440;

    const mockS3Service: Partial<S3Service> = {
        generatePresignedUploadUrl: jest.fn(
            async (fileName: string, fileType: 'logo' | 'cv' | 'lm', userId: string) => ({
                fileName,
                uploadUrl: `https://uploads.test/${userId}/${fileType}/${fileName}`,
            }),
        ),
    };

    const tokenFor = (role: Role, id: Types.ObjectId | string = new Types.ObjectId()) =>
        jwtService.sign({ sub: id.toString(), role }, { secret: ACCESS_TOKEN_SECRET });

    const createCompany = async (attrs: Partial<CompanyDocument> = {}) => {
        const unique = new Types.ObjectId().toString();
        return companyModel.create({
            email: attrs.email || `company-${unique}@test.com`,
            password: attrs.password || 'TestP@ss123',
            role: Role.COMPANY,
            name: (attrs as any).name || 'Test Company',
            isValid: true,
            ...attrs,
        } as any);
    };

    const createStudent = async (attrs: Partial<StudentDocument> = {}) => {
        const unique = new Types.ObjectId().toString();
        return studentModel.create({
            email: (attrs.email as any) || `student-${unique}@test.com`,
            password: attrs.password || 'TestP@ss123',
            studentNumber: (attrs as any).studentNumber || `SN-${unique}`,
            role: Role.STUDENT,
            firstName: (attrs as any).firstName || 'John',
            lastName: (attrs as any).lastName || 'Doe',
            ...attrs,
        } as any);
    };

    const createPostForCompany = async (companyId: Types.ObjectId) => {
        return postModel.create({
            title: 'Internship Position',
            description: 'Post description',
            type: PostType.Presentiel,
            keySkills: ['Skill1'],
            company: companyId,
        });
    };

    const createApplicationDoc = async (
        studentId: Types.ObjectId,
        postId: Types.ObjectId,
        overrides: Partial<Application> = {},
    ) => {
        return applicationModel.create({
            student: studentId,
            post: postId,
            cv: 'resume.pdf',
            coverLetter: 'cover.docx',
            status: ApplicationStatus.Pending,
            ...overrides,
        } as any);
    };

    beforeAll(async () => {
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();

        const moduleRef: TestingModule = await Test.createTestingModule({
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
                MongooseModule.forFeature([{ name: Application.name, schema: ApplicationSchema }]),
                JwtModule.register({ secret: ACCESS_TOKEN_SECRET, signOptions: { expiresIn: '1h' } }),
                UsersModule,
                PostModule,
                StudentModule,
            ],
            controllers: [ApplicationController],
            providers: [
                ApplicationService,
                ApplicationOwnerGuard,
                { provide: S3Service, useValue: mockS3Service },
                PaginationService,
            ],
        })
            .overrideGuard(AuthGuard)
            .useValue({
                canActivate: (context: any) => {
                    const req = context.switchToHttp().getRequest();
                    const auth = req.headers?.authorization;
                    if (!auth) throw new UnauthorizedException();
                    const token = auth.replace('Bearer ', '');
                    req.user = jwtService.verify(token, { secret: ACCESS_TOKEN_SECRET });
                    return true;
                },
            })
            .compile();

        jwtService = moduleRef.get(JwtService);
        applicationModel = moduleRef.get<Model<ApplicationDocument>>(getModelToken(Application.name));
        postModel = moduleRef.get<Model<PostDocument>>(getModelToken(Post.name));
        companyModel = moduleRef.get<Model<CompanyDocument>>(getModelToken(Company.name));
        studentModel = moduleRef.get<Model<StudentDocument>>(getModelToken(Student.name));
        userModel = moduleRef.get<Model<UserDocument>>(getModelToken(User.name));

        app = moduleRef.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
        await app.init();
    });

    afterEach(async () => {
        (mockS3Service.generatePresignedUploadUrl as jest.Mock).mockClear();
        await applicationModel.deleteMany({});
        await postModel.deleteMany({});
        await userModel.deleteMany({});
    });

    afterAll(async () => {
        await app?.close();
        if (mongod) await mongod.stop();
    });

    describe('GET /api/application - Find All Applications', () => {
        it('should return empty array when no applications exist', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/application')
                .set('Authorization', `Bearer ${tokenFor(Role.ADMIN)}`)
                .expect(200);

            expect(res.body).toEqual([]);
        });

        it('should list existing applications with related post and student', async () => {
            const company = await createCompany();
            const student = await createStudent();
            const post = await createPostForCompany(company._id);
            const created = await createApplicationDoc(student._id, post._id, {
                cv: 'resume.pdf',
                coverLetter: 'letter.docx',
            });
            await createApplicationDoc(student._id, post._id, {
                cv: 'ignored.pdf',
                deletedAt: new Date(),
            });

            const res = await request(app.getHttpServer())
                .get('/api/application')
                .set('Authorization', `Bearer ${tokenFor(Role.ADMIN)}`)
                .expect(200);

            expect(res.body).toHaveLength(1);
            const body = res.body[0];
            expect(body._id).toBe(created._id.toString());
            expect(body.status).toBe(ApplicationStatus.Pending);
            expect(body.cv).toBe('resume.pdf');
            expect(body.coverLetter).toBe('letter.docx');
            expect(body.post._id).toBe(post._id.toString());
            expect(body.student._id).toBe(student._id.toString());
        });

        it('should reject non-admin users', async () => {
            const student = await createStudent();
            await request(app.getHttpServer())
                .get('/api/application')
                .set('Authorization', `Bearer ${tokenFor(Role.STUDENT, student._id)}`)
                .expect(403);
        });
    });

    describe('GET /api/application/:applicationId - Find One Application', () => {
        it('should return the application when it exists for admin', async () => {
            const company = await createCompany();
            const student = await createStudent();
            const post = await createPostForCompany(company._id);
            const created = await createApplicationDoc(student._id, post._id);

            const res = await request(app.getHttpServer())
                .get(`/api/application/${created._id}`)
                .set('Authorization', `Bearer ${tokenFor(Role.ADMIN)}`)
                .expect(200);

            expect(res.body._id).toBe(created._id.toString());
            expect(res.body.post._id).toBe(post._id.toString());
            expect(res.body.student._id).toBe(student._id.toString());
        });

        it('should return 404 when application does not exist', async () => {
            const missingId = new Types.ObjectId().toString();

            await request(app.getHttpServer())
                .get(`/api/application/${missingId}`)
                .set('Authorization', `Bearer ${tokenFor(Role.ADMIN)}`)
                .expect(404);
        });

        it('should forbid access when student does not own the application', async () => {
            const company = await createCompany();
            // @ts-ignore
            const studentOwner = await createStudent({ email: 'owner@test.com' });
            const otherStudent = await createStudent({ email: 'other@test.com' });
            const post = await createPostForCompany(company._id);
            const created = await createApplicationDoc(studentOwner._id, post._id);

            await request(app.getHttpServer())
                .get(`/api/application/${created._id}`)
                .set('Authorization', `Bearer ${tokenFor(Role.STUDENT, otherStudent._id)}`)
                .expect(403);
        });

        it('should return 400 when applicationId is not a valid ObjectId', async () => {
            await request(app.getHttpServer())
                .get('/api/application/not-an-objectid')
                .set('Authorization', `Bearer ${tokenFor(Role.ADMIN)}`)
                .expect(400);
        });
    });

    describe('POST /api/application - Create Application', () => {
        it('should generate presigned URLs when valid data is provided', async () => {
            const company = await createCompany();
            const student = await createStudent();
            const post = await createPostForCompany(company._id);

            (mockS3Service.generatePresignedUploadUrl as jest.Mock).mockResolvedValueOnce({
                fileName: 'generated-cv.pdf',
                uploadUrl: 'https://uploads.test/cv/url',
            });
            (mockS3Service.generatePresignedUploadUrl as jest.Mock).mockResolvedValueOnce({
                fileName: 'generated-lm.docx',
                uploadUrl: 'https://uploads.test/lm/url',
            });

            const res = await request(app.getHttpServer())
                .post('/api/application')
                .set('Authorization', `Bearer ${tokenFor(Role.STUDENT, student._id)}`)
                .send({
                    studentId: student._id.toString(),
                    postId: post._id.toString(),
                    cvExtension: 'pdf',
                    lmExtension: 'docx',
                })
                .expect(201);

            expect(res.body.cvUrl).toBe('https://uploads.test/cv/url');
            expect(res.body.lmUrl).toBe('https://uploads.test/lm/url');

            expect(mockS3Service.generatePresignedUploadUrl).toHaveBeenNthCalledWith(
                1,
                `${student._id}.pdf`,
                'cv',
                student._id.toString(),
                post._id.toString(),
            );
            expect(mockS3Service.generatePresignedUploadUrl).toHaveBeenNthCalledWith(
                2,
                `${student._id}.docx`,
                'lm',
                student._id.toString(),
                post._id.toString(),
            );
        });

        it('should handle creation without cover letter extension', async () => {
            const company = await createCompany();
            const student = await createStudent();
            const post = await createPostForCompany(company._id);

            (mockS3Service.generatePresignedUploadUrl as jest.Mock).mockResolvedValue({
                fileName: 'generated-cv.pdf',
                uploadUrl: 'https://uploads.test/cv/only',
            });

            const res = await request(app.getHttpServer())
                .post('/api/application')
                .set('Authorization', `Bearer ${tokenFor(Role.STUDENT, student._id)}`)
                .send({
                    studentId: student._id.toString(),
                    postId: post._id.toString(),
                    cvExtension: 'doc',
                })
                .expect(201);

            expect(res.body.cvUrl).toBe('https://uploads.test/cv/only');
            expect(res.body.lmUrl).toBeUndefined();
            expect(mockS3Service.generatePresignedUploadUrl).toHaveBeenCalledTimes(1);
        });

        it('should return 404 when student does not exist', async () => {
            const company = await createCompany();
            const post = await createPostForCompany(company._id);
            const missingStudentId = new Types.ObjectId().toString();

            await request(app.getHttpServer())
                .post('/api/application')
                .set('Authorization', `Bearer ${tokenFor(Role.ADMIN)}`)
                .send({
                    studentId: missingStudentId,
                    postId: post._id.toString(),
                    cvExtension: 'pdf',
                })
                .expect(404);
        });

        it('should return 404 when post does not exist', async () => {
            const student = await createStudent();
            const missingPostId = new Types.ObjectId().toString();

            await request(app.getHttpServer())
                .post('/api/application')
                .set('Authorization', `Bearer ${tokenFor(Role.ADMIN)}`)
                .send({
                    studentId: student._id.toString(),
                    postId: missingPostId,
                    cvExtension: 'pdf',
                })
                .expect(404);
        });

        it('should return 409 when application already exists for student and post', async () => {
            const company = await createCompany();
            const student = await createStudent();
            const post = await createPostForCompany(company._id);
            await createApplicationDoc(student._id, post._id);

            await request(app.getHttpServer())
                .post('/api/application')
                .set('Authorization', `Bearer ${tokenFor(Role.ADMIN)}`)
                .send({
                    studentId: student._id.toString(),
                    postId: post._id.toString(),
                    cvExtension: 'pdf',
                })
                .expect(409);
        });

        it('should return 400 when identifiers are not valid ObjectIds', async () => {
            await request(app.getHttpServer())
                .post('/api/application')
                .set('Authorization', `Bearer ${tokenFor(Role.ADMIN)}`)
                .send({
                    studentId: 'not-an-id',
                    postId: 'also-not-an-id',
                    cvExtension: 'pdf',
                })
                .expect(400);
        });

        it('should return 400 when cvExtension is invalid', async () => {
            const company = await createCompany();
            const student = await createStudent();
            const post = await createPostForCompany(company._id);

            await request(app.getHttpServer())
                .post('/api/application')
                .set('Authorization', `Bearer ${tokenFor(Role.STUDENT, student._id)}`)
                .send({
                    studentId: student._id.toString(),
                    postId: post._id.toString(),
                    cvExtension: 'png',
                })
                .expect(400);
        });

        it('should return 400 when extra properties are provided', async () => {
            const company = await createCompany();
            const student = await createStudent();
            const post = await createPostForCompany(company._id);

            await request(app.getHttpServer())
                .post('/api/application')
                .set('Authorization', `Bearer ${tokenFor(Role.STUDENT, student._id)}`)
                .send({
                    studentId: student._id.toString(),
                    postId: post._id.toString(),
                    cvExtension: 'pdf',
                    unexpected: 'value',
                })
                .expect(400);
        });

        it('should return 401 when no authorization header is provided', async () => {
            const company = await createCompany();
            const student = await createStudent();
            const post = await createPostForCompany(company._id);

            await request(app.getHttpServer())
                .post('/api/application')
                .send({
                    studentId: student._id.toString(),
                    postId: post._id.toString(),
                    cvExtension: 'pdf',
                })
                .expect(401);
        });

        it('should return 403 when role is not allowed to create applications', async () => {
            const company = await createCompany();
            const student = await createStudent();
            const post = await createPostForCompany(company._id);

            await request(app.getHttpServer())
                .post('/api/application')
                .set('Authorization', `Bearer ${tokenFor(Role.COMPANY, company._id)}`)
                .send({
                    studentId: student._id.toString(),
                    postId: post._id.toString(),
                    cvExtension: 'pdf',
                })
                .expect(403);
        });
    });

    describe('PUT /api/application/:applicationId - Update Status', () => {
        it('should update status when called by admin', async () => {
            const company = await createCompany();
            const student = await createStudent();
            const post = await createPostForCompany(company._id);
            const created = await createApplicationDoc(student._id, post._id);

            await request(app.getHttpServer())
                .put(`/api/application/${created._id}`)
                .set('Authorization', `Bearer ${tokenFor(Role.ADMIN)}`)
                .send({ status: ApplicationStatus.Accepted })
                .expect(200);

            const updated = await applicationModel.findById(created._id).lean();
            expect(updated?.status).toBe(ApplicationStatus.Accepted);
        });

        it('should return 404 when updating a missing application', async () => {
            const missingId = new Types.ObjectId().toString();

            await request(app.getHttpServer())
                .put(`/api/application/${missingId}`)
                .set('Authorization', `Bearer ${tokenFor(Role.ADMIN)}`)
                .send({ status: ApplicationStatus.Rejected })
                .expect(404);
        });

        it('should return 400 when status is invalid', async () => {
            const company = await createCompany();
            const student = await createStudent();
            const post = await createPostForCompany(company._id);
            const created = await createApplicationDoc(student._id, post._id);

            await request(app.getHttpServer())
                .put(`/api/application/${created._id}`)
                .set('Authorization', `Bearer ${tokenFor(Role.ADMIN)}`)
                .send({ status: 'INVALID_STATUS' })
                .expect(400);
        });

        it('should return 403 for student roles', async () => {
            const company = await createCompany();
            const student = await createStudent();
            const post = await createPostForCompany(company._id);
            const created = await createApplicationDoc(student._id, post._id);

            await request(app.getHttpServer())
                .put(`/api/application/${created._id}`)
                .set('Authorization', `Bearer ${tokenFor(Role.STUDENT, student._id)}`)
                .send({ status: ApplicationStatus.Read })
                .expect(403);
        });

        it('should return 400 when applicationId param is invalid', async () => {
            await request(app.getHttpServer())
                .put('/api/application/not-an-id')
                .set('Authorization', `Bearer ${tokenFor(Role.ADMIN)}`)
                .send({ status: ApplicationStatus.Accepted })
                .expect(400);
        });
    });

    describe('GET /check', () => {
        it('should return 403 if request come from companies', async () => {
            const company = await createCompany();

            await request(app.getHttpServer())
                .get('/api/application/check?studentId=507f1f77bcf86cd799439098&postId=507f1f77bcf86cd799439099')
                .set('Authorization', `Bearer ${tokenFor(Role.COMPANY, company._id)}`)
                .expect(403);
        });

        it('should return 401 if user is not authentified', async () => {
            await request(app.getHttpServer())
                .get('/api/application/check?studentId=507f1f77bcf86cd799439098&postId=507f1f77bcf86cd799439099')
                .expect(401);
        });

        it('should validate request parameters', async () => {
            const student = await createStudent();
            await request(app.getHttpServer())
                .get('/api/application/check?studentId=invalid&postId=alsoinvalid')
                .set('Authorization', `Bearer ${tokenFor(Role.STUDENT, student._id)}`)
                .expect(400);
        });

        it('should return 200 even if non-existent postings', async () => {
            const student = await createStudent();
            await request(app.getHttpServer())
                .get('/api/application/check?studentId=507f1f77bcf86cd799439098&postId=507f1f77bcf86cd799439099')
                .set('Authorization', `Bearer ${tokenFor(Role.STUDENT, student._id)}`)
                .expect(200);
        });
    });
});
