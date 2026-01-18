import { INestApplication, UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ConfigModule } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import cookieParser from 'cookie-parser';

import { PostModule } from '../../../src/post/post.module';
import { AuthGuard } from '../../../src/auth/auth.guard';
import { Post, PostDocument, PostType } from '../../../src/post/post.schema';
import { AuthModule } from '../../../src/auth/auth.module';
import { CompanyModule } from '../../../src/company/company.module';
import { CompanyUserDocument, User } from '../../../src/user/user.schema';
import { Role } from '../../../src/common/roles/roles.enum';
import { Application, ApplicationDocument, ApplicationStatus } from '../../../src/application/application.schema';
import { ApplicationModule } from '../../../src/application/application.module';
import { Student, StudentDocument } from '../../../src/student/student.schema';
import { StudentModule } from '../../../src/student/student.module';

describe('Post Integration Tests', () => {
    let app: INestApplication;
    let mongod: MongoMemoryServer;
    let postModel: Model<PostDocument>;
    let userModel: Model<CompanyUserDocument>;
    let studentModel: Model<StudentDocument>;
    let applicationModel: Model<ApplicationDocument>;
    let accessToken: string;
    let studentAccessToken: string;
    let companyId: Types.ObjectId;
    let studentId: Types.ObjectId;

    const ACCESS_TOKEN_SECRET = 'test-access-secret';
    const REFRESH_TOKEN_SECRET = 'test-refresh-secret';
    const ACCESS_TOKEN_LIFESPAN_MINUTES = 60;
    const REFRESH_TOKEN_LIFESPAN_MINUTES = 1440;

    beforeAll(async () => {
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();

        const moduleBuilder = Test.createTestingModule({
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
                CompanyModule,
                AuthModule,
                PostModule,
                ApplicationModule,
                StudentModule,
            ],
        });

        // Override the actual AuthGuard used in controllers so integration tests
        // focus on controller/service behavior (don't change production code).
        let jwtService: any;

        const moduleFixture: TestingModule = await moduleBuilder
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
            .compile();

        app = moduleFixture.createNestApplication();
        app.use(cookieParser());
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
        await app.init();

        jwtService = moduleFixture.get<any>(require('@nestjs/jwt').JwtService);

        postModel = moduleFixture.get<Model<PostDocument>>(getModelToken(Post.name));
        userModel = moduleFixture.get<Model<CompanyUserDocument>>(getModelToken(User.name));
        studentModel = moduleFixture.get<Model<StudentDocument>>(getModelToken(Student.name));
        applicationModel = moduleFixture.get<Model<ApplicationDocument>>(getModelToken(Application.name));

        // Create a company and login to get access token
        const createdUser = await userModel.create({
            email: 'company@test.com',
            password: 'TestP@ss123',
            name: 'Test Company',
            role: Role.COMPANY,
            isValid: true,
        });

        companyId = createdUser._id;

        const loginRes = await request(app.getHttpServer())
            .post('/api/auth/login')
            .send({ email: 'company@test.com', password: 'TestP@ss123' });

        if (loginRes.status !== 201) {
            throw new Error('Failed to login for tests');
        }

        accessToken = loginRes.text;

        // Create a student with all required fields
        const createdStudent = await studentModel.create({
            email: 'student@test.com',
            password: 'TestP@ss123',
            name: 'Test Student',
            role: Role.STUDENT,
            isValid: true,
            studentNumber: 'STU12345',
            firstName: 'John',
            lastName: 'Doe',
        });

        studentId = createdStudent._id;

        const studentLoginRes = await request(app.getHttpServer())
            .post('/api/auth/login')
            .send({ email: 'student@test.com', password: 'TestP@ss123' });

        if (studentLoginRes.status !== 201) {
            throw new Error('Failed to login student for tests');
        }

        studentAccessToken = studentLoginRes.text;
    });

    afterEach(async () => {
        await postModel.deleteMany({}).exec();
        await applicationModel.deleteMany({}).exec();
    });

    afterAll(async () => {
        await userModel.deleteMany({}).exec();
        await studentModel.deleteMany({}).exec();
        await app.close();
        if (mongod) await mongod.stop();
    });

    const createPost = async (data: any) => {
        return await postModel.create({
            company: companyId,
            ...data,
        });
    };

    const buildPostsPath = (suffix = '', targetCompanyId?: Types.ObjectId | string) => {
        const resolvedId = targetCompanyId ?? companyId;
        if (!resolvedId) throw new Error('Company id not initialized');
        return `/api/company/${resolvedId.toString()}/posts${suffix}`;
    };

    const normalizeBody = (obj: any) => {
        if (!obj) return obj;
        if (Array.isArray(obj)) return obj.map((o) => (o && o._doc ? o._doc : o));
        return obj._doc ? obj._doc : obj;
    };

    describe('GET /api/company/:companyId/posts - Find All Posts', () => {
        it('should return empty paginated result when no posts exist and findAll is called', async () => {
            const res = await request(app.getHttpServer())
                .get(buildPostsPath())
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(res.body.data).toEqual([]);
            expect(res.body.total).toBe(0);
            expect(res.body.page).toBe(1);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        it('should return all posts when posts exist and findAll is called', async () => {
            await createPost({
                title: 'Développeur Full Stack',
                description: 'Recherche développeur expérimenté',
                duration: '6 mois',
                startDate: '2025-01-15',
                minSalary: 2000,
                maxSalary: 3000,
                sector: 'IT',
                keySkills: ['JavaScript', 'TypeScript'],
                adress: 'Paris, France',
                type: PostType.Hybride,
                isVisible: true,
            });

            const res = await request(app.getHttpServer())
                .get(buildPostsPath())
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(res.body.data).toHaveLength(1);
            expect(res.body.total).toBe(1);
            const normalized = normalizeBody(res.body.data);
            expect(normalized[0].title).toBe('Développeur Full Stack');
            expect(normalized[0].description).toBe('Recherche développeur expérimenté');
            expect(normalized[0]).toHaveProperty('_id');
        });

        it('should return multiple posts when multiple posts exist and findAll is called', async () => {
            await createPost({
                title: 'Développeur Frontend',
                description: 'Spécialiste React',
                keySkills: ['React'],
                type: PostType.Presentiel,
            });

            await createPost({
                title: 'Développeur Backend',
                description: 'Expert Node.js',
                keySkills: ['Node.js'],
                type: PostType.Teletravail,
            });

            const res = await request(app.getHttpServer())
                .get(buildPostsPath())
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(res.body.data).toHaveLength(2);
            expect(res.body.total).toBe(2);
            const normalized = normalizeBody(res.body.data);
            // Do not rely on ordering: ensure both posts are present
            const titles = normalized.map((p: any) => p.title);
            expect(titles).toContain('Développeur Frontend');
            expect(titles).toContain('Développeur Backend');
        });

        it('should return posts with all fields when posts have complete data and findAll is called', async () => {
            await createPost({
                title: 'Développeur Full Stack',
                description: 'Recherche développeur expérimenté',
                duration: '6 mois',
                startDate: '2025-01-15',
                minSalary: 2000,
                maxSalary: 3000,
                sector: 'IT',
                keySkills: ['JavaScript', 'TypeScript', 'React'],
                adress: 'Paris, France',
                type: PostType.Hybride,
                isVisible: true,
            });

            const res = await request(app.getHttpServer())
                .get(buildPostsPath())
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(res.body.data).toHaveLength(1);
            const normalized = normalizeBody(res.body.data);
            expect(normalized[0]).toHaveProperty('title', 'Développeur Full Stack');
            expect(normalized[0]).toHaveProperty('description');
            expect(normalized[0]).toHaveProperty('duration', '6 mois');
            expect(normalized[0]).toHaveProperty('startDate', '2025-01-15');
            expect(normalized[0]).toHaveProperty('minSalary', 2000);
            expect(normalized[0]).toHaveProperty('maxSalary', 3000);
            expect(normalized[0]).toHaveProperty('sector', 'IT');
            expect(normalized[0]).toHaveProperty('keySkills');
            expect(normalized[0].keySkills).toEqual(['JavaScript', 'TypeScript', 'React']);
            expect(normalized[0]).toHaveProperty('adress', 'Paris, France');
            expect(normalized[0]).toHaveProperty('type', PostType.Hybride);
            expect(normalized[0]).toHaveProperty('isVisible', true);
        });
    });

    describe('GET /api/company/:companyId/posts/:id - Find One Post', () => {
        it('should return a post when valid id is provided and findOne is called', async () => {
            const post = await createPost({
                title: 'Développeur Full Stack',
                description: 'Recherche développeur expérimenté',
                keySkills: ['JavaScript'],
                type: PostType.Hybride,
            });

            const res = await request(app.getHttpServer())
                .get(buildPostsPath(`/${post._id}`))
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            const normalized = normalizeBody(res.body);
            expect(normalized.title).toBe('Développeur Full Stack');
            expect(normalized._id).toBe(post._id.toString());
        });

        it('should return 404 when post does not exist and findOne is called', async () => {
            const nonExistentId = new Types.ObjectId().toString();

            const res = await request(app.getHttpServer())
                .get(buildPostsPath(`/${nonExistentId}`))
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(404);

            expect(res.body.message).toContain(`Post with id ${nonExistentId} not found`);
        });

        it('should return 400 when invalid ObjectId is provided and findOne is called', async () => {
            await request(app.getHttpServer())
                .get(buildPostsPath('/invalid-id'))
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(400);
        });

        it('should return post with all fields when post has complete data and findOne is called', async () => {
            const post = await createPost({
                title: 'Développeur Full Stack',
                description: 'Recherche développeur expérimenté',
                duration: '6 mois',
                startDate: '2025-01-15',
                minSalary: 2000,
                maxSalary: 3000,
                sector: 'IT',
                keySkills: ['JavaScript', 'TypeScript'],
                adress: 'Paris, France',
                type: PostType.Hybride,
                isVisible: true,
            });

            const res = await request(app.getHttpServer())
                .get(buildPostsPath(`/${post._id}`))
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            const normalized = normalizeBody(res.body);
            expect(normalized.title).toBe('Développeur Full Stack');
            expect(normalized.description).toBe('Recherche développeur expérimenté');
            expect(normalized.duration).toBe('6 mois');
            expect(normalized.startDate).toBe('2025-01-15');
            expect(normalized.minSalary).toBe(2000);
            expect(normalized.maxSalary).toBe(3000);
            expect(normalized.sector).toBe('IT');
            expect(normalized.keySkills).toEqual(['JavaScript', 'TypeScript']);
            expect(normalized.adress).toBe('Paris, France');
            expect(normalized.type).toBe(PostType.Hybride);
            expect(normalized.isVisible).toBe(true);
        });
    });

    describe('POST /api/company/:companyId/posts - Create Post', () => {
        it('should create a post when valid data is provided and create is called', async () => {
            const postData = {
                title: 'Nouveau Poste',
                description: 'Description du nouveau poste',
                duration: '6 mois',
                startDate: '2025-02-01',
                minSalary: 1500,
                maxSalary: 2500,
                sector: 'IT',
                keySkills: ['Python', 'Django'],
                adress: 'Lyon, France',
                type: PostType.Presentiel,
                isCoverLetterRequired: true,
            };

            await request(app.getHttpServer())
                .post(buildPostsPath())
                .set('Authorization', `Bearer ${accessToken}`)
                .send(postData)
                .expect(201);

            const posts = await postModel.find().exec();
            expect(posts).toHaveLength(1);
            expect(posts[0].title).toBe('Nouveau Poste');
            expect(posts[0].description).toBe('Description du nouveau poste');
        });

        it('should create a post with minimal required fields when create is called', async () => {
            const minimalData = {
                title: 'Titre Minimal',
                description: 'Description Minimale',
                keySkills: ['Skill1'],
                isCoverLetterRequired: false,
            };

            await request(app.getHttpServer())
                .post(buildPostsPath())
                .set('Authorization', `Bearer ${accessToken}`)
                .send(minimalData)
                .expect(201);

            const posts = await postModel.find().exec();
            expect(posts).toHaveLength(1);
            expect(posts[0].title).toBe('Titre Minimal');
        });

        it('should return 400 when title is missing and create is called', async () => {
            const invalidData = {
                description: 'Description',
                keySkills: ['Skill1'],
            };

            const res = await request(app.getHttpServer())
                .post(buildPostsPath())
                .set('Authorization', `Bearer ${accessToken}`)
                .send(invalidData)
                .expect(400);

            expect(res.body.message).toBeDefined();
        });

        it('should return 400 when description is missing and create is called', async () => {
            const invalidData = {
                title: 'Titre',
                keySkills: ['Skill1'],
            };

            const res = await request(app.getHttpServer())
                .post(buildPostsPath())
                .set('Authorization', `Bearer ${accessToken}`)
                .send(invalidData)
                .expect(400);

            expect(res.body.message).toBeDefined();
        });

        it('should return 400 when title is not a string and create is called', async () => {
            const invalidData = {
                title: 123,
                description: 'Description',
                keySkills: ['Skill1'],
            };

            await request(app.getHttpServer())
                .post(buildPostsPath())
                .set('Authorization', `Bearer ${accessToken}`)
                .send(invalidData)
                .expect(400);
        });

        it('should return 400 when description is not a string and create is called', async () => {
            const invalidData = {
                title: 'Titre',
                description: 123,
                keySkills: ['Skill1'],
            };

            await request(app.getHttpServer())
                .post(buildPostsPath())
                .set('Authorization', `Bearer ${accessToken}`)
                .send(invalidData)
                .expect(400);
        });

        it('should return 400 when minSalary is negative and create is called', async () => {
            const invalidData = {
                title: 'Titre',
                description: 'Description',
                minSalary: -1,
                keySkills: ['Skill1'],
            };

            await request(app.getHttpServer())
                .post(buildPostsPath())
                .set('Authorization', `Bearer ${accessToken}`)
                .send(invalidData)
                .expect(400);
        });

        it('should return 400 when maxSalary is negative and create is called', async () => {
            const invalidData = {
                title: 'Titre',
                description: 'Description',
                maxSalary: -1,
                keySkills: ['Skill1'],
            };

            await request(app.getHttpServer())
                .post(buildPostsPath())
                .set('Authorization', `Bearer ${accessToken}`)
                .send(invalidData)
                .expect(400);
        });

        it('should return 400 when keySkills has more than 5 items and create is called', async () => {
            const invalidData = {
                title: 'Titre',
                description: 'Description',
                keySkills: ['Skill1', 'Skill2', 'Skill3', 'Skill4', 'Skill5', 'Skill6'],
            };

            await request(app.getHttpServer())
                .post(buildPostsPath())
                .set('Authorization', `Bearer ${accessToken}`)
                .send(invalidData)
                .expect(400);
        });

        it('should return 400 when keySkills contains duplicate values and create is called', async () => {
            const invalidData = {
                title: 'Titre',
                description: 'Description',
                keySkills: ['Skill1', 'Skill1'],
            };

            await request(app.getHttpServer())
                .post(buildPostsPath())
                .set('Authorization', `Bearer ${accessToken}`)
                .send(invalidData)
                .expect(400);
        });

        it('should return 400 when keySkills is not an array and create is called', async () => {
            const invalidData = {
                title: 'Titre',
                description: 'Description',
                keySkills: 'not-an-array',
            };

            await request(app.getHttpServer())
                .post(buildPostsPath())
                .set('Authorization', `Bearer ${accessToken}`)
                .send(invalidData)
                .expect(400);
        });

        it('should return 400 when type is not a valid PostType and create is called', async () => {
            const invalidData = {
                title: 'Titre',
                description: 'Description',
                keySkills: ['Skill1'],
                type: 'InvalidType',
            };

            await request(app.getHttpServer())
                .post(buildPostsPath())
                .set('Authorization', `Bearer ${accessToken}`)
                .send(invalidData)
                .expect(400);
        });

        it('should return 400 when startDate is not a valid date string and create is called', async () => {
            const invalidData = {
                title: 'Titre',
                description: 'Description',
                keySkills: ['Skill1'],
                startDate: 'invalid-date',
            };

            await request(app.getHttpServer())
                .post(buildPostsPath())
                .set('Authorization', `Bearer ${accessToken}`)
                .send(invalidData)
                .expect(400);
        });

        it('should return 400 when extra non-whitelisted properties are sent and create is called', async () => {
            const invalidData = {
                title: 'Titre',
                description: 'Description',
                keySkills: ['Skill1'],
                extraField: 'should-be-rejected',
            };

            await request(app.getHttpServer())
                .post(buildPostsPath())
                .set('Authorization', `Bearer ${accessToken}`)
                .send(invalidData)
                .expect(400);
        });

        it('should return 401 when no authorization token is provided and create is called', async () => {
            const postData = {
                title: 'Titre',
                description: 'Description',
                keySkills: ['Skill1'],
            };

            await request(app.getHttpServer()).post(buildPostsPath()).send(postData).expect(401);
        });

        it('should create post with type Presentiel when valid data is provided and create is called', async () => {
            const postData = {
                title: 'Poste Présentiel',
                description: 'Description',
                keySkills: ['Skill1'],
                adress: 'toto',
                type: PostType.Presentiel,
                isCoverLetterRequired: false,
            };

            await request(app.getHttpServer())
                .post(buildPostsPath())
                .set('Authorization', `Bearer ${accessToken}`)
                .send(postData)
                .expect(201);

            const posts = await postModel.find().exec();
            expect(posts[0].type).toBe(PostType.Presentiel);
        });

        it('should create post with type Teletravail when valid data is provided and create is called', async () => {
            const postData = {
                title: 'Poste Télétravail',
                description: 'Description',
                keySkills: ['Skill1'],
                type: PostType.Teletravail,
                isCoverLetterRequired: false,
            };

            await request(app.getHttpServer())
                .post(buildPostsPath())
                .set('Authorization', `Bearer ${accessToken}`)
                .send(postData)
                .expect(201);

            const posts = await postModel.find().exec();
            expect(posts[0].type).toBe(PostType.Teletravail);
        });

        it('should create post with type Hybride when valid data is provided and create is called', async () => {
            const postData = {
                title: 'Poste Hybride',
                description: 'Description',
                keySkills: ['Skill1'],
                type: PostType.Hybride,
                isCoverLetterRequired: false,
            };

            await request(app.getHttpServer())
                .post(buildPostsPath())
                .set('Authorization', `Bearer ${accessToken}`)
                .send(postData)
                .expect(201);

            const posts = await postModel.find().exec();
            expect(posts[0].type).toBe(PostType.Hybride);
        });

        it('should save post to database with all provided fields when create is called', async () => {
            const postData = {
                title: 'Test Complet',
                description: 'Description complète',
                duration: '12 mois',
                startDate: '2025-03-01',
                minSalary: 3000,
                maxSalary: 4000,
                sector: 'Finance',
                keySkills: ['Java', 'Spring'],
                adress: 'Marseille, France',
                type: PostType.Hybride,
                isCoverLetterRequired: false,
            };

            await request(app.getHttpServer())
                .post(buildPostsPath())
                .set('Authorization', `Bearer ${accessToken}`)
                .send(postData)
                .expect(201);

            const posts = await postModel.find().exec();
            expect(posts).toHaveLength(1);
            expect(posts[0].title).toBe('Test Complet');
            expect(posts[0].duration).toBe('12 mois');
            expect(posts[0].startDate).toBe('2025-03-01');
            expect(posts[0].minSalary).toBe(3000);
            expect(posts[0].maxSalary).toBe(4000);
            expect(posts[0].sector).toBe('Finance');
            expect(posts[0].keySkills).toEqual(['Java', 'Spring']);
            expect(posts[0].adress).toBe('Marseille, France');
            expect(posts[0].type).toBe(PostType.Hybride);
        });
    });

    describe('GET /api/company/:companyId/posts/by-student - Find All Posts With Applications', () => {
        it('should return empty paginated result when student has no applications', async () => {
            await createPost({
                title: 'Développeur Full Stack',
                description: 'Description',
                keySkills: ['JavaScript'],
                type: PostType.Hybride,
            });

            const res = await request(app.getHttpServer())
                .get(buildPostsPath('/by-student'))
                .set('Authorization', `Bearer ${studentAccessToken}`)
                .expect(200);

            expect(res.body.data).toEqual([]);
            expect(res.body.total).toBe(0);
            expect(res.body.page).toBe(1);
        });

        it('should return posts when student has applications', async () => {
            const post1 = await createPost({
                title: 'Développeur Frontend',
                description: 'Description Frontend',
                keySkills: ['React'],
                type: PostType.Presentiel,
            });

            const post2 = await createPost({
                title: 'Développeur Backend',
                description: 'Description Backend',
                keySkills: ['Node.js'],
                type: PostType.Teletravail,
            });

            await applicationModel.create({
                student: studentId,
                post: post1._id,
                company: companyId,
                status: ApplicationStatus.Pending,
                cv: 'https://example.com/cv1.pdf',
            });

            await applicationModel.create({
                student: studentId,
                post: post2._id,
                company: companyId,
                status: ApplicationStatus.Pending,
                cv: 'https://example.com/cv2.pdf',
            });

            const res = await request(app.getHttpServer())
                .get(buildPostsPath('/by-student'))
                .set('Authorization', `Bearer ${studentAccessToken}`)
                .expect(200);

            expect(res.body.data).toHaveLength(2);
            expect(res.body.total).toBe(2);
            const titles = res.body.data.map((p: any) => p.title);
            expect(titles).toContain('Développeur Frontend');
            expect(titles).toContain('Développeur Backend');
        });

        it('should return only posts the student applied to', async () => {
            const post1 = await createPost({
                title: 'Applied Post',
                description: 'Description',
                keySkills: ['Skill1'],
                type: PostType.Hybride,
            });

            await createPost({
                title: 'Not Applied Post',
                description: 'Description',
                keySkills: ['Skill2'],
                type: PostType.Presentiel,
            });

            await applicationModel.create({
                student: studentId,
                post: post1._id,
                company: companyId,
                status: ApplicationStatus.Pending,
                cv: 'https://example.com/cv.pdf',
            });

            const res = await request(app.getHttpServer())
                .get(buildPostsPath('/by-student'))
                .set('Authorization', `Bearer ${studentAccessToken}`)
                .expect(200);

            expect(res.body.data).toHaveLength(1);
            expect(res.body.data[0].title).toBe('Applied Post');
        });

        it('should return 401 when no authorization token is provided', async () => {
            await request(app.getHttpServer()).get(buildPostsPath('/by-student')).expect(401);
        });

        it('should handle pagination correctly with page parameter', async () => {
            for (let i = 0; i < 15; i++) {
                const post = await createPost({
                    title: `Post ${i}`,
                    description: `Description ${i}`,
                    keySkills: ['Skill1'],
                    type: PostType.Hybride,
                });
                await applicationModel.create({
                    student: studentId,
                    post: post._id,
                    company: companyId,
                    status: ApplicationStatus.Pending,
                    cv: `https://example.com/cv${i}.pdf`,
                });
            }

            const res = await request(app.getHttpServer())
                .get(buildPostsPath('/by-student?page=2&limit=10'))
                .set('Authorization', `Bearer ${studentAccessToken}`)
                .expect(200);

            expect(res.body.data).toHaveLength(5);
            expect(res.body.total).toBe(15);
            expect(res.body.page).toBe(2);
            expect(res.body.totalPages).toBe(2);
            expect(res.body.hasNext).toBe(false);
            expect(res.body.hasPrev).toBe(true);
        });

        it('should handle custom limit parameter', async () => {
            for (let i = 0; i < 5; i++) {
                const post = await createPost({
                    title: `Post ${i}`,
                    description: `Description ${i}`,
                    keySkills: ['Skill1'],
                    type: PostType.Hybride,
                });
                await applicationModel.create({
                    student: studentId,
                    post: post._id,
                    company: companyId,
                    status: ApplicationStatus.Pending,
                    cv: `https://example.com/cv${i}.pdf`,
                });
            }

            const res = await request(app.getHttpServer())
                .get(buildPostsPath('/by-student?limit=3'))
                .set('Authorization', `Bearer ${studentAccessToken}`)
                .expect(200);

            expect(res.body.data).toHaveLength(3);
            expect(res.body.limit).toBe(3);
        });

        it('should return posts with company populated', async () => {
            const post = await createPost({
                title: 'Test Post',
                description: 'Description',
                keySkills: ['Skill1'],
                type: PostType.Hybride,
            });

            await applicationModel.create({
                student: studentId,
                post: post._id,
                company: companyId,
                status: ApplicationStatus.Pending,
                cv: 'https://example.com/cv.pdf',
            });

            const res = await request(app.getHttpServer())
                .get(buildPostsPath('/by-student'))
                .set('Authorization', `Bearer ${studentAccessToken}`)
                .expect(200);

            expect(res.body.data[0]).toHaveProperty('company');
            expect(res.body.data[0].company).toHaveProperty('_id');
            expect(res.body.data[0].company).toHaveProperty('name');
        });

        it('should not return duplicate posts when student has multiple applications to same post', async () => {
            const post = await createPost({
                title: 'Duplicate Test',
                description: 'Description',
                keySkills: ['Skill1'],
                type: PostType.Hybride,
            });

            await applicationModel.create({
                student: studentId,
                post: post._id,
                company: companyId,
                status: ApplicationStatus.Pending,
                cv: 'https://example.com/cv1.pdf',
            });

            await applicationModel.create({
                student: studentId,
                post: post._id,
                company: companyId,
                status: ApplicationStatus.Accepted,
                cv: 'https://example.com/cv2.pdf',
            });

            const res = await request(app.getHttpServer())
                .get(buildPostsPath('/by-student'))
                .set('Authorization', `Bearer ${studentAccessToken}`)
                .expect(200);

            expect(res.body.data).toHaveLength(1);
            expect(res.body.total).toBe(1);
        });
    });
});
