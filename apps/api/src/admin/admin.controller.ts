import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Report } from '../forum/message/report/report.schema';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../common/roles/roles.guard';
import { Roles } from '../common/roles/roles.decorator';
import { Role } from '../common/roles/roles.enum';

@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    @Get('reports')
    async findAllReports(): Promise<Report[]> {
        return this.adminService.findAllReports();
    }

    @Post('reports')
    async createReport(@Body() report: Partial<Report>): Promise<Report> {
        return this.adminService.createReport(report);
    }
}