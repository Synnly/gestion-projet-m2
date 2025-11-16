import { InternalServerErrorException } from '@nestjs/common';

/**
 * Exception thrown when the application configuration is invalid.
 */
export class InvalidConfigurationException extends InternalServerErrorException {
    constructor(message = 'The application configuration is invalid.') {
        super({ message, error: 'CONFIGURATION_ERROR' });
    }
}
