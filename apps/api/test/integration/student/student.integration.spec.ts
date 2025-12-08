import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../../../src/user/user.module';
import { StudentModule } from '../../../src/student/student.module';
import { AuthGuard } from '../../../src/auth/auth.guard';
import { RolesGuard } from '../../../src/common/roles/roles.guard';
import { Role } from '../../../src/common/roles/roles.enum';

describe('Student Integration', () => {
    let mongod: MongoMemoryServer;
    let app: INestApplication;

    beforeAll(async () => {
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();

        const mockAuthGuard = {
            canActivate: (context: any) => {
                const req = context.switchToHttp().getRequest();
                // Attach an admin user for integration tests so guards that
                // verify ownership or roles can pass.
                req.user = { sub: 'integration-admin', role: Role.ADMIN };
                return true;
            },
        };
        const mockRolesGuard = { canActivate: jest.fn().mockReturnValue(true) };

        const moduleRef = await Test.createTestingModule({
            imports: [MongooseModule.forRoot(uri), UsersModule, StudentModule],
        })
            .overrideGuard(AuthGuard)
            .useValue(mockAuthGuard)
            .overrideGuard(RolesGuard)
            .useValue(mockRolesGuard)
            .compile();

        app = moduleRef.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
        await app.init();
    });

    afterAll(async () => {
        if (app) await app.close();
        if (mongod) await mongod.stop();
    });

    it('POST /api/students -> creates student; GET returns it', async () => {
        const dto = {
            email: 'student1@example.com',
            password: 'StrongP@ss1',
            studentNumber: 'SN-001',
            role: Role.STUDENT,
            firstName: 'John',
            lastName: 'Doe',
        };

        await request(app.getHttpServer()).post('/api/students').send(dto).expect(201);

        const res = await request(app.getHttpServer()).get('/api/students').expect(200);
        expect(Array.isArray(res.body)).toBeTruthy();
        expect(res.body.find((s: any) => s.email === dto.email)).toBeDefined();
    });

    it('POST /api/students -> fails validation when firstName is missing', async () => {
        const dto = {
            email: 'student2@example.com',
            password: 'StrongP@ss1',
            role: Role.STUDENT,
            lastName: 'Doe',
        };

        await request(app.getHttpServer()).post('/api/students').send(dto).expect(400);
    });

    it('POST /api/students -> fails validation when password is weak', async () => {
        const dto = {
            email: 'student3@example.com',
            password: 'weak',
            student_number: 'SN-003',
            role: Role.STUDENT,
            firstName: 'John',
            lastName: 'Doe',
        };

        await request(app.getHttpServer()).post('/api/students').send(dto).expect(400);
    });

    it('POST /api/students -> returns 409 when email already exists', async () => {
        const dto = {
            email: 'duplicate@example.com',
            password: 'StrongP@ss1',
            student_number: 'SN-DUP',
            role: Role.STUDENT,
            firstName: 'John',
            lastName: 'Doe',
        };

        await request(app.getHttpServer()).post('/api/students').send(dto).expect(201);
        await request(app.getHttpServer()).post('/api/students').send(dto).expect(409);
    });

    it('GET /api/students/:studentId -> returns student when exists', async () => {
        const dto = {
            email: 'studentget@example.com',
            password: 'StrongP@ss1',
            student_number: 'SN-GET',
            role: Role.STUDENT,
            firstName: 'Jane',
            lastName: 'Smith',
        };

        await request(app.getHttpServer()).post('/api/students').send(dto).expect(201);

        const allStudents = await request(app.getHttpServer()).get('/api/students').expect(200);
        const createdStudent = allStudents.body.find((s: any) => s.email === dto.email);

        const res = await request(app.getHttpServer()).get(`/api/students/${createdStudent._id}`).expect(200);
        expect(res.body.email).toBe(dto.email);
        expect(res.body.firstName).toBe(dto.firstName);
    });

    it('GET /api/students/:studentId -> returns 404 when student not found', async () => {
        await request(app.getHttpServer()).get('/api/students/507f1f77bcf86cd799439011').expect(404);
    });

    it('PUT /api/students/:studentId -> updates existing student', async () => {
        const dto = {
            email: 'studentupdate@example.com',
            password: 'StrongP@ss1',
            student_number: 'SN-UPD',
            role: Role.STUDENT,
            firstName: 'Old',
            lastName: 'Name',
        };

        await request(app.getHttpServer()).post('/api/students').send(dto).expect(201);

        const allStudents = await request(app.getHttpServer()).get('/api/students').expect(200);
        const createdStudent = allStudents.body.find((s: any) => s.email === dto.email);

        const updateDto = {
            firstName: 'New',
            lastName: 'UpdatedName',
        };

        await request(app.getHttpServer()).put(`/api/students/${createdStudent._id}`).send(updateDto).expect(204);

        const updated = await request(app.getHttpServer()).get(`/api/students/${createdStudent._id}`).expect(200);
        expect(updated.body.firstName).toBe('New');
        expect(updated.body.lastName).toBe('UpdatedName');
    });

    it('PUT /api/students/:studentId -> creates student when not found', async () => {
        const createDto = {
            email: 'newthroughput@example.com',
            password: 'StrongP@ss1',
            student_number: 'SN-PUT',
            role: Role.STUDENT,
            firstName: 'Created',
            lastName: 'Via-Put',
        };

        await request(app.getHttpServer()).put('/api/students/507f1f77bcf86cd799439099').send(createDto).expect(204);

        const allStudents = await request(app.getHttpServer()).get('/api/students').expect(200);
        const found = allStudents.body.find((s: any) => s.email === createDto.email);
        expect(found).toBeDefined();
        expect(found.firstName).toBe('Created');
    });

    it('DELETE /api/students/:studentId -> soft deletes student', async () => {
        const dto = {
            email: 'studentdelete@example.com',
            password: 'StrongP@ss1',
            student_number: 'SN-DEL',
            role: Role.STUDENT,
            firstName: 'To',
            lastName: 'Delete',
        };

        await request(app.getHttpServer()).post('/api/students').send(dto).expect(201);

        const beforeDelete = await request(app.getHttpServer()).get('/api/students').expect(200);
        const countBefore = beforeDelete.body.length;
        const createdStudent = beforeDelete.body.find((s: any) => s.email === dto.email);

        await request(app.getHttpServer()).delete(`/api/students/${createdStudent._id}`).expect(204);

        // List should have one less student after deletion
        const afterDelete = await request(app.getHttpServer()).get('/api/students').expect(200);
        expect(afterDelete.body.length).toBe(countBefore - 1);

        // Deleted student should not be found by ID
        const getById = await request(app.getHttpServer()).get(`/api/students/${createdStudent._id}`);
        expect(getById.status).toBe(404);
    });

    it('DELETE /api/students/:studentId -> returns 404 when student not found', async () => {
        await request(app.getHttpServer()).delete('/api/students/507f1f77bcf86cd799439022').expect(404);
    });
});
