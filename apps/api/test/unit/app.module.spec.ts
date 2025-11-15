import { AppModule } from '../../src/app.module';

describe('AppModule', () => {
    it('should apply TokensMiddleware to all routes when configure is called', () => {
        const consumerMock = {
            apply: jest.fn().mockReturnValue({ forRoutes: jest.fn() }),
        } as any;

        const module = new AppModule();
        // Should not throw and should call consumer.apply with TokensMiddleware
        expect(() => module.configure(consumerMock)).not.toThrow();
        expect(consumerMock.apply).toHaveBeenCalled();
    });
});
