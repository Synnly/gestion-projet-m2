import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { StudentOwnerGuard } from '../../../../src/common/roles/studentOwner.guard';
import { Role } from '../../../../src/common/roles/roles.enum';

describe('StudentOwnerGuard', () => {
    let guard: StudentOwnerGuard;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [StudentOwnerGuard],
        }).compile();

        guard = module.get<StudentOwnerGuard>(StudentOwnerGuard);
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
            const context = createMockExecutionContext(null, { studentId: '123' });
            expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
            expect(() => guard.canActivate(context)).toThrow('User not authenticated');
        });

        it('should allow access for ADMIN role', () => {
            const user = { role: Role.ADMIN, sub: 'admin-id' };
            const context = createMockExecutionContext(user, { studentId: 'any' });
            expect(guard.canActivate(context)).toBe(true);
        });

        it('should allow access for COMPANY role', () => {
            const user = { role: Role.COMPANY, sub: 'company-id' };
            const context = createMockExecutionContext(user, { studentId: 'any' });
            expect(guard.canActivate(context)).toBe(true);
        });

        it('should throw ForbiddenException for non-STUDENT/COMPANY/ADMIN roles', () => {
            const user = { role: 'UNKNOWN', sub: 'x' };
            const context = createMockExecutionContext(user, { studentId: 'id' });
            expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
            expect(() => guard.canActivate(context)).toThrow("You can't access this resource");
        });

        it('should throw when studentId param missing', () => {
            const user = { role: Role.STUDENT, sub: 's1' };
            const context = createMockExecutionContext(user, {});
            expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
            expect(() => guard.canActivate(context)).toThrow('Ownership cannot be verified');
        });

        it('should throw when user sub missing', () => {
            const user = { role: Role.STUDENT };
            const context = createMockExecutionContext(user, { studentId: 's1' });
            expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
            expect(() => guard.canActivate(context)).toThrow('Ownership cannot be verified');
        });

        it('should allow STUDENT to access own resource', () => {
            const user = { role: Role.STUDENT, sub: 'student-1' };
            const context = createMockExecutionContext(user, { studentId: 'student-1' });
            expect(guard.canActivate(context)).toBe(true);
        });

        it('should throw when STUDENT accesses another student', () => {
            const user = { role: Role.STUDENT, sub: 'student-1' };
            const context = createMockExecutionContext(user, { studentId: 'student-2' });
            expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
            expect(() => guard.canActivate(context)).toThrow('You can only access your own student resource');
        });

        it('should handle ObjectId-like values correctly', () => {
            const userId = { toString: () => '507f1f77bcf86cd799439011' };
            const studentId = { toString: () => '507f1f77bcf86cd799439011' };
            const user = { role: Role.STUDENT, sub: userId };
            const context = createMockExecutionContext(user, { studentId });
            expect(guard.canActivate(context)).toBe(true);
        });

        it('should reject when ObjectId-like values do not match', () => {
            const userId = { toString: () => '507f1f77bcf86cd799439011' };
            const studentId = { toString: () => '507f1f77bcf86cd799439012' };
            const user = { role: Role.STUDENT, sub: userId };
            const context = createMockExecutionContext(user, { studentId });
            expect(() => guard.canActivate(context)).toThrow('You can only access your own student resource');
        });
    });
});
