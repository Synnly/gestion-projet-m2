import { Inject, Injectable } from '@nestjs/common';
import { AdminService } from '../admin/admin.service';
import { CreateAdminDto } from '../admin/dto/createAdminDto';

@Injectable()
export class SeedService {
    constructor(@Inject(AdminService) private adminService: AdminService) {}

    async run() {
        // Create a default admin if none exist
        console.debug(await this.adminService.findAll());
        if ((await this.adminService.count()) === 0) {
            const password = require('crypto').randomBytes(64).toString('hex');

            await this.adminService.create(new CreateAdminDto({ email: 'admin@admin.admin', password }));

            const fs = require('fs');
            fs.writeFileSync(
                'ADMIN-CREDENTIALS.txt',
                'CHANGE THE DEFAULT PASSWORD AND DELETE THIS FILE AS SOON AS POSSIBLE :\n' + password,
            );
        }
    }
}
