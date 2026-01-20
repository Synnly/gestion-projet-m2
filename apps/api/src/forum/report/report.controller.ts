import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
    ValidationPipe,
} from '@nestjs/common';
import type { Request } from 'express';
import { ReportService } from './report.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { AuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../common/roles/roles.guard';
import { Roles } from '../../common/roles/roles.decorator';
import { Role } from '../../common/roles/roles.enum';
import { ParseObjectIdPipe } from '../../validators/parseObjectId.pipe';

@Controller('/api/reports')
export class ReportController {
    constructor(private readonly reportService: ReportService) {}

    /**
     * Create a new report for a message
     * @param createReportDto - The data for creating a report
     * @param req - The request object containing user information
     * @returns The created report
     */
    @Post()
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.CREATED)
    async createReport(
        @Body(ValidationPipe) createReportDto: CreateReportDto,
        @Req() req: Request,
    ) {
        const userId = req.user?.sub;
        if (!userId) throw new BadRequestException('User not authenticated');
        return this.reportService.createReport(createReportDto, userId);
    }

    /**
     * Get all reports with pagination (admin only)
     * @param page - Page number
     * @param limit - Number of items per page
     * @param status - Filter by status (optional)
     * @returns Paginated list of reports
     */
    @Get()
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    async getAllReports(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('status') status?: string,
    ) {
        return this.reportService.getAllReports(page, limit, status);
    }

    /**
     * Get reports created by the current user
     * @param req - The request object containing user information
     * @returns List of reports created by the user
     */
    @Get('my-reports')
    @UseGuards(AuthGuard)
    async getMyReports(@Req() req: Request) {
        const userId = req.user?.sub;
        if (!userId) throw new BadRequestException('User not authenticated');
        return this.reportService.getReportsByReporterId(userId);
    }

    /**
     * Get all reports for a specific message (admin only)
     * @param messageId - The ID of the message
     * @returns List of reports for the message
     */
    @Get('message/:messageId')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    async getReportsByMessageId(@Param('messageId', ParseObjectIdPipe) messageId: string) {
        return this.reportService.getReportsByMessageId(messageId);
    }

    /**
     * Get report statistics (admin only)
     * @returns Object with counts for each status
     */
    @Get('stats/summary')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    async getReportStats() {
        return this.reportService.getReportStats();
    }

    /**
     * Get a specific report by ID (admin only)
     * @param reportId - The ID of the report
     * @returns The report
     */
    @Get(':id')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    async getReportById(@Param('id', ParseObjectIdPipe) reportId: string) {
        return this.reportService.getReportById(reportId);
    }

    /**
     * Update a report's status (admin only)
     * @param reportId - The ID of the report
     * @param updateReportDto - The update data
     * @returns The updated report
     */
    @Patch(':id')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    async updateReportStatus(
        @Param('id', ParseObjectIdPipe) reportId: string,
        @Body(ValidationPipe) updateReportDto: UpdateReportDto,
    ) {
        return this.reportService.updateReportStatus(reportId, updateReportDto);
    }

    /**
     * Delete a report (admin only)
     * @param reportId - The ID of the report
     */
    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteReport(@Param('id', ParseObjectIdPipe) reportId: string) {
        return this.reportService.deleteReport(reportId);
    }
}
