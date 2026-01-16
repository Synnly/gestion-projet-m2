import { Controller, Post, Body, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ReportService } from './report.service';
import { CreateReportDto } from './dto/create-report.dto';
import { AuthGuard } from '../../../auth/auth.guard';
import { RolesGuard } from 'src/common/roles/roles.guard';
import { Role } from 'src/common/roles/roles.enum';
import { Roles } from 'src/common/roles/roles.decorator';

/**
 * Controller for handling report-related endpoints.
 */
@Controller('/api/reports')
@UseGuards(AuthGuard)
export class ReportController {
    constructor(private readonly reportService: ReportService) {}

    /**
     * Create a new report for a message.
     * POST /reports
     * @param createReportDto - The report data
     * @param req - The request object containing user information
     * @returns The created report and reported user email
     */
    @Post()
    async createReport(@Body() createReportDto: CreateReportDto, @Request() req: any) {
        const reporterId = req.user.id;
        const result = await this.reportService.createReport(createReportDto, reporterId);
        
        return {
            message: 'Signalement créé avec succès',
            report: result.report,
            reportedUserEmail: result.reportedUserEmail,
        };
    }

    /**
     * Get all reports (admin only).
     * GET /reports
     * @returns All reports
     */
    @Get()
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    async getAllReports() {
        const reports = await this.reportService.getAllReports();
        return {
            message: 'Liste de tous les signalements',
            reports,
        };
    }

    /**
     * Get reports for a specific message.
     * GET /reports/message/:messageId
     * @param messageId - The ID of the message
     * @returns All reports for the message
     */
    @Get('message/:messageId')
    async getReportsByMessage(@Param('messageId') messageId: string) {
        const reports = await this.reportService.getReportsByMessage(messageId);
        return {
            message: 'Signalements pour ce message',
            reports,
        };
    }
}
