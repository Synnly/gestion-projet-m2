describe('main bootstrap (import)', () => {
    it('should call NestFactory.create and app.listen when main is imported (with mocks)', async () => {
        jest.isolateModules(() => {
            const listenMock = jest.fn().mockResolvedValue(undefined);
            const useMock = jest.fn();
            const enableCorsMock = jest.fn();
            const getMock = jest.fn().mockReturnValue({ run: jest.fn() });
            const createMock = jest.fn().mockResolvedValue({
                use: useMock,
                listen: listenMock,
                enableCors: enableCorsMock,
                get: getMock,
            });

            jest.doMock('@nestjs/core', () => ({ NestFactory: { create: createMock } }));
            jest.doMock('cookie-parser', () => jest.fn());

            const main = require('../../src/main');
            return new Promise((resolve) => setImmediate(resolve)).then(() => {
                expect(createMock).toHaveBeenCalled();
                expect(listenMock).toHaveBeenCalled();
            });
        });
    });
});
