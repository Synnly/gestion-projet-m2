import { Injectable, HttpException, HttpStatus, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Admin } from './admin.schema';
import { CreateAdminDto } from './dto/createAdminDto';
import { CreateExportDto } from './dto/createExportDto';
import { Model, Connection } from 'mongoose';
import { Role } from '../common/roles/roles.enum';
import { AdminUserDocument } from '../user/user.schema';
import { DatabaseExport, DatabaseExportDocument, ExportStatus } from './database-export.schema';
import { MailerService } from '../mailer/mailer.service';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';
import * as zlib from 'zlib';

@Injectable()
export class AdminService {
    constructor(
        @InjectModel(Admin.name) private readonly adminModel: Model<AdminUserDocument>,
        @InjectModel(DatabaseExport.name) private readonly exportModel: Model<DatabaseExportDocument>,
        @InjectConnection() private readonly connection: Connection,
        private readonly mailerService: MailerService,
        private readonly configService: ConfigService,
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
     * Initiate a full database export.
     * The export runs asynchronously in the background.
     * @param adminId ID of the admin initiating the export
     * @param dto Export configuration
     * @returns The created export job document
     */
    async initiateExport(adminId: string, dto: CreateExportDto): Promise<DatabaseExportDocument> {
        // Create export record
        const exportJob = new this.exportModel({
            adminId,
            status: ExportStatus.PENDING,
        });
        await exportJob.save();

        // Start export in background (don't await)
        this.performExport(exportJob._id.toString());

        return exportJob;
    }

    /**
     * Perform the actual database export operation.
     * This runs asynchronously and updates the export status.
     * @param exportId ID of the export job
     */
    private async performExport(exportId: string): Promise<void> {
        let exportJob = await this.exportModel.findById(exportId);
        if (!exportJob) {
            throw new NotFoundException(`Export job ${exportId} not found`);
        }

        try {
            // Check if export was cancelled before we started
            if (await this.isExportCancelled(exportJob)) {
                return;
            }

            // Mark export as in progress
            await this.markExportInProgress(exportJob);

            // Export all collections
            const { exportData, totalDocuments, collectionsCount } = await this.exportAllCollections(exportId);

            // Create and save the export file
            const { filename, fileSize } = await this.createExportFile(exportData);

            // Mark export as completed
            await this.markExportCompleted(exportJob, filename, fileSize, collectionsCount, totalDocuments);

            // Send success notification
            await this.sendExportCompletedEmail(exportJob);
        } catch (error) {
            await this.handleExportFailure(exportJob, error);
        }
    }

    /**
     * Check if export has been cancelled
     * @param exportJob The export job to check
     * @returns True if cancelled, false otherwise
     */
    private async isExportCancelled(exportJob: DatabaseExportDocument): Promise<boolean> {
        if (exportJob.status === ExportStatus.CANCELLED) {
            return true;
        }
        return false;
    }

    /**
     * Mark export as in progress
     * @param exportJob The export job to update
     */
    private async markExportInProgress(exportJob: DatabaseExportDocument): Promise<void> {
        exportJob.status = ExportStatus.IN_PROGRESS;
        exportJob.startedAt = new Date();
        await exportJob.save();
    }

    /**
     * Export all database collections
     * @param exportId ID of the export job (for cancellation checks)
     * @returns Export data with statistics
     */
    private async exportAllCollections(
        exportId: string,
    ): Promise<{ exportData: Record<string, any[]>; totalDocuments: number; collectionsCount: number }> {
        if (!this.connection) {
            throw new InternalServerErrorException('Database connection not available');
        }

        if (!this.connection.db) {
            throw new InternalServerErrorException('Database not available');
        }

        const collections = await this.connection.db.listCollections().toArray();
        const exportData: Record<string, any[]> = {};
        let totalDocuments = 0;

        for (const collInfo of collections) {
            const collName = collInfo.name;

            // Check for cancellation before processing each collection
            if (await this.checkCancellationDuringExport(exportId)) {
                throw new HttpException('Export cancelled by user', HttpStatus.CONFLICT);
            }

            // Export collection data
            const documents = await this.exportCollection(collName);
            exportData[collName] = documents;
            totalDocuments += documents.length;
        }

        return {
            exportData,
            totalDocuments,
            collectionsCount: collections.length,
        };
    }

    /**
     * Check if export was cancelled during processing
     * @param exportId ID of the export job
     * @returns True if cancelled, false otherwise
     */
    private async checkCancellationDuringExport(exportId: string): Promise<boolean> {
        const exportJob = await this.exportModel.findById(exportId);
        if (!exportJob || exportJob.status === ExportStatus.CANCELLED) {
            return true;
        }
        return false;
    }

    /**
     * Export all documents from a single collection
     * @param collectionName Name of the collection to export
     * @returns Array of documents
     */
    private async exportCollection(collectionName: string): Promise<any[]> {
        if (!this.connection?.db) {
            throw new InternalServerErrorException('Database connection not available');
        }

        const collection = this.connection.db.collection(collectionName);
        return collection.find({}).toArray();
    }

    /**
     * Create and save the export file
     * @param exportData The data to export
     * @returns Filename and file size
     */
    private async createExportFile(exportData: Record<string, any[]>): Promise<{ filename: string; fileSize: number }> {
        // Convert to JSON
        const jsonString = JSON.stringify(exportData, null, 2);
        const buffer = Buffer.from(jsonString, 'utf-8');

        // Compress
        const compressed = await this.compressData(buffer);

        // Generate filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `database-export-${timestamp}.json.gz`;

        // Save to filesystem
        await this.saveExportFile(filename, compressed);

        return {
            filename,
            fileSize: compressed.length,
        };
    }

    /**
     * Save export file to filesystem
     * @param filename Name of the file
     * @param data File content
     */
    private async saveExportFile(filename: string, data: Buffer): Promise<void> {
        const exportPath = this.getExportPath(filename);
        const fs = require('fs').promises;
        const path = require('path');

        await fs.mkdir(path.dirname(exportPath), { recursive: true });
        await fs.writeFile(exportPath, data);
    }

    /**
     * Mark export as completed and update metadata
     * @param exportJob The export job to update
     * @param filename Name of the export file
     * @param fileSize Size of the export file
     * @param collectionsCount Number of collections exported
     * @param documentsCount Number of documents exported
     */
    private async markExportCompleted(
        exportJob: DatabaseExportDocument,
        filename: string,
        fileSize: number,
        collectionsCount: number,
        documentsCount: number,
    ): Promise<void> {
        exportJob.status = ExportStatus.COMPLETED;
        exportJob.completedAt = new Date();
        exportJob.fileUrl = `/api/admin/export/${exportJob._id}/download`;
        exportJob.fileKey = filename;
        exportJob.fileSize = fileSize;
        exportJob.collectionsCount = collectionsCount;
        exportJob.documentsCount = documentsCount;
        await exportJob.save();
    }

    /**
     * Handle export failure
     * @param exportJob The export job that failed
     * @param error The error that occurred
     */
    private async handleExportFailure(exportJob: DatabaseExportDocument, error: any): Promise<void> {
        if (!exportJob) return;

        exportJob.status = ExportStatus.FAILED;
        exportJob.completedAt = new Date();
        exportJob.errorMessage = error.message;
        await exportJob.save();

        // Send failure email
        await this.sendExportFailedEmail(exportJob, error.message);
    }

    /**
     * Compress data using gzip
     * @param data Buffer to compress
     * @returns Compressed buffer
     */
    private compressData(data: Buffer): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            zlib.gzip(data, (error, result) => {
                if (error) reject(error);
                else resolve(result);
            });
        });
    }

    /**
     * Get the filesystem path for an export file
     * @param filename Name of the export file
     * @returns Full path to the export file
     */
    private getExportPath(filename: string): string {
        const exportDir = this.configService.get<string>('EXPORT_DIR') || './exports';
        return require('path').join(exportDir, filename);
    }

    /**
     * Send email notification when export is completed
     * @param exportJob The completed export job
     */
    private async sendExportCompletedEmail(exportJob: DatabaseExportDocument): Promise<void> {
        try {
            const admin = await this.adminModel.findById(exportJob.adminId);
            if (!admin || !admin.email) {
                return;
            }

            const downloadUrl = `${this.configService.get<string>('FRONTEND_URL')}/admin/exports/${exportJob._id}`;
            const { from, name } = this.getFromAddress();

            await this.mailerService['mailerProvider'].sendMail({
                to: admin.email,
                subject: 'Database Export Completed',
                template: 'exportCompleted',
                from,
                context: {
                    fromName: name,
                    exportId: exportJob._id.toString(),
                    downloadUrl,
                    fileSize: this.formatFileSize(exportJob.fileSize || 0),
                    collectionsCount: exportJob.collectionsCount,
                    documentsCount: exportJob.documentsCount,
                    completedAt: exportJob.completedAt?.toISOString(),
                },
            });
        } catch (error) {}
    }

    /**
     * Send email notification when export fails
     * @param exportJob The failed export job
     * @param errorMessage The error message
     */
    private async sendExportFailedEmail(exportJob: DatabaseExportDocument, errorMessage: string): Promise<void> {
        try {
            const admin = await this.adminModel.findById(exportJob.adminId);
            if (!admin || !admin.email) {
                return;
            }

            const { from, name } = this.getFromAddress();

            await this.mailerService['mailerProvider'].sendMail({
                to: admin.email,
                subject: 'Database Export Failed',
                template: 'exportFailed',
                from,
                context: {
                    fromName: name,
                    exportId: exportJob._id.toString(),
                    errorMessage,
                },
            });
        } catch (error) {}
    }

    /**
     * Get the configured "from" email address
     */
    private getFromAddress(): { name: string; email: string; from: string } {
        const name = this.configService.get<string>('MAIL_FROM_NAME') || 'Stagora';
        const email = this.configService.get<string>('MAIL_FROM_EMAIL') || 'noreply@stagora.com';
        return {
            name,
            email,
            from: `"${name}" <${email}>`,
        };
    }

    /**
     * Format file size in human-readable format
     * @param bytes File size in bytes
     * @returns Formatted string (e.g., "2.5 MB")
     */
    private formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Get the status of an export job
     * @param exportId ID of the export
     * @returns Export job document or null
     */
    async getExportStatus(exportId: string): Promise<DatabaseExportDocument | null> {
        return this.exportModel.findById(exportId).exec();
    }

    /**
     * Get all exports for a specific admin
     * @param adminId ID of the admin
     * @returns List of export jobs
     */
    async getExportsByAdmin(adminId: string): Promise<DatabaseExportDocument[]> {
        return this.exportModel.find({ adminId }).sort({ createdAt: -1 }).exec();
    }

    /**
     * Cancel an ongoing export operation
     * @param exportId ID of the export to cancel
     * @returns True if cancelled, false otherwise
     */
    async cancelExport(exportId: string): Promise<boolean> {
        const exportJob = await this.exportModel.findById(exportId);

        if (!exportJob) {
            return false;
        }

        // Can only cancel pending or in-progress exports
        if (exportJob.status !== ExportStatus.PENDING && exportJob.status !== ExportStatus.IN_PROGRESS) {
            return false;
        }

        exportJob.status = ExportStatus.CANCELLED;
        exportJob.completedAt = new Date();
        await exportJob.save();

        return true;
    }

    /**
     * Download a completed export file
     * @param exportId ID of the export
     * @returns Stream, filename, and mime type
     */
    async downloadExport(exportId: string): Promise<{ stream: Readable; filename: string; mimeType: string }> {
        const exportJob = await this.exportModel.findById(exportId);

        if (!exportJob) {
            throw new HttpException('Export not found', HttpStatus.NOT_FOUND);
        }

        if (exportJob.status !== ExportStatus.COMPLETED) {
            throw new HttpException('Export is not completed', HttpStatus.BAD_REQUEST);
        }

        if (!exportJob.fileKey) {
            throw new HttpException('Export file not found', HttpStatus.NOT_FOUND);
        }

        const filePath = this.getExportPath(exportJob.fileKey);
        const fs = require('fs');

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            throw new HttpException('Export file not found on disk', HttpStatus.NOT_FOUND);
        }

        const stream = fs.createReadStream(filePath);

        return {
            stream,
            filename: exportJob.fileKey,
            mimeType: 'application/gzip',
        };
    }
}
