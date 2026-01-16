import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Admin } from './admin.schema';
import { CreateAdminDto } from './dto/createAdminDto';
import { Model } from 'mongoose';
import { Role } from '../common/roles/roles.enum';
import { AdminUserDocument } from '../user/user.schema';
import { Report, ReportDocument } from '../forum/message/report/report.schema';

@Injectable()
export class AdminService {
    constructor(
        @InjectModel(Admin.name) private readonly adminModel: Model<AdminUserDocument>,
        @InjectModel(Report.name) private readonly reportModel: Model<ReportDocument>,
    ) {}

    /**
     * Count the total number of admin records in the database.
     * @returns A promise that resolves to the count of admin documents.
     */
    async count(): Promise<number> {
        return this.adminModel.countDocuments().exec();
    }

    /**
     * Retrieve all admin records from the database.
     * @returns A promise that resolves to an array of Admin documents.
     */
    async findAll(): Promise<Admin[]> {
        return this.adminModel.find().exec();
    }

    /**
     * Retrieve a single admin record by its unique identifier.
     * @param id - The unique identifier of the admin.
     * @returns A promise that resolves to the Admin document, or null if not found.
     */
    async findOne(id: string): Promise<Admin | null> {
        return this.adminModel.findById(id).exec();
    }

    /**
     * Create a new admin record in the database.
     * @param dto - The data transfer object containing admin details.
     * @returns A promise that resolves when the admin is created.
     */
    async create(dto: CreateAdminDto): Promise<void> {
        const createdAdmin = new this.adminModel({ role: Role.ADMIN, ...dto, isValid: true, isVerified: true });
        await createdAdmin.save();
    }

    /**
     * Retrieve all report records from the database.
     * @returns A promise that resolves to an array of Report documents.
     */
    async findAllReports(): Promise<Report[]> {
        return this.reportModel.find().exec();
    }

    /**
     * Create a new report record in the database.
     * @param report - The report data.
     * @returns A promise that resolves to the created Report document.
     */
    async createReport(report: Partial<Report>): Promise<Report> {
        const createdReport = new this.reportModel(report);
        return createdReport.save();
    }
}