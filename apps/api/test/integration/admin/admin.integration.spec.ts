import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { MongooseModule, getModelToken, getConnectionToken } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ConfigModule } from '@nestjs/config';
import { Model, Connection } from 'mongoose';
import cookieParser from 'cookie-parser';

import { AdminModule } from '../../../src/admin/admin.module';
import { AuthModule } from '../../../src/auth/auth.module';
import { UsersModule } from '../../../src/user/user.module';
import { MailerModule } from '../../../src/mailer/mailer.module';
import { User, UserDocument } from '../../../src/user/user.schema';
import { DatabaseExport, DatabaseExportDocument, ExportStatus } from '../../../src/admin/database-export.schema';
import { Role } from '../../../src/common/roles/roles.enum';
import * as bcrypt from 'bcrypt';

describe('Admin Export Integration Tests', () => {
    let app: INestApplication;
    let mongod: MongoMemoryServer;
    let userModel: Model<UserDocument>;
    let exportModel: Model<DatabaseExportDocument>;
    let connection: Connection;
    let adminAccessToken: string;
    let adminId: string;

    const ACCESS_TOKEN_SECRET = 'test-access-secret';
    const REFRESH_TOKEN_SECRET = 'test-refresh-secret';
    const ACCESS_TOKEN_LIFESPAN_MINUTES = 60;
    const REFRESH_TOKEN_LIFESPAN_MINUTES = 1440;

    beforeAll(async () => {
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();

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
                            EXPORT_DIR: './test-exports',
                            FRONTEND_URL: 'http://localhost:5173',
                            MAIL_FROM_NAME: 'Stagora Test',
                            MAIL_FROM_EMAIL: 'test@stagora.com',
                            MAIL_USER: 'test@example.com',
                            MAIL_PASS: 'testpass',
                        }),
                    ],
                }),
                MongooseModule.forRoot(uri),
                UsersModule,
                AuthModule,
                MailerModule,
                AdminModule,
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.use(cookieParser());
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
        await app.init();

        userModel = moduleFixture.get<Model<UserDocument>>(getModelToken(User.name));
        exportModel = moduleFixture.get<Model<DatabaseExportDocument>>(getModelToken(DatabaseExport.name));
        connection = moduleFixture.get<Connection>(getConnectionToken());
    });

    beforeEach(async () => {
        // Create admin user for tests
        const hashedPassword = await bcrypt.hash('AdminPass123!', 10);
        const admin = await userModel.create({
            email: 'admin@test.com',
            password: hashedPassword,
            role: Role.ADMIN,
            isValid: true,
            isVerified: true,
        });
        adminId = admin._id.toString();

        // Login to get access token
        const loginResponse = await request(app.getHttpServer())
            .post('/api/auth/login')
            .send({
                email: 'admin@test.com',
                password: 'AdminPass123!',
            })
            .expect(201);

        adminAccessToken = loginResponse.text;
    });

    afterEach(async () => {
        await userModel.deleteMany({}).exec();
        await exportModel.deleteMany({}).exec();
    });

    afterAll(async () => {
        if (app) {
            await app.close();
        }
        if (mongod) {
            await mongod.stop();
        }
    }, 30000);

    describe('POST /api/admin/export', () => {
        it('should initiate a database export successfully', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/admin/export')
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .send({ format: 'json' })
                .expect(201);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('Export initiated');
            expect(response.body).toHaveProperty('exportId');
            expect(response.body).toHaveProperty('status');
            expect(response.body.status).toBe(ExportStatus.PENDING);

            // Verify export was created in database
            const exportJob = await exportModel.findById(response.body.exportId);
            expect(exportJob).toBeDefined();
            expect(exportJob?.adminId.toString()).toBe(adminId);
        });

        it('should return 401 without authorization', async () => {
            await request(app.getHttpServer()).post('/api/admin/export').send({ format: 'json' }).expect(401);
        });

        it('should return 403 for non-admin users', async () => {
            // Create a student user
            const hashedPassword = await bcrypt.hash('StudentPass123!', 10);
            await userModel.create({
                email: 'student@test.com',
                password: hashedPassword,
                role: Role.STUDENT,
                isValid: true,
                isVerified: true,
            });

            // Login as student
            const loginResponse = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: 'student@test.com',
                    password: 'StudentPass123!',
                })
                .expect(201);

            const studentToken = loginResponse.text;

            // Try to create export as student
            await request(app.getHttpServer())
                .post('/api/admin/export')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ format: 'json' })
                .expect(403);
        });
    });

    describe('GET /api/admin/export/:exportId', () => {
        it('should get export status', async () => {
            // Create an export
            const exportJob = await exportModel.create({
                adminId,
                status: ExportStatus.COMPLETED,
                fileUrl: '/api/admin/export/123/download',
                fileSize: 1024,
                collectionsCount: 5,
                documentsCount: 100,
                startedAt: new Date(),
                completedAt: new Date(),
            });

            const response = await request(app.getHttpServer())
                .get(`/api/admin/export/${exportJob._id}`)
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('exportId');
            expect(response.body).toHaveProperty('status');
            expect(response.body.status).toBe(ExportStatus.COMPLETED);
            expect(response.body.fileSize).toBe(1024);
            expect(response.body.collectionsCount).toBe(5);
            expect(response.body.documentsCount).toBe(100);
        });

        it('should return 404 for non-existent export', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            await request(app.getHttpServer())
                .get(`/api/admin/export/${fakeId}`)
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .expect(404);
        });
    });

    describe('GET /api/admin/exports', () => {
        it('should list all exports for admin', async () => {
            // Create multiple exports
            await exportModel.create([
                {
                    adminId,
                    status: ExportStatus.COMPLETED,
                    createdAt: new Date(),
                },
                {
                    adminId,
                    status: ExportStatus.IN_PROGRESS,
                    createdAt: new Date(),
                },
                {
                    adminId,
                    status: ExportStatus.PENDING,
                    createdAt: new Date(),
                },
            ]);

            const response = await request(app.getHttpServer())
                .get('/api/admin/exports')
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body).toHaveLength(3);
            expect(response.body[0]).toHaveProperty('exportId');
            expect(response.body[0]).toHaveProperty('status');
            expect(response.body[0]).toHaveProperty('createdAt');
        });

        it('should return empty array if no exports', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/admin/exports')
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body).toHaveLength(0);
        });
    });

    describe('DELETE /api/admin/export/:exportId', () => {
        it('should cancel a pending export', async () => {
            const exportJob = await exportModel.create({
                adminId,
                status: ExportStatus.PENDING,
            });

            const response = await request(app.getHttpServer())
                .delete(`/api/admin/export/${exportJob._id}`)
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('cancelled successfully');
            expect(response.body.exportId).toBe(exportJob._id.toString());

            // Verify export was cancelled in database
            const updatedExport = await exportModel.findById(exportJob._id);
            expect(updatedExport?.status).toBe(ExportStatus.CANCELLED);
        });

        it('should cancel an in-progress export', async () => {
            const exportJob = await exportModel.create({
                adminId,
                status: ExportStatus.IN_PROGRESS,
                startedAt: new Date(),
            });

            const response = await request(app.getHttpServer())
                .delete(`/api/admin/export/${exportJob._id}`)
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .expect(200);

            expect(response.body.message).toContain('cancelled successfully');

            const updatedExport = await exportModel.findById(exportJob._id);
            expect(updatedExport?.status).toBe(ExportStatus.CANCELLED);
        });

        it('should return 400 when trying to cancel completed export', async () => {
            const exportJob = await exportModel.create({
                adminId,
                status: ExportStatus.COMPLETED,
                completedAt: new Date(),
            });

            await request(app.getHttpServer())
                .delete(`/api/admin/export/${exportJob._id}`)
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .expect(400);
        });

        it('should return 400 for non-existent export', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            await request(app.getHttpServer())
                .delete(`/api/admin/export/${fakeId}`)
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .expect(400);
        });
    });

    describe('GET /api/admin/export/:exportId/download', () => {
        it('should return 404 for non-existent export', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            await request(app.getHttpServer())
                .get(`/api/admin/export/${fakeId}/download`)
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .expect(404);
        });

        it('should return 400 for non-completed export', async () => {
            const exportJob = await exportModel.create({
                adminId,
                status: ExportStatus.IN_PROGRESS,
            });

            await request(app.getHttpServer())
                .get(`/api/admin/export/${exportJob._id}/download`)
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .expect(400);
        });
    });
});
