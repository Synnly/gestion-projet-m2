import { Controller, Get, HttpCode, HttpStatus, NotFoundException, UseGuards } from '@nestjs/common';
import { ApplicationService } from './application.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../common/roles/roles.guard';
import { Roles } from '../common/roles/roles.decorator';
import { Role } from '../common/roles/roles.enum';
import { Types } from 'mongoose';
import { plainToInstance } from 'class-transformer';
import { ApplicationDto } from './dto/application.dto';
import { ApplicationOwnerGuard } from '../common/roles/applicationOwner.guard';

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
    @Get('/:applicationId')
    @UseGuards(AuthGuard, RolesGuard, ApplicationOwnerGuard)
    @Roles(Role.ADMIN, Role.STUDENT, Role.COMPANY)
    @HttpCode(HttpStatus.OK)
    async findOne(applicationId: Types.ObjectId): Promise<ApplicationDto> {
        const application = this.applicationService.findOne(applicationId);
        if (!application) throw new NotFoundException(`Application with id ${applicationId} not found`);
        return plainToInstance(ApplicationDto, application, { excludeExtraneousValues: true });
    }
}
