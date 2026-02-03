import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { StudentEditGuard } from '../../../../src/common/roles/studentEdit.guard';
import { Role } from '../../../../src/common/roles/roles.enum';

describe('StudentEditGuard', () => {
    let guard: StudentEditGuard;

    const createMockExecutionContext = (user: any, params: any = {}): ExecutionContext => {
        return {
            switchToHttp: () => ({
                getRequest: () => ({
                    user,
                    params,
                }),
            }),
        } as ExecutionContext;
    };

    beforeEach(() => {
        guard = new StudentEditGuard();
    });

    it('should be defined', () => {
        expect(guard).toBeDefined();
    });

    describe('canActivate', () => {
        it('should throw ForbiddenException when user is not present', () => {
            const context = createMockExecutionContext(null, { studentId: '507f1f77bcf86cd799439011' });

            expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
            expect(() => guard.canActivate(context)).toThrow('User not authenticated');
        });

        it('should return true when user is ADMIN', () => {
            const context = createMockExecutionContext(
                { sub: '507f1f77bcf86cd799439011', role: Role.ADMIN },
                { studentId: '507f1f77bcf86cd799439012' },
            );

            const result = guard.canActivate(context);

            expect(result).toBe(true);
        });

        it('should return true when STUDENT edits their own resource', () => {
            const studentId = '507f1f77bcf86cd799439011';
            const context = createMockExecutionContext(
                { sub: studentId, role: Role.STUDENT },
                { studentId },
            );

            const result = guard.canActivate(context);

            expect(result).toBe(true);
        });

        it('should throw ForbiddenException when STUDENT tries to edit another student resource', () => {
            const context = createMockExecutionContext(
                { sub: '507f1f77bcf86cd799439011', role: Role.STUDENT },
                { studentId: '507f1f77bcf86cd799439099' },
            );

            expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
            expect(() => guard.canActivate(context)).toThrow('You can only edit your own student resource');
        });

        it('should throw ForbiddenException when STUDENT and studentId is missing', () => {
            const context = createMockExecutionContext({ sub: '507f1f77bcf86cd799439011', role: Role.STUDENT }, {});

            expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
            expect(() => guard.canActivate(context)).toThrow('Ownership cannot be verified');
        });

        it('should throw ForbiddenException when STUDENT and userSub is missing', () => {
            const context = createMockExecutionContext(
                { role: Role.STUDENT },
                { studentId: '507f1f77bcf86cd799439011' },
            );

            expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
            expect(() => guard.canActivate(context)).toThrow('Ownership cannot be verified');
        });

        it('should throw ForbiddenException when role is COMPANY', () => {
            const context = createMockExecutionContext(
                { sub: '507f1f77bcf86cd799439011', role: Role.COMPANY },
                { studentId: '507f1f77bcf86cd799439011' },
            );

            expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
            expect(() => guard.canActivate(context)).toThrow("You can't edit this resource");
        });

        it('should throw ForbiddenException for any other role', () => {
            const context = createMockExecutionContext(
                { sub: '507f1f77bcf86cd799439011', role: 'UNKNOWN_ROLE' },
                { studentId: '507f1f77bcf86cd799439011' },
            );

            expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
            expect(() => guard.canActivate(context)).toThrow("You can't edit this resource");
        });

        it('should use user._id if user.sub is not present for STUDENT', () => {
            const studentId = '507f1f77bcf86cd799439011';
            const context = createMockExecutionContext(
                { _id: studentId, role: Role.STUDENT },
                { studentId },
            );

            const result = guard.canActivate(context);

            expect(result).toBe(true);
        });

        it('should use user.id if user.sub and user._id are not present for STUDENT', () => {
            const studentId = '507f1f77bcf86cd799439011';
            const context = createMockExecutionContext(
                { id: studentId, role: Role.STUDENT },
                { studentId },
            );

            const result = guard.canActivate(context);

            expect(result).toBe(true);
        });
    });
});
