import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { SeedService } from './seed/seed.service';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const seedService = app.get(SeedService);
    try {
        await seedService.run();
    } catch (error) {
        console.error('Seeding failed during bootstrap:', error);
    }

    app.enableCors({
        origin: `${process.env.FRONTEND_URL || 'http://localhost:5173'}`,
        credentials: true,
    });
    app.use(cookieParser());
    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
