import { Controller, Get, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { StatsService } from './stats.service';
import { StatsDto } from './dto/stats.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/common/roles/roles.guard';
import { Roles } from 'src/common/roles/roles.decorator';
import { Role } from 'src/common/roles/roles.enum';

/**
 * Controller handling stats-related HTTP requests
 * Provides endpoints to retrieve system statistics
 */
@Controller('/api/stats')
export class StatsController {
    constructor(private readonly statsService: StatsService) {}

    /**
     * Retrieves all system statistics
     * @returns An object containing various system stats
     */
    @Get('')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.OK)
    async getStats(): Promise<StatsDto> {
        return this.statsService.getStats();
    }
}