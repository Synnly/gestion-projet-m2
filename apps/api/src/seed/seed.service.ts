import { Inject, Injectable } from '@nestjs/common';
import { AdminService } from '../admin/admin.service';
import { CreateAdminDto } from '../admin/dto/createAdminDto';
import { ForumService } from '../forum/forum.service';
import * as fs from 'fs';
import { randomBytes } from 'node:crypto';

@Injectable()
export class SeedService {
    constructor(
        private adminService: AdminService,
        private forumService: ForumService,
    ) {}

    /**
     * Run the seed process to initialize the database with default data.
     * Creates a default admin user if none exist and a general forum.
     * If the default admin is created, their credentials are saved to 'ADMIN-CREDENTIALS.txt'.
     * If the file cannot be written, an error is logged and the admin is not created.
     */
    async run() {
        // Create a default admin if none exist
        if ((await this.adminService.count()) === 0) {
            const password = randomBytes(64).toString('hex');

            try {
                fs.writeFileSync(
                    'ADMIN-CREDENTIALS.txt',
                    'CHANGE THE DEFAULT PASSWORD AND DELETE THIS FILE AS SOON AS POSSIBLE :\n' + password,
                );

                await this.adminService.create(new CreateAdminDto({ email: 'admin@admin.admin', password }));
            } catch (error) {
                console.error(
                    'Failed to write ADMIN-CREDENTIALS.txt file during seeding:',
                    error,
                    '. Default admin not created.',
                );
            }
        }

        // Create general forum
        if (!(await this.forumService.findOneByCompanyId())) {
            await this.forumService.create();
        }
    }
}
