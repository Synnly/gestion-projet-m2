import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    HttpCode,
    HttpStatus,
    Patch,
    NotFoundException,
    ValidationPipe,
    UseGuards,
} from '@nestjs/common';
import { CreateCompanyDto } from './dto/createCompany.dto';
import { UpdateCompanyDto } from './dto/updateCompany.dto';
import { CompanyService } from './company.service';
import { CompanyDto } from './dto/company.dto';
import { ParseObjectIdPipe } from '../../src/validators/parse-objectid.pipe';
import { RolesGuard } from '../../src/common/roles/roles.guard';
import { Roles } from '../../src/common/roles/roles.decorator';
import { Role } from '../../src/common/roles/roles.enum';
import { AuthGuard } from '../../src/common/auth/auth.guard';

@UseGuards(RolesGuard)
@Controller('/api/companies')
export class CompanyController {
    constructor(private readonly companyService: CompanyService){}

    @Get('')
    @HttpCode(HttpStatus.OK)
    async findAll(): Promise<CompanyDto[]> {
        const companies = await this.companyService.findAll();
        return companies.map((company) => new CompanyDto(company));
    }

    @Get('/:id')
    @HttpCode(HttpStatus.OK)
    async findOne(@Param('id', ParseObjectIdPipe) id: string): Promise<CompanyDto> {
        const company = await this.companyService.findOne(id);
        if (!company) throw new NotFoundException(`Company with id ${id} not found`);
        return new CompanyDto(company);
    }

    @Post('')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
        dto: CreateCompanyDto
    ) {
        await this.companyService.create(dto);
    }

    @Patch('/:id')
    @UseGuards(AuthGuard)
    @Roles(Role.COMPANY, Role.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    async update(
        @Param('id', ParseObjectIdPipe) id: string,
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
        dto: UpdateCompanyDto
    ) {
        await this.companyService.update(id, dto);
    }

    @Delete('/:id')
    @UseGuards(AuthGuard)
    @Roles(Role.COMPANY, Role.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id', ParseObjectIdPipe) id: string) {
        await this.companyService.remove(id);
    }
}
