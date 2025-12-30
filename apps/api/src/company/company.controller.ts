import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    HttpCode,
    HttpStatus,
    Put,
    NotFoundException,
    ValidationPipe,
    UseGuards,
    ConflictException,
} from '@nestjs/common';
import { CreateCompanyDto } from './dto/createCompany.dto';
import { UpdateCompanyDto } from './dto/updateCompany.dto';
import { CompanyService } from './company.service';
import { CompanyDto } from './dto/company.dto';
import { ParseObjectIdPipe } from '../validators/parseObjectId.pipe';
import { RolesGuard } from '../common/roles/roles.guard';
import { CompanyOwnerGuard } from '../common/roles/companyOwner.guard';
import { Roles } from '../common/roles/roles.decorator';
import { Role } from '../common/roles/roles.enum';
import { AuthGuard } from '../auth/auth.guard';
import { plainToInstance } from 'class-transformer';
import { PostDto } from '../post/dto/post.dto';
import { PostDocument } from '../post/post.schema';
import { Company } from './company.schema';
import { UpdateCompanyPublicProfileDto } from './dto/updateCompanyPublicProfile.dto';
import { CompanyPublicDto } from './dto/publicProfileCompany.dto';

/**
 * Controller handling company-related HTTP requests
 * Provides CRUD operations for company entities
 */
@Controller('/api/companies')
export class CompanyController {
    constructor(private readonly companyService: CompanyService) {}

    /**
     * Retrieves all companies
     * @returns An array of all companies
     */
    @Get('')
    @HttpCode(HttpStatus.OK)
    async findAll(): Promise<CompanyDto[]> {
        const companies = await this.companyService.findAll();

        return companies.map((company) =>
            plainToInstance(CompanyDto, company, {
                excludeExtraneousValues: true,
            }),
        );
    }

    /**
     * Retrieves a single company by its ID
     * @param companyId The company identifier
     * @returns The company with the specified ID
     * @throws {NotFoundException} if no company exists with the given ID
     */
    @Get('/:companyId')
    @HttpCode(HttpStatus.OK)
    async findOne(@Param('companyId', ParseObjectIdPipe) companyId: string): Promise<CompanyDto> {
        const company = await this.companyService.findOne(companyId);
        if (!company) throw new NotFoundException(`Company with id ${companyId} not found`);
        return plainToInstance(CompanyDto, company, {
            excludeExtraneousValues: true,
        });
    }

    /**
     * Creates a new company
     * @param dto The company data for creation
     */
    @Post('')
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
        dto: CreateCompanyDto,
    ) {
        try {
            await this.companyService.create(dto);
        } catch (error) {
            if (error.code === 11000) {
                throw new ConflictException(`Company with email ${dto.email} already exists`);
            } else {
                throw error;
            }
        }
    }

    /**
     * Updates an existing company
     * Requires authentication and COMPANY or ADMIN role
     * @param companyId The company identifier
     * @param dto The updated company data
     */
    @Put('/:companyId')
    @UseGuards(AuthGuard, RolesGuard, CompanyOwnerGuard)
    @Roles(Role.COMPANY, Role.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    async update(
        @Param('companyId', ParseObjectIdPipe) companyId: string,
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
        dto: UpdateCompanyDto | CreateCompanyDto,
    ) {
        await this.companyService.update(companyId, dto);
    }

    /**
     * Deletes a company
     * Requires authentication and COMPANY or ADMIN role
     * @param companyId The company identifier to delete
     */
    @Delete('/:companyId')
    @UseGuards(AuthGuard, RolesGuard, CompanyOwnerGuard)
    @Roles(Role.COMPANY, Role.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('companyId', ParseObjectIdPipe) companyId: string) {
        await this.companyService.remove(companyId);
    }

    /**
     * Maps a Company entity to a CompanyDto with nested PostDtos
     * @param company The company entity to map
     * @returns The mapped CompanyDto
     */
    private mapToDto(company: Company): CompanyDto {
        const posts = company.posts ?? [];
        return new CompanyDto({
            ...company,
            posts: posts.map((post: PostDocument) => new PostDto(post)),
        });
    }

    @Get('/:companyId/public-profile')
    @HttpCode(HttpStatus.OK)
    async getPublicProfile(@Param('companyId', ParseObjectIdPipe) companyId: string): Promise<CompanyPublicDto> {
        return this.companyService.getPublicCompanyById(companyId);
    }

    @Put('/:companyId/public-profile')
    @UseGuards(AuthGuard, RolesGuard, CompanyOwnerGuard)
    @Roles(Role.COMPANY, Role.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    async updatePublicProfile(
        @Param('companyId', ParseObjectIdPipe) companyId: string,
        @Body(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        )
        dto: UpdateCompanyPublicProfileDto,
    ) {
        await this.companyService.updatePublicProfile(companyId, dto);
    }
}
