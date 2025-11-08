import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCompanyDto } from './dto/createCompany.dto';
import { UpdateCompanyDto } from './dto/updateCompany.dto';
import { Company, CompanyDocument } from './company.schema';
import * as bcrypt from "bcrypt";

/**
 * Service handling business logic for company operations
 * Manages CRUD operations and data transformations for companies
 */
@Injectable()
export class CompanyService {
    constructor(@InjectModel(Company.name) private readonly companyModel: Model<CompanyDocument>) {}

    /**
     * Retrieves all non-deleted companies
     * @returns An array of all active companies
     */
    async findAll(): Promise<Company[]> {
        const companies = await this.companyModel.find({ deletedAt: { $exists: false } }).exec();
        return companies;
    }

    /**
     * Retrieves a single company by its ID
     * @param id The company identifier
     * @returns The company if found, null otherwise
     */
    async findOne(id: string): Promise<Company | null> {
        const company = await this.companyModel.findOne({ _id: id, deletedAt: { $exists: false } }).exec();
        return company;
    }

    /**
     * Creates a new company with hashed password
     * @param dto The company data for creation
     */
    async create(dto: CreateCompanyDto): Promise<void> {
        dto.password = await bcrypt.hash(dto.password, 10);
        await this.companyModel.create({ ...dto });
        return;
    }

    /**
     * Updates an existing company's data
     * @param id The company identifier
     * @param dto The updated company data
     */
    async update(id: string, dto: UpdateCompanyDto): Promise<void> {
        if (dto.password) {
            dto.password = await bcrypt.hash(dto.password, 10);
        }
        const updated = await this.companyModel
            .findOneAndUpdate(
                { _id: id, deletedAt: { $exists: false } },
                { $set: { ...dto, updatedAt: new Date() } },
                { new: true },
            )
            .exec();
        return;
    }

    /**
     * Deletes a company from the database
     * @param id The company identifier to delete
     */
    async remove(id: string): Promise<void> {
        await this.companyModel.findOneAndDelete({ _id: id, deletedAt: { $exists: false } }).exec();
        return;
    }
}
