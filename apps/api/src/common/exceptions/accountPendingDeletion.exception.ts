import { ForbiddenException } from '@nestjs/common';

/**
 * Exception thrown when user tries to login to an account pending deletion.
 * The account can be restored if the deletion was within the last 30 days.
 */
export class AccountPendingDeletionException extends ForbiddenException {
    constructor(
        public readonly userId: string,
        public readonly daysRemaining: number,
        public readonly deletedAt: Date,
    ) {
        super({
            message: `Votre compte est en attente de suppression. Il sera définitivement supprimé dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}. Vous pouvez le restaurer en cliquant sur le bouton ci-dessous.`,
            error: 'ACCOUNT_PENDING_DELETION',
            userId,
            daysRemaining,
            deletedAt,
        });
    }
}
