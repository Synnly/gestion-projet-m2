import { UnauthorizedException } from '@nestjs/common';

/**
 * Exception thrown when user credentials are invalid.
 */
export class InvalidCredentialsException extends UnauthorizedException {
    constructor(message = 'Invalid credentials') {
        super({ message, error: 'INVALID_CREDENTIALS' });
    }
}
