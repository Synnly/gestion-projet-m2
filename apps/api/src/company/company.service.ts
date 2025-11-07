import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCompanyDto } from './dto/createCompany.dto';
import { UpdateCompanyDto } from './dto/updateCompany.dto';
import { Company, CompanyDocument } from './company.schema';

@Injectable()
export class CompanyService {
    constructor(@InjectModel(Company.name) private readonly companyModel: Model<CompanyDocument>) {}

    async findAll(): Promise<Company[]> {
        const companies = await this.companyModel.find({ deletedAt: { $exists: false } }).exec();
        return companies;
    }

    async findOne(id: string): Promise<Company | null> {
        const company = await this.companyModel.findOne({ _id: id, deletedAt: { $exists: false } }).exec();
        return company;
    }

    async create(dto: CreateCompanyDto): Promise<void> {
        await this.companyModel.create({ ...dto });
        return;
    }

    async update(id: string, dto: UpdateCompanyDto): Promise<void> {
        const updated = await this.companyModel
            .findOneAndUpdate(
                { _id: id, deletedAt: { $exists: false } },
                { $set: { ...dto, updatedAt: new Date() } },
                { new: true },
            )
            .exec();
        return;
    }

    async remove(id: string): Promise<void> {
        await this.companyModel.findOneAndDelete({ _id: id, deletedAt: { $exists: false } }).exec();
        return;
    }
}
