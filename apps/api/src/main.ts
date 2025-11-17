import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
<<<<<<< HEAD
    app.enableCors({
        origin: 'http://localhost:5173',
        credentials: true,
    });

=======
>>>>>>> dev
    app.use(cookieParser());
    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
