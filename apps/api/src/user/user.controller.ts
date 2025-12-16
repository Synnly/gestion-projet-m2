import {
    Controller,
    Param,
    HttpCode,
    HttpStatus,
    UseGuards,
    Query,
    Post,
    NotFoundException,
} from '@nestjs/common';
import { ParseObjectIdPipe } from '../validators/parseObjectId.pipe';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../common/roles/roles.guard';
import { Roles } from '../common/roles/roles.decorator';
import { Role } from '../common/roles/roles.enum';
import { UserService } from './user.service';

/**
 * Controller for user-related endpoints.
 *
 * Exposes REST endpoints to create, read, update and delete user resources.
 */
@Controller('/api/users')
export class UserController {
    constructor(
        private readonly userService: UserService
    ) {}

    /**
     * Ban a user by id. Requires admin role.
     * @param userId The id of the user to ban.
     * @throws {NotFoundException} When the user does not exist or is already banned or deleted.
     */
    @Post('/:userId/ban')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    async ban(
        @Param('userId', ParseObjectIdPipe) userId: string,
        @Query('reason') reason: string,
    ) {
        const user = await this.userService.findOne(userId);
        if (!user) throw new NotFoundException(`User with id ${userId} not found`);

        await this.userService.ban(userId, reason);
    }
}
