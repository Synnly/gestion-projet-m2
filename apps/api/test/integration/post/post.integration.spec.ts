import { INestApplication, ValidationPipe, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ConfigModule } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import cookieParser from 'cookie-parser';

import { PostModule } from '../../../src/post/post.module';
import { AuthGuard } from '../../../src/auth/auth.guard';
import { Post, PostDocument } from '../../../src/post/post.schema';
import { PostType } from '../../../src/post/post.schema';
import { AuthModule } from '../../../src/auth/auth.module';
import { CompanyModule } from '../../../src/company/company.module';
import { User, CompanyUserDocument } from '../../../src/user/user.schema';
import { Role } from '../../../src/common/roles/roles.enum';

describe('Post Integration Tests', () => {
    let app: INestApplication;
    let mongod: MongoMemoryServer;
    let postModel: Model<PostDocument>;
    let userModel: Model<CompanyUserDocument>;
    let accessToken: string;

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

        // Create a company and login to get access token
        const createdUser = await userModel.create({
            email: 'company@test.com',
            password: 'TestP@ss123',
            name: 'Test Company',
            role: Role.COMPANY,
            isValid: true,
        });

        console.log('Created user:', { email: createdUser.email, role: createdUser.role });

        const loginRes = await request(app.getHttpServer())
            .post('/api/auth/login')
            .send({ email: 'company@test.com', password: 'TestP@ss123' });

        console.log('Login response:', { status: loginRes.status, body: loginRes.body, text: loginRes.text });

        if (loginRes.status !== 201) {
            console.error('Login failed:', loginRes.status, loginRes.body);
            throw new Error('Failed to login for tests');
        }

        accessToken = loginRes.text;
    });

    afterEach(async () => {
        await postModel.deleteMany({}).exec();
    });

    afterAll(async () => {
        await userModel.deleteMany({}).exec();
        await app.close();
        if (mongod) await mongod.stop();
    });

    const createPost = async (data: any) => {
        return await postModel.create(data);
    };

    const normalizeBody = (obj: any) => {
        if (!obj) return obj;
        if (Array.isArray(obj)) return obj.map((o) => (o && o._doc ? o._doc : o));
        return obj._doc ? obj._doc : obj;
    };

    describe('GET /api/posts - Find All Posts', () => {
        it('should return empty array when no posts exist and findAll is called', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/posts')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(res.body).toEqual([]);
            expect(Array.isArray(res.body)).toBe(true);
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
                .get('/api/posts')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            const normalized = normalizeBody(res.body);
            expect(normalized).toHaveLength(1);
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
                .get('/api/posts')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            const normalized = normalizeBody(res.body);
            expect(normalized).toHaveLength(2);
            expect(normalized[0].title).toBe('Développeur Frontend');
            expect(normalized[1].title).toBe('Développeur Backend');
        });

        it('should return 401 when no authorization token is provided and findAll is called', async () => {
            await request(app.getHttpServer()).get('/api/posts').expect(401);
        });

        it('should return 401 when invalid authorization token is provided and findAll is called', async () => {
            await request(app.getHttpServer())
                .get('/api/posts')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
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
                .get('/api/posts')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            const normalized = normalizeBody(res.body);
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

    describe('GET /api/posts/:id - Find One Post', () => {
        it('should return a post when valid id is provided and findOne is called', async () => {
            const post = await createPost({
                title: 'Développeur Full Stack',
                description: 'Recherche développeur expérimenté',
                keySkills: ['JavaScript'],
                type: PostType.Hybride,
            });

            const res = await request(app.getHttpServer())
                .get(`/api/posts/${post._id}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            const normalized = normalizeBody(res.body);
            expect(normalized.title).toBe('Développeur Full Stack');
            expect(normalized._id).toBe(post._id.toString());
        });

        it('should return 404 when post does not exist and findOne is called', async () => {
            const nonExistentId = new Types.ObjectId().toString();

            const res = await request(app.getHttpServer())
                .get(`/api/posts/${nonExistentId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(404);

            expect(res.body.message).toContain(`Post with id ${nonExistentId} not found`);
        });

        it('should return 400 when invalid ObjectId is provided and findOne is called', async () => {
            await request(app.getHttpServer())
                .get('/api/posts/invalid-id')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(400);
        });

        it('should return 401 when no authorization token is provided and findOne is called', async () => {
            const post = await createPost({
                title: 'Test Post',
                description: 'Test Description',
                keySkills: ['Skill1'],
                type: PostType.Presentiel,
            });

            await request(app.getHttpServer()).get(`/api/posts/${post._id}`).expect(401);
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
                .get(`/api/posts/${post._id}`)
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

    describe('POST /api/posts - Create Post', () => {
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
            };

            await request(app.getHttpServer())
                .post('/api/posts')
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
            };

            await request(app.getHttpServer())
                .post('/api/posts')
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
                .post('/api/posts')
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
                .post('/api/posts')
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
                .post('/api/posts')
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
                .post('/api/posts')
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
                .post('/api/posts')
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
                .post('/api/posts')
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
                .post('/api/posts')
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
                .post('/api/posts')
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
                .post('/api/posts')
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
                .post('/api/posts')
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
                .post('/api/posts')
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
                .post('/api/posts')
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

            await request(app.getHttpServer()).post('/api/posts').send(postData).expect(401);
        });

        it('should create post with type Presentiel when valid data is provided and create is called', async () => {
            const postData = {
                title: 'Poste Présentiel',
                description: 'Description',
                keySkills: ['Skill1'],
                type: PostType.Presentiel,
            };

            await request(app.getHttpServer())
                .post('/api/posts')
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
            };

            await request(app.getHttpServer())
                .post('/api/posts')
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
            };

            await request(app.getHttpServer())
                .post('/api/posts')
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
            };

            await request(app.getHttpServer())
                .post('/api/posts')
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
});
