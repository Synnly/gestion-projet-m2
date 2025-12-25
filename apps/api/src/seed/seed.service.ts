import { Inject, Injectable } from '@nestjs/common';
import { AdminService } from '../admin/admin.service';
import { CreateAdminDto } from '../admin/dto/createAdminDto';
import { ForumService } from '../forum/forum.service';

@Injectable()
export class SeedService {
    constructor(
        @Inject(AdminService) private adminService: AdminService,
        @Inject(ForumService) private forumService: ForumService,
    ) {}

    /**
     * Run the seed process to initialize the database with default data.
     * Creates a default admin user if none exist and a general forum.
     */
    async run() {
        // Create a default admin if none exist
        if ((await this.adminService.count()) === 0) {
            const password = require('crypto').randomBytes(64).toString('hex');

            await this.adminService.create(new CreateAdminDto({ email: 'admin@admin.admin', password }));

            const fs = require('fs');
            fs.writeFileSync(
                'ADMIN-CREDENTIALS.txt',
                'CHANGE THE DEFAULT PASSWORD AND DELETE THIS FILE AS SOON AS POSSIBLE :\n' + password,
            );
        }

        // Create general forum
        if (!(await this.forumService.findOneByCompanyId())) {
            await this.forumService.create();
        }
    }
}
