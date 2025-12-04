import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ApplicationOwnerGuard } from '../../../../src/common/roles/applicationOwner.guard';
import { ApplicationService } from '../../../../src/application/application.service';
import { Role } from '../../../../src/common/roles/roles.enum';

describe('ApplicationOwnerGuard', () => {
    let guard: ApplicationOwnerGuard;
    let applicationService: { findOne: jest.Mock };
    let mockApplicationService: { findOne: jest.Mock };

    const createMockExecutionContext = (user: any, params: any): ExecutionContext =>
        ({
            switchToHttp: () => ({
                getRequest: () => ({
                    user,
                    params,
                }),
            }),
        } as ExecutionContext);

    beforeEach(async () => {
        mockApplicationService = {
            findOne: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ApplicationOwnerGuard,
                {
                    provide: ApplicationService,
                    useValue: mockApplicationService,
                },
            ],
        }).compile();

        guard = module.get<ApplicationOwnerGuard>(ApplicationOwnerGuard);
        applicationService = module.get(ApplicationService);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(guard).toBeDefined();
    });

    describe('canActivate', () => {
        const applicationId = new Types.ObjectId('507f191e810c19729de860ea');

        it('should throw ForbiddenException when user is not authenticated', async () => {
            const context = createMockExecutionContext(null, { applicationId: applicationId.toString() });

            const resultPromise = guard.canActivate(context);

            await expect(resultPromise).rejects.toThrow(ForbiddenException);
            await expect(resultPromise).rejects.toThrow('User not authenticated');
            expect(applicationService.findOne).not.toHaveBeenCalled();
        });

        it('should allow access for ADMIN role', async () => {
            const user = { role: Role.ADMIN, sub: 'admin-id' };
            const context = createMockExecutionContext(user, { applicationId: applicationId.toString() });

            const result = await guard.canActivate(context);

            expect(result).toBe(true);
            expect(applicationService.findOne).not.toHaveBeenCalled();
        });

        it('should deny access for roles other than COMPANY or STUDENT', async () => {
            const user = { role: 'UNKNOWN', sub: 'user-id' };
            const context = createMockExecutionContext(user, { applicationId: applicationId.toString() });

            const resultPromise = guard.canActivate(context);

            await expect(resultPromise).rejects.toThrow(ForbiddenException);
            await expect(resultPromise).rejects.toThrow("You can't access this resource");
            expect(applicationService.findOne).not.toHaveBeenCalled();
        });

        it('should throw when applicationId is missing', async () => {
            const user = { role: Role.COMPANY, sub: 'company-id' };
            const context = createMockExecutionContext(user, {});

            const resultPromise = guard.canActivate(context);

            await expect(resultPromise).rejects.toThrow('Ownership cannot be verified');
            expect(applicationService.findOne).not.toHaveBeenCalled();
        });

        it('should throw when user identifier is missing', async () => {
            const user = { role: Role.STUDENT };
            const context = createMockExecutionContext(user, { applicationId: applicationId.toString() });

            const resultPromise = guard.canActivate(context);

            await expect(resultPromise).rejects.toThrow('Ownership cannot be verified');
            expect(applicationService.findOne).not.toHaveBeenCalled();
        });

        it('should allow COMPANY access when owning the application (using sub)', async () => {
            const companyId = new Types.ObjectId('507f1f77bcf86cd799439011');
            applicationService.findOne.mockResolvedValue({
                post: { company: { _id: companyId } },
            });

            const user = { role: Role.COMPANY, sub: companyId.toString() };
            const context = createMockExecutionContext(user, { applicationId: applicationId.toString() });

            const result = await guard.canActivate(context);

            expect(result).toBe(true);
            expect(applicationService.findOne).toHaveBeenCalledWith(expect.any(Types.ObjectId));
            expect((applicationService.findOne.mock.calls[0][0] as Types.ObjectId).toString()).toBe(
                applicationId.toString(),
            );
        });

        it('should allow COMPANY access when user id comes from id field', async () => {
            const companyId = 'company-from-id';
            applicationService.findOne.mockResolvedValue({
                post: { company: { _id: companyId } },
            });

            const user = { role: Role.COMPANY, id: companyId };
            const context = createMockExecutionContext(user, { applicationId: applicationId.toString() });

            const result = await guard.canActivate(context);

            expect(result).toBe(true);
            expect(applicationService.findOne).toHaveBeenCalledTimes(1);
        });

        it('should allow COMPANY access when user id comes from _id field', async () => {
            const companyId = new Types.ObjectId('507f1f77bcf86cd799439015');
            applicationService.findOne.mockResolvedValue({
                post: { company: { _id: companyId.toString() } },
            });

            const user = { role: Role.COMPANY, _id: companyId };
            const context = createMockExecutionContext(user, { applicationId: applicationId.toString() });

            const result = await guard.canActivate(context);

            expect(result).toBe(true);
            expect(applicationService.findOne).toHaveBeenCalledTimes(1);
        });

        it('should throw ForbiddenException when COMPANY does not own the application', async () => {
            const companyId = new Types.ObjectId('507f1f77bcf86cd799439011');
            applicationService.findOne.mockResolvedValue({
                post: { company: { _id: new Types.ObjectId('507f1f77bcf86cd799439012') } },
            });

            const user = { role: Role.COMPANY, sub: companyId.toString() };
            const context = createMockExecutionContext(user, { applicationId: applicationId.toString() });

            const resultPromise = guard.canActivate(context);

            await expect(resultPromise).rejects.toThrow(ForbiddenException);
            await expect(resultPromise).rejects.toThrow("You can't access this resource");
        });

        it('should allow STUDENT access when owning the application (using _id)', async () => {
            const studentId = new Types.ObjectId('507f1f77bcf86cd799439013');
            applicationService.findOne.mockResolvedValue({
                student: { _id: studentId },
            });

            const user = { role: Role.STUDENT, _id: studentId };
            const context = createMockExecutionContext(user, { applicationId: applicationId.toString() });

            const result = await guard.canActivate(context);

            expect(result).toBe(true);
            expect(applicationService.findOne).toHaveBeenCalledTimes(1);
        });

        it('should allow STUDENT access when user id comes from sub field', async () => {
            const studentId = 'student-from-sub';
            applicationService.findOne.mockResolvedValue({
                student: { _id: studentId },
            });

            const user = { role: Role.STUDENT, sub: studentId };
            const context = createMockExecutionContext(user, { applicationId: applicationId.toString() });

            const result = await guard.canActivate(context);

            expect(result).toBe(true);
            expect(applicationService.findOne).toHaveBeenCalledTimes(1);
        });

        it('should allow STUDENT access when user id comes from id field', async () => {
            const studentId = 'student-from-id';
            applicationService.findOne.mockResolvedValue({
                student: { _id: studentId },
            });

            const user = { role: Role.STUDENT, id: studentId };
            const context = createMockExecutionContext(user, { applicationId: applicationId.toString() });

            const result = await guard.canActivate(context);

            expect(result).toBe(true);
            expect(applicationService.findOne).toHaveBeenCalledTimes(1);
        });

        it('should throw ForbiddenException when STUDENT does not own the application', async () => {
            const studentId = new Types.ObjectId('507f1f77bcf86cd799439013');
            applicationService.findOne.mockResolvedValue({
                student: { _id: new Types.ObjectId('507f1f77bcf86cd799439014') },
            });

            const user = { role: Role.STUDENT, sub: studentId.toString() };
            const context = createMockExecutionContext(user, { applicationId: applicationId.toString() });

            const resultPromise = guard.canActivate(context);

            await expect(resultPromise).rejects.toThrow(ForbiddenException);
            await expect(resultPromise).rejects.toThrow("You can't access this resource");
        });

        it('should throw ForbiddenException when application is not found', async () => {
            applicationService.findOne.mockResolvedValue(null);

            const user = { role: Role.COMPANY, sub: 'company-id' };
            const context = createMockExecutionContext(user, { applicationId: applicationId.toString() });

            const resultPromise = guard.canActivate(context);

            await expect(resultPromise).rejects.toThrow(ForbiddenException);
            await expect(resultPromise).rejects.toThrow("You can't access this resource");
        });
    });
});
