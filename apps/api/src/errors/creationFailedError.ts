export class CreationFailedError extends Error {
    constructor(message: string = 'Creation failed') {
        super(message);
        this.name = 'CreationFailedError';
    }
}
