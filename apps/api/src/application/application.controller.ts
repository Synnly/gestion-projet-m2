import {
    Body,
    Controller,
    DefaultValuePipe,
    Get,
    HttpCode,
    HttpStatus,
    NotFoundException,
    Param,
    ParseEnumPipe,
    ParseIntPipe,
    Post,
    Put,
    Query,
    Req,
    UseGuards,
    ValidationPipe,
} from '@nestjs/common';
import { ApplicationService } from './application.service';
import { S3Service } from '../s3/s3.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../common/roles/roles.guard';
import { Roles } from '../common/roles/roles.decorator';
import { Role } from '../common/roles/roles.enum';
import { Types } from 'mongoose';
import { plainToInstance } from 'class-transformer';
import { ApplicationDto, ApplicationPaginationDto } from './dto/application.dto';
import { ApplicationOwnerGuard } from '../common/roles/applicationOwner.guard';
import { CreateApplicationDto } from './dto/createApplication.dto';
import { ParseObjectIdPipe } from '../validators/parseObjectId.pipe';
import { ApplicationStatus } from './application.schema';
import { PostOwnerGuard } from 'src/post/guard/IsPostOwnerGuard';
import { StudentOwnerGuard } from '../common/roles/studentOwner.guard';
import type { Request } from 'express';

@Controller('/api/application')
export class ApplicationController {
    constructor(
        private readonly applicationService: ApplicationService,
        private readonly s3Service: S3Service,
    ) {}

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
    @Param studentId The id of the student applying.
    * @param postId The id of the post to which the student is applying.
    * @returns boolean if an application exists for the given student and post.
    * @throws NotFoundException if no application exists for the given student and post.
    **/
    @Get('check')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.STUDENT)
    @HttpCode(HttpStatus.OK)
    async getApplicationByStudentAndPost(
        @Query('studentId', ParseObjectIdPipe) studentId: Types.ObjectId,
        @Query('postId', ParseObjectIdPipe) postId: Types.ObjectId,
    ): Promise<ApplicationDto | null> {
        const application = await this.applicationService.getApplicationByStudentAndPost(studentId, postId);

        return plainToInstance(ApplicationDto, application, { excludeExtraneousValues: true });
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
    async findOne(@Param('applicationId', ParseObjectIdPipe) applicationId: Types.ObjectId): Promise<ApplicationDto> {
        const application = await this.applicationService.findOne(applicationId);
        if (!application) throw new NotFoundException(`Application with id ${applicationId.toString()} not found`);
        return plainToInstance(ApplicationDto, application, { excludeExtraneousValues: true });
    }

    /**
     * Return a presigned download URL for a document attached to an application.
     * Supported document types: `cv`, `lm` (lettre de motivation). Accessible by
     * ADMIN, the STUDENT who owns the application, or the COMPANY owning the post
     * related to the application (checked by `ApplicationOwnerGuard`).
     *
     * Behaviour: select the appropriate application field according to the
     * provided `fileType` and generate a presigned URL via `S3Service`.
     */

    @Get(':applicationId/file/:fileType')
    @UseGuards(AuthGuard, RolesGuard, ApplicationOwnerGuard)
    @Roles(Role.ADMIN, Role.STUDENT, Role.COMPANY)
    @HttpCode(HttpStatus.OK)
    async getApplicationFile(
        @Param('applicationId', ParseObjectIdPipe) ApplicationDto: Types.ObjectId,
        @Param('fileType') fileType: string,
        @Req() req: Request,
    ): Promise<{ downloadUrl: string }> {
        const application = await this.applicationService.findOne(ApplicationDto);
        if (!application) throw new NotFoundException(`Application with id ${ApplicationDto} not found`);

        let path: string | undefined;
        if (fileType === 'cv') path = application.cv;
        else if (fileType === 'lm') path = application.coverLetter as string | undefined;

        if (!path) throw new NotFoundException(`${fileType} not found for this application`);

        return await this.s3Service.generatePresignedDownloadUrl(
            path,
            req.user?.sub!,
            req.user?.role!,
            application.post._id.toString(),
        );
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
        @Body('studentId', ParseObjectIdPipe) studentId: Types.ObjectId,
        @Body('postId', ParseObjectIdPipe) postId: Types.ObjectId,
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) application: CreateApplicationDto,
    ): Promise<{ cvUrl: string; lmUrl?: string }> {
        return this.applicationService.create(studentId, postId, application);
    }

    /**
     * Return paginated applications for a given student id.
     * @param studentId The student identifier whose applications are requested.
     * @param page The page number (1-based).
     * @param limit The number of items per page (capped server-side).
     * @returns Paginated applications with pagination metadata.
     */
    @Get('student/:studentId')
    @UseGuards(AuthGuard, RolesGuard, StudentOwnerGuard)
    @Roles(Role.ADMIN, Role.STUDENT)
    @HttpCode(HttpStatus.OK)
    async findMine(
        @Param('studentId', ParseObjectIdPipe) studentId: Types.ObjectId,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
        @Query('status', new ParseEnumPipe(ApplicationStatus, { optional: true })) status?: ApplicationStatus,
        @Query('searchQuery') searchQuery?: string,
    ): Promise<ApplicationPaginationDto> {
        const {
            data,
            total,
            limit: appliedLimit,
            page: appliedPage,
        } = await this.applicationService.findByStudent(studentId, page, limit, status, searchQuery);

        return plainToInstance(
            ApplicationPaginationDto,
            {
                data: data.map((application) =>
                    plainToInstance(ApplicationDto, application, { excludeExtraneousValues: true }),
                ),
                page: appliedPage,
                limit: appliedLimit,
                total,
            },
            { excludeExtraneousValues: true },
        );
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
        @Body('status', new ParseEnumPipe(ApplicationStatus)) status: ApplicationStatus,
    ): Promise<void> {
        await this.applicationService.updateStatus(applicationId, status);
    }

    /**
     * Return a list of the applications for a company's post
     * @param postId The id of the post
     * @param query Pagination parameters (page, limit)
     * @returns A paginated list of applications for the specified post
     */
    @Get('/post/:postId')
    @UseGuards(AuthGuard, RolesGuard, PostOwnerGuard)
    @Roles(Role.ADMIN, Role.COMPANY)
    @HttpCode(HttpStatus.OK)
    async findByPostPaginated(
        @Param('postId', ParseObjectIdPipe) postId: Types.ObjectId,
        @Query() query: ApplicationPaginationDto,
    ): Promise<{
        data: ApplicationDto[];
        total: number;
        totalPages: number;
        page: number;
        hasNext: boolean;
        hasPrev: boolean;
    }> {
        const result = await this.applicationService.findByPostPaginated(postId, query);

        return {
            data: result.data.map((app) => plainToInstance(ApplicationDto, app, { excludeExtraneousValues: true })),
            total: result.total,
            totalPages: result.totalPages,
            page: result.page,
            hasNext: result.hasNext,
            hasPrev: result.hasPrev,
        };
    }
}
