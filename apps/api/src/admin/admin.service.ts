import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Admin, AdminDocument } from './admin.schema';
import { CreateAdminDto } from './dto/createAdminDto';
import { Model } from 'mongoose';

@Injectable()
export class AdminService {
    constructor(@InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>) {}

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
        const createdAdmin = new this.adminModel(dto);
        await createdAdmin.save();
    }
}
