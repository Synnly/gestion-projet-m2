import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserOwnerGuard } from '../../../../src/common/roles/userOwner.guard';
import { Role } from '../../../../src/common/roles/roles.enum';
import { Types } from 'mongoose';

describe('UserOwnerGuard', () => {
    let guard: UserOwnerGuard;

    const userId = new Types.ObjectId('507f1f77bcf86cd799439011');
    const otherUserId = new Types.ObjectId('507f1f77bcf86cd799439012');

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [UserOwnerGuard],
        }).compile();

        guard = module.get<UserOwnerGuard>(UserOwnerGuard);
    });

    const createMockContext = (user: any, params: any): ExecutionContext => {
        return {
            switchToHttp: () => ({
                getRequest: () => ({ user, params }),
            }),
        } as ExecutionContext;
    };

    it('should be defined', () => {
        expect(guard).toBeDefined();
    });

    describe('ADMIN role', () => {
        it('should allow ADMIN to access any user resources', () => {
            const context = createMockContext(
                { role: Role.ADMIN, sub: userId.toString() },
                { userId: otherUserId.toString() },
            );

            const result = guard.canActivate(context);

            expect(result).toBe(true);
        });
    });

    describe('STUDENT role', () => {
        it('should allow STUDENT to access their own resources', () => {
            const context = createMockContext(
                { role: Role.STUDENT, sub: userId.toString() },
                { userId: userId.toString() },
            );

            const result = guard.canActivate(context);

            expect(result).toBe(true);
        });

        it('should deny STUDENT access to other users resources', () => {
            const context = createMockContext(
                { role: Role.STUDENT, sub: userId.toString() },
                { userId: otherUserId.toString() },
            );

            expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
            expect(() => guard.canActivate(context)).toThrow('You can only access your own resources');
        });
    });

    describe('COMPANY role', () => {
        it('should allow COMPANY to access their own resources', () => {
            const context = createMockContext(
                { role: Role.COMPANY, sub: userId.toString() },
                { userId: userId.toString() },
            );

            const result = guard.canActivate(context);

            expect(result).toBe(true);
        });

        it('should deny COMPANY access to other users resources', () => {
            const context = createMockContext(
                { role: Role.COMPANY, sub: userId.toString() },
                { userId: otherUserId.toString() },
            );

            expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
            expect(() => guard.canActivate(context)).toThrow('You can only access your own resources');
        });
    });

    describe('Edge cases', () => {
        it('should throw ForbiddenException when user is not authenticated', () => {
            const context = createMockContext(null, { userId: userId.toString() });

            expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
            expect(() => guard.canActivate(context)).toThrow('User not authenticated');
        });

        it('should throw ForbiddenException when userId parameter is missing', () => {
            const context = createMockContext({ role: Role.STUDENT, sub: userId.toString() }, {});

            expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
            expect(() => guard.canActivate(context)).toThrow('Ownership cannot be verified');
        });

        it('should throw ForbiddenException when user sub is missing', () => {
            const context = createMockContext({ role: Role.STUDENT }, { userId: userId.toString() });

            expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
            expect(() => guard.canActivate(context)).toThrow('Ownership cannot be verified');
        });

        it('should throw ForbiddenException for unsupported roles', () => {
            const context = createMockContext(
                { role: 'UNKNOWN_ROLE', sub: userId.toString() },
                { userId: userId.toString() },
            );

            expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
            expect(() => guard.canActivate(context)).toThrow("You can't access this resource");
        });

        it('should work with user._id fallback', () => {
            const context = createMockContext(
                { role: Role.STUDENT, _id: userId.toString() },
                { userId: userId.toString() },
            );

            const result = guard.canActivate(context);

            expect(result).toBe(true);
        });

        it('should work with user.id fallback', () => {
            const context = createMockContext(
                { role: Role.STUDENT, id: userId.toString() },
                { userId: userId.toString() },
            );

            const result = guard.canActivate(context);

            expect(result).toBe(true);
        });
    });
});
