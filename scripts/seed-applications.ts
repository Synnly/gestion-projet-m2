import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../apps/api/src/app.module';
import { ApplicationService } from '../apps/api/src/application/application.service';

async function main() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const applicationService = app.get(ApplicationService);

    await applicationService.seedApplicationsForStudent('6936ff6c768afff6f2e03a13', [
        '6935b223158c88c41e86d233',
        '6936884f44d057aa5d85865f',
        '6936889844d057aa5d858680',
    ]);

    await app.close();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
