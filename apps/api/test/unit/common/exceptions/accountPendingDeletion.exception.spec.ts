import { ForbiddenException } from '@nestjs/common';
import { AccountPendingDeletionException } from '../../../../src/common/exceptions/accountPendingDeletion.exception';

describe('AccountPendingDeletionException', () => {
    describe('constructor', () => {
        it('should create exception with correct message when 1 day remaining', () => {
            const userId = '507f1f77bcf86cd799439011';
            const daysRemaining = 1;
            const deletedAt = new Date('2026-02-15');

            const exception = new AccountPendingDeletionException(userId, daysRemaining, deletedAt);

            expect(exception).toBeInstanceOf(ForbiddenException);
            expect(exception.userId).toBe(userId);
            expect(exception.daysRemaining).toBe(daysRemaining);
            expect(exception.deletedAt).toBe(deletedAt);
            expect(exception.message).toContain('1 jour');
            expect(exception.message).not.toContain('1 jours'); // Should not have plural
        });

        it('should create exception with correct message when multiple days remaining', () => {
            const userId = '507f1f77bcf86cd799439011';
            const daysRemaining = 15;
            const deletedAt = new Date('2026-02-01');

            const exception = new AccountPendingDeletionException(userId, daysRemaining, deletedAt);

            expect(exception).toBeInstanceOf(ForbiddenException);
            expect(exception.userId).toBe(userId);
            expect(exception.daysRemaining).toBe(daysRemaining);
            expect(exception.deletedAt).toBe(deletedAt);
            expect(exception.message).toContain('15 jours'); // Should have plural
        });

        it('should create exception with correct message when 0 days remaining', () => {
            const userId = '507f1f77bcf86cd799439011';
            const daysRemaining = 0;
            const deletedAt = new Date('2026-01-17');

            const exception = new AccountPendingDeletionException(userId, daysRemaining, deletedAt);

            expect(exception).toBeInstanceOf(ForbiddenException);
            expect(exception.message).toContain('0 jour');
            expect(exception.message).not.toContain('0 jours'); // Singular for 0
        });

        it('should create exception with correct message when 30 days remaining', () => {
            const userId = '507f1f77bcf86cd799439011';
            const daysRemaining = 30;
            const deletedAt = new Date('2026-01-17');

            const exception = new AccountPendingDeletionException(userId, daysRemaining, deletedAt);

            expect(exception).toBeInstanceOf(ForbiddenException);
            expect(exception.message).toContain('30 jours');
        });

        it('should create exception with correct message when 2 days remaining', () => {
            const userId = '507f1f77bcf86cd799439011';
            const daysRemaining = 2;
            const deletedAt = new Date('2026-02-14');

            const exception = new AccountPendingDeletionException(userId, daysRemaining, deletedAt);

            expect(exception.message).toContain('2 jours'); // Should have plural
        });

        it('should include userId in exception response when getResponse is called', () => {
            const userId = '507f1f77bcf86cd799439011';
            const daysRemaining = 10;
            const deletedAt = new Date('2026-02-06');

            const exception = new AccountPendingDeletionException(userId, daysRemaining, deletedAt);
            const response = exception.getResponse() as any;

            expect(response.userId).toBe(userId);
        });

        it('should include daysRemaining in exception response when getResponse is called', () => {
            const userId = '507f1f77bcf86cd799439011';
            const daysRemaining = 10;
            const deletedAt = new Date('2026-02-06');

            const exception = new AccountPendingDeletionException(userId, daysRemaining, deletedAt);
            const response = exception.getResponse() as any;

            expect(response.daysRemaining).toBe(daysRemaining);
        });

        it('should include deletedAt in exception response when getResponse is called', () => {
            const userId = '507f1f77bcf86cd799439011';
            const daysRemaining = 10;
            const deletedAt = new Date('2026-02-06');

            const exception = new AccountPendingDeletionException(userId, daysRemaining, deletedAt);
            const response = exception.getResponse() as any;

            expect(response.deletedAt).toBe(deletedAt);
        });

        it('should include error code ACCOUNT_PENDING_DELETION in response', () => {
            const userId = '507f1f77bcf86cd799439011';
            const daysRemaining = 10;
            const deletedAt = new Date('2026-02-06');

            const exception = new AccountPendingDeletionException(userId, daysRemaining, deletedAt);
            const response = exception.getResponse() as any;

            expect(response.error).toBe('ACCOUNT_PENDING_DELETION');
        });

        it('should include message about account pending deletion in response', () => {
            const userId = '507f1f77bcf86cd799439011';
            const daysRemaining = 10;
            const deletedAt = new Date('2026-02-06');

            const exception = new AccountPendingDeletionException(userId, daysRemaining, deletedAt);
            const response = exception.getResponse() as any;

            expect(response.message).toContain('en attente de suppression');
            expect(response.message).toContain('définitivement supprimé');
            expect(response.message).toContain('restaurer');
        });

        it('should have HTTP status 403 Forbidden', () => {
            const userId = '507f1f77bcf86cd799439011';
            const daysRemaining = 10;
            const deletedAt = new Date('2026-02-06');

            const exception = new AccountPendingDeletionException(userId, daysRemaining, deletedAt);

            expect(exception.getStatus()).toBe(403);
        });

        it('should store userId as public readonly property', () => {
            const userId = '507f1f77bcf86cd799439011';
            const daysRemaining = 10;
            const deletedAt = new Date('2026-02-06');

            const exception = new AccountPendingDeletionException(userId, daysRemaining, deletedAt);

            expect(exception.userId).toBe(userId);
            // Verify it's accessible as a property
            expect(Object.getOwnPropertyDescriptor(exception, 'userId')).toBeDefined();
        });

        it('should store daysRemaining as public readonly property', () => {
            const userId = '507f1f77bcf86cd799439011';
            const daysRemaining = 10;
            const deletedAt = new Date('2026-02-06');

            const exception = new AccountPendingDeletionException(userId, daysRemaining, deletedAt);

            expect(exception.daysRemaining).toBe(daysRemaining);
            expect(Object.getOwnPropertyDescriptor(exception, 'daysRemaining')).toBeDefined();
        });

        it('should store deletedAt as public readonly property', () => {
            const userId = '507f1f77bcf86cd799439011';
            const daysRemaining = 10;
            const deletedAt = new Date('2026-02-06');

            const exception = new AccountPendingDeletionException(userId, daysRemaining, deletedAt);

            expect(exception.deletedAt).toBe(deletedAt);
            expect(Object.getOwnPropertyDescriptor(exception, 'deletedAt')).toBeDefined();
        });

        it('should correctly handle singular/plural for exactly 1 day', () => {
            const userId = '507f1f77bcf86cd799439011';
            const daysRemaining = 1;
            const deletedAt = new Date('2026-02-15');

            const exception = new AccountPendingDeletionException(userId, daysRemaining, deletedAt);
            const response = exception.getResponse() as any;

            // Should use singular "jour" not "jours"
            expect(response.message).toMatch(/1 jour[^s]/);
        });

        it('should correctly format message with days remaining in the sentence', () => {
            const userId = '507f1f77bcf86cd799439011';
            const daysRemaining = 7;
            const deletedAt = new Date('2026-02-09');

            const exception = new AccountPendingDeletionException(userId, daysRemaining, deletedAt);
            const response = exception.getResponse() as any;

            expect(response.message).toContain(`dans ${daysRemaining} jours`);
        });
    });
});
