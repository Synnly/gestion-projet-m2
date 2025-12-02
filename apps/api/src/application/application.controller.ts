import { Controller, Get, HttpCode, HttpStatus, NotFoundException, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApplicationService } from './application.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../common/roles/roles.guard';
import { Roles } from '../common/roles/roles.decorator';
import { Role } from '../common/roles/roles.enum';
import { Types } from 'mongoose';
import { plainToInstance } from 'class-transformer';
import { ApplicationDto } from './dto/application.dto';
import { ApplicationOwnerGuard } from '../common/roles/applicationOwner.guard';
import { CreateApplicationDto } from './dto/createApplication.dto';
import { ParseObjectIdPipe } from '../validators/parseObjectId.pipe';
import { ApplicationStatus } from './application.schema';

@Controller('/api/application')
export class ApplicationController {
    constructor(private readonly applicationService: ApplicationService) {}

    /**
     * Return a list of all applications.
     * Accessible only by ADMIN users.
     * @returns An array of all applications.
     */
    @Get('')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.OK)
    async findAll(): Promise<ApplicationDto[]> {
        const applications = await this.applicationService.findAll();
        return applications.map((application) =>
            plainToInstance(ApplicationDto, application, { excludeExtraneousValues: true }),
        );
    }

    /**
     * Return a single application by id.
     * Accessible by ADMIN, or by the STUDENT or COMPANY who owns the application.
     * @param applicationId The id of the application to retrieve.
     * @returns The application with the specified id.
     * @throws NotFoundException if no application exists with the given id.
     */
    @Get(':applicationId')
    @UseGuards(AuthGuard, RolesGuard, ApplicationOwnerGuard)
    @Roles(Role.ADMIN, Role.STUDENT, Role.COMPANY)
    @HttpCode(HttpStatus.OK)
    async findOne(applicationId: Types.ObjectId): Promise<ApplicationDto> {
        const application = this.applicationService.findOne(applicationId);
        if (!application) throw new NotFoundException(`Application with id ${applicationId} not found`);
        return plainToInstance(ApplicationDto, application, { excludeExtraneousValues: true });
    }

    /**
     * Create a new application for a specific student and post.
     * @param studentId The id of the student applying.
     * @param postId The id of the post to which the student is applying.
     * @param application The application data including CV and optional cover letter.
     * @returns An object containing presigned URLs for uploading the CV and cover letter.
     */
    @Post()
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.STUDENT)
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Param('studentId', ParseObjectIdPipe) studentId: Types.ObjectId,
        @Param('postId', ParseObjectIdPipe) postId: Types.ObjectId,
        application: CreateApplicationDto,
    ): Promise<{ cvUrl: string; coverLetterUrl?: string }> {
        return this.applicationService.create(studentId, postId, application);
    }

    /**
     * Update the status of an application.
     * @param applicationId The id of the application to update.
     * @param status The new status to set for the application. Must be one of the values defined in ApplicationStatus enum.
     * @returns A promise that resolves when the status has been updated.
     */
    @Put(':applicationId')
    @UseGuards(AuthGuard, RolesGuard, ApplicationOwnerGuard)
    @Roles(Role.ADMIN, Role.COMPANY)
    @HttpCode(HttpStatus.OK)
    async updateStatus(
        @Param('applicationId', ParseObjectIdPipe) applicationId: Types.ObjectId,
        status: ApplicationStatus,
    ): Promise<void> {
        await this.applicationService.updateStatus(applicationId, status);
    }
}
