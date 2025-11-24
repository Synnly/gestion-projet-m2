import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { CompanyOwnerGuard } from '../../../src/company/companyOwner.guard';
import { Role } from '../../../src/common/roles/roles.enum';

describe('CompanyOwnerGuard', () => {
    let guard: CompanyOwnerGuard;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [CompanyOwnerGuard],
        }).compile();

        guard = module.get<CompanyOwnerGuard>(CompanyOwnerGuard);
    });

    const createMockExecutionContext = (user: any, params: any): ExecutionContext => {
        return {
            switchToHttp: () => ({
                getRequest: () => ({
                    user,
                    params,
                }),
            }),
        } as ExecutionContext;
    };

    it('should be defined', () => {
        expect(guard).toBeDefined();
    });

    describe('canActivate', () => {
        it('should throw ForbiddenException when user is not authenticated', async () => {
            const context = createMockExecutionContext(null, { companyId: '123' });

            // We use "await expect(...).rejects.toThrow" with async functions
            await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
            await expect(guard.canActivate(context)).rejects.toThrow('User not authenticated');
        });

        it('should throw ForbiddenException when user is undefined', async () => {
            const context = createMockExecutionContext(undefined, { companyId: '123' });

            await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
        });

        it('should allow access for ADMIN role regardless of company ID', async () => {
            const user = { role: Role.ADMIN, sub: 'admin-id' };
            const context = createMockExecutionContext(user, { companyId: 'different-company-id' });

            const result = await guard.canActivate(context);

            expect(result).toBe(true);
        });

        it('should throw ForbiddenException for non-COMPANY and non-ADMIN roles', async () => {
            const user = { role: Role.STUDENT, sub: 'student-id' };
            const context = createMockExecutionContext(user, { companyId: 'company-id' });

            await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
            await expect(guard.canActivate(context)).rejects.toThrow("You can't access this resource");
        });

        it('should throw ForbiddenException when companyId param is missing', async () => {
            const user = { role: Role.COMPANY, sub: 'company-id' };
            const context = createMockExecutionContext(user, {});

            await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
            await expect(guard.canActivate(context)).rejects.toThrow('Ownership cannot be verified');
        });

        it('should throw ForbiddenException when userSub is missing', async () => {
            const user = { role: Role.COMPANY };
            const context = createMockExecutionContext(user, { companyId: 'company-id' });

            await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
            await expect(guard.canActivate(context)).rejects.toThrow('Ownership cannot be verified');
        });

        it('should throw ForbiddenException when company tries to access different company', async () => {
            const user = { role: Role.COMPANY, sub: 'company-id-1' };
            const context = createMockExecutionContext(user, { companyId: 'company-id-2' });

            await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
            await expect(guard.canActivate(context)).rejects.toThrow('You can only modify your own company');
        });

        it('should allow access when company owns the resource', async () => {
            const user = { role: Role.COMPANY, sub: 'company-id' };
            const context = createMockExecutionContext(user, { companyId: 'company-id' });

            const result = await guard.canActivate(context);

            expect(result).toBe(true);
        });

        it('should allow access when IDs match as strings', async () => {
            const user = { role: Role.COMPANY, sub: '507f1f77bcf86cd799439011' };
            const context = createMockExecutionContext(user, { companyId: '507f1f77bcf86cd799439011' });

            const result = await guard.canActivate(context);

            expect(result).toBe(true);
        });

        it('should handle ObjectId-like values correctly', async () => {
            const userId = { toString: () => '507f1f77bcf86cd799439011' };
            const companyId = { toString: () => '507f1f77bcf86cd799439011' };
            const user = { role: Role.COMPANY, sub: userId };
            const context = createMockExecutionContext(user, { companyId });

            const result = await guard.canActivate(context);

            expect(result).toBe(true);
        });

        it('should reject when ObjectId-like values do not match', async () => {
            const userId = { toString: () => '507f1f77bcf86cd799439011' };
            const companyId = { toString: () => '507f1f77bcf86cd799439012' };
            const user = { role: Role.COMPANY, sub: userId };
            const context = createMockExecutionContext(user, { companyId });

            await expect(guard.canActivate(context)).rejects.toThrow('You can only modify your own company');
        });
    });
});