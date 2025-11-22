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
} from '@nestjs/common';
import { CreateCompanyDto } from './dto/createCompany.dto';
import { UpdateCompanyDto } from './dto/updateCompany.dto';
import { CompanyService } from './company.service';
import { PostService } from '../post/post.service';
import { CompanyDto } from './dto/company.dto';
import { ParseObjectIdPipe } from '../validators/parseObjectId.pipe';
import { RolesGuard } from '../common/roles/roles.guard';
import { CompanyOwnerGuard } from './companyOwner.guard';
import { Roles } from '../common/roles/roles.decorator';
import { Role } from '../common/roles/roles.enum';
import { AuthGuard } from '../auth/auth.guard';
import { PostDto } from 'src/post/dto/post.dto';

/**
 * Controller handling company-related HTTP requests
 * Provides CRUD operations for company entities
 */
@Controller('/api/companies')
export class CompanyController {
    constructor(
        private readonly companyService: CompanyService,
        private readonly postService: PostService
    ) {}

    /**
     * Retrieves all companies
     * @returns An array of all companies
     */
    @Get('')
    @HttpCode(HttpStatus.OK)
    async findAll(): Promise<CompanyDto[]> {
        const companies = await this.companyService.findAll();
        return companies.map((company) => new CompanyDto(company));
    }

    
    /**
     * Retrieves all posts made by the company
     * @returns An array of all the posts of a company
     */
    @Get('/:id/posts')
    @HttpCode(HttpStatus.OK)
    async findAllPosts(@Param('id', ParseObjectIdPipe) id: string): Promise<PostDto[]> {
        const posts = await this.postService.findAllByCompany(id);
        return posts.map((post) => new PostDto(post));
    }

    /**
     * Retrieves a single company by its ID
     * @param id The company identifier
     * @returns The company with the specified ID
     * @throws {NotFoundException} if no company exists with the given ID
     */
    @Get('/:id')
    @HttpCode(HttpStatus.OK)
    async findOne(@Param('id', ParseObjectIdPipe) id: string): Promise<CompanyDto> {
        const company = await this.companyService.findOne(id);
        if (!company) throw new NotFoundException(`Company with id ${id} not found`);
        return new CompanyDto(company);
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
        await this.companyService.create(dto);
    }

    /**
     * Updates an existing company
     * Requires authentication and COMPANY or ADMIN role
     * @param id The company identifier
     * @param dto The updated company data
     */
    @Put('/:id')
    @UseGuards(AuthGuard, RolesGuard, CompanyOwnerGuard)
    @Roles(Role.COMPANY, Role.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    async update(
        @Param('id', ParseObjectIdPipe) id: string,
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
        dto: UpdateCompanyDto | CreateCompanyDto,
    ) {
        await this.companyService.update(id, dto);
    }

    /**
     * Deletes a company
     * Requires authentication and COMPANY or ADMIN role
     * @param id The company identifier to delete
     */
    @Delete('/:id')
    @UseGuards(AuthGuard, RolesGuard, CompanyOwnerGuard)
    @Roles(Role.COMPANY, Role.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id', ParseObjectIdPipe) id: string) {
        await this.companyService.remove(id);
    }
}
