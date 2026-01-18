import { Controller, Get, HttpCode, HttpStatus, UseGuards, Query, ParseIntPipe } from '@nestjs/common';
import { StatsService } from './stats.service';
import { StatsDto } from './dto/stats.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/common/roles/roles.guard';
import { Roles } from 'src/common/roles/roles.decorator';
import { Role } from 'src/common/roles/roles.enum';
import { Post } from 'src/post/post.schema';

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

    /**
     * Retrieves public statistics for the landing page
     * No authentication required
     * @returns An object containing public stats
     */
    @Get('/public')
    @HttpCode(HttpStatus.OK)
    async getPublicStats(): Promise<{ totalPosts: string; totalCompanies: string; totalStudents: string }> {
        return this.statsService.getPublicStats();
    }

    /**
     * Retrieves the latest public posts for the landing page
     * No authentication required
     * @param limit - Number of posts to return (default: 6, max: 20)
     * @returns Array of latest visible posts with company details
     */
    @Get('/public/posts')
    @HttpCode(HttpStatus.OK)
    async getLatestPublicPosts(@Query('limit', new ParseIntPipe({ optional: true })) limit?: number): Promise<Post[]> {
        const validLimit = Math.min(limit || 6, 20);
        return this.statsService.getLatestPublicPosts(validLimit);
    }
}
