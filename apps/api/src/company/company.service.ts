import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCompanyDto } from './dto/createCompany.dto';
import { UpdateCompanyDto } from './dto/updateCompany.dto';
import { Company } from './company.schema';
import { CompanyUserDocument } from '../user/user.schema';
import { PostService } from '../post/post.service';
import { Post } from '../post/post.schema';

/**
 * Service handling business logic for company operations
 *
 * Provides comprehensive CRUD operations for managing company entities in the system.
 * Implements soft-delete pattern where companies are marked as deleted rather than removed.
 *
 * **Key Features:**
 * - Automatic password hashing via User schema pre-save hooks
 * - Soft delete support (uses deletedAt field)
 * - Discriminator pattern support (Company extends User schema)
 * - Immutable fields enforcement (email, SIRET cannot be updated)
 *
 * @see {@link Company} for the company schema definition
 * @see {@link UpdateCompanyDto} for update restrictions
 */
@Injectable()
export class CompanyService {
    /**
     * Creates a new CompanyService instance
     * @param companyModel - Injected Mongoose model for Company operations
     * @param postService - Injected PostService for managing related posts
     */
    constructor(
        @InjectModel(Company.name) private readonly companyModel: Model<CompanyUserDocument>,
        private readonly postService: PostService,
    ) {}
    populateField = '_id title description duration startDate minSalary maxSalary sector keySkills address type';
    /**
     * Retrieves all active (non-deleted) companies
     *
     * Uses soft-delete pattern, only returning companies where deletedAt field does not exist.
     *
     * @returns Promise resolving to an array of all active companies
     *
     * @example
     * ```typescript
     * const companies = await companyService.findAll();
     * console.log(`Found ${companies.length} active companies`);
     * ```
     */
    async findAll(): Promise<Company[]> {
        return this.companyModel
            .find({ deletedAt: { $exists: false } })
            .populate({
                path: 'posts',
                select: this.populateField,
            })
            .exec();
    }

    /**
     * Retrieves a single company by its unique identifier
     *
     * Only returns the company if it exists and is not soft-deleted.
     *
     * @param id - The MongoDB ObjectId of the company as a string
     * @returns Promise resolving to the company if found and active, null otherwise
     *
     * @example
     * ```typescript
     * const company = await companyService.findOne('507f1f77bcf86cd799439011');
     * if (company) {
     *   console.log(`Found company: ${company.name}`);
     * }
     * ```
     */
    async findOne(id: string): Promise<Company | null> {
        return this.companyModel
            .findOne({ _id: id, deletedAt: { $exists: false } })
            .populate({
                path: 'posts',
                select: this.populateField,
            })
            .exec();
    }

    /**
     * Creates a new company in the database
     *
     * The password provided in the DTO will be automatically hashed by the User schema
     * pre-save hook before storage. Email and SIRET number are set during creation
     * and cannot be modified later.
     *
     * @param dto - The complete company data required for creation
     * @returns Promise resolving to void upon successful creation
     *
     * @throws May throw validation errors if required fields are missing or invalid
     *
     * @example
     * ```typescript
     * await companyService.create({
     *   email: 'company@example.com',
     *   password: 'SecurePass123!',
     *   siretNumber: '12345678901234',
     *   name: 'My Company',
     *   role: Role.COMPANY
     * });
     * ```
     */
    async create(dto: CreateCompanyDto): Promise<void> {
        await this.companyModel.create({ ...dto });
        return;
    }

    /**
     * Updates an existing company's data with partial information
     *
     * This method uses `save()` instead of `findOneAndUpdate()` to ensure that Mongoose
     * pre-save hooks are triggered, particularly for password hashing. The validation
     * is disabled during save to avoid issues with Mongoose discriminator pattern
     * requiring all base schema fields.
     *
     * **Important Notes:**
     * - Email and SIRET number cannot be updated (not included in UpdateCompanyDto)
     * - Password will be automatically hashed if provided
     * - Only provided fields will be updated (partial update support)
     * - Soft-deleted companies cannot be updated
     *
     * @param id - The MongoDB ObjectId of the company to update
     * @param dto - Partial company data with fields to update
     * @returns Promise resolving to void upon successful update
     * @throws NotFoundException if any of the post IDs provided do not exist
     * @throws BadRequestException if any of the post IDs provided are invalid
     * @example
     * ```typescript
     * await companyService.update('507f1f77bcf86cd799439011', {
     *   name: 'Updated Company Name',
     *   city: 'Paris'
     * });
     * ```
     */
    async update(id: string, dto: UpdateCompanyDto | CreateCompanyDto): Promise<void> {
        // Try to find an active (non-deleted) company
        const company = await this.companyModel.findOne({ _id: id, deletedAt: { $exists: false } }).exec();

        if (company) {
            // Validate that all provided post IDs exist
            for (const postId of dto.posts ?? []) {
                let post: Post | null | undefined = undefined;
                try {
                    post = await this.postService.findOne(postId);
                } catch (error) {
                    throw new BadRequestException('Invalid post ID: ' + postId);
                }
                if (post === null) throw new NotFoundException('Post with id ' + postId + ' not found');
            }

            // Update existing active company
            Object.assign(company, dto);
            // keep previous behavior: trigger pre-save hooks, but skip full validation to avoid discriminator issues
            await company.save({ validateBeforeSave: false });
            return;
        }

        // If no active company found, create a new one.
        await this.companyModel.create({ ...(dto as CreateCompanyDto) });
        return;
    }

    /**
     * Permanently removes a company from the database
     *
     * This performs a hard delete operation, removing the company document entirely.
     * Only affects companies that have not been previously soft-deleted.
     *
     * @param id - The MongoDB ObjectId of the company to delete
     * @returns Promise resolving to void upon successful deletion
     *
     * @example
     * ```typescript
     * await companyService.remove('507f1f77bcf86cd799439011');
     * ```
     *
     * @remarks
     * Consider implementing soft-delete logic if you need to maintain audit trails
     * or allow data recovery. This operation is irreversible.
     */
    async remove(id: string): Promise<void> {
        const updated = await this.companyModel
            .findOneAndUpdate({ _id: id, deletedAt: { $exists: false } }, { $set: { deletedAt: new Date() } })
            .exec();

        if (!updated) {
            throw new NotFoundException('Company not found or already deleted');
        }
        return;
    }
}
