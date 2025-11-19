import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { CompanyOwnerGuard } from '../../../../src/common/roles/companyOwner.guard';
import { Role } from '../../../../src/common/roles/roles.enum';

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
        it('should throw ForbiddenException when user is not authenticated', () => {
            const context = createMockExecutionContext(null, { id: '123' });

            expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
            expect(() => guard.canActivate(context)).toThrow('User not authenticated');
        });

        it('should throw ForbiddenException when user is undefined', () => {
            const context = createMockExecutionContext(undefined, { id: '123' });

            expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
            expect(() => guard.canActivate(context)).toThrow('User not authenticated');
        });

        it('should allow access for ADMIN role regardless of company ID', () => {
            const user = { role: Role.ADMIN, sub: 'admin-id' };
            const context = createMockExecutionContext(user, { id: 'different-company-id' });

            const result = guard.canActivate(context);

            expect(result).toBe(true);
        });

        it('should throw ForbiddenException for non-COMPANY and non-ADMIN roles', () => {
            const user = { role: Role.STUDENT, sub: 'student-id' };
            const context = createMockExecutionContext(user, { id: 'company-id' });

            expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
            expect(() => guard.canActivate(context)).toThrow("You can't access this resource");
        });

        it('should throw ForbiddenException when companyId param is missing', () => {
            const user = { role: Role.COMPANY, sub: 'company-id' };
            const context = createMockExecutionContext(user, {});

            expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
            expect(() => guard.canActivate(context)).toThrow('Ownership cannot be verified');
        });

        it('should throw ForbiddenException when userSub is missing', () => {
            const user = { role: Role.COMPANY };
            const context = createMockExecutionContext(user, { id: 'company-id' });

            expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
            expect(() => guard.canActivate(context)).toThrow('Ownership cannot be verified');
        });

        it('should throw ForbiddenException when company tries to access different company', () => {
            const user = { role: Role.COMPANY, sub: 'company-id-1' };
            const context = createMockExecutionContext(user, { id: 'company-id-2' });

            expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
            expect(() => guard.canActivate(context)).toThrow('You can only modify your own company');
        });

        it('should allow access when company owns the resource', () => {
            const user = { role: Role.COMPANY, sub: 'company-id' };
            const context = createMockExecutionContext(user, { id: 'company-id' });

            const result = guard.canActivate(context);

            expect(result).toBe(true);
        });

        it('should allow access when IDs match as strings', () => {
            const user = { role: Role.COMPANY, sub: '507f1f77bcf86cd799439011' };
            const context = createMockExecutionContext(user, { id: '507f1f77bcf86cd799439011' });

            const result = guard.canActivate(context);

            expect(result).toBe(true);
        });

        it('should handle ObjectId-like values correctly', () => {
            const userId = { toString: () => '507f1f77bcf86cd799439011' };
            const companyId = { toString: () => '507f1f77bcf86cd799439011' };
            const user = { role: Role.COMPANY, sub: userId };
            const context = createMockExecutionContext(user, { id: companyId });

            const result = guard.canActivate(context);

            expect(result).toBe(true);
        });

        it('should reject when ObjectId-like values do not match', () => {
            const userId = { toString: () => '507f1f77bcf86cd799439011' };
            const companyId = { toString: () => '507f1f77bcf86cd799439012' };
            const user = { role: Role.COMPANY, sub: userId };
            const context = createMockExecutionContext(user, { id: companyId });

            expect(() => guard.canActivate(context)).toThrow('You can only modify your own company');
        });
    });
});
