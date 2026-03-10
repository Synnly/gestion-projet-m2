import { Injectable, HttpException, HttpStatus, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Admin } from './admin.schema';
import { CreateAdminDto } from './dto/createAdminDto';
import { CreateExportDto } from './dto/createExportDto';
import { CreateImportDto } from './dto/createImportDto';
import { Model, Connection, Types } from 'mongoose';
import { Role } from '../common/roles/roles.enum';
import { AdminUserDocument } from '../user/user.schema';
import { DatabaseExport, DatabaseExportDocument, ExportStatus } from './database-export.schema';
import { DatabaseImport, DatabaseImportDocument, ImportStatus } from './database-import.schema';
import { MailerService } from '../mailer/mailer.service';
import { ConfigService } from '@nestjs/config';
import { Readable, Transform, pipeline } from 'stream';
import * as zlib from 'zlib';
import { createWriteStream, createReadStream } from 'fs';
import { promisify } from 'util';

const pipelineAsync = promisify(pipeline);

type JobDocument = DatabaseExportDocument | DatabaseImportDocument;
type JobStatus = ExportStatus | ImportStatus;
type JobModel = Model<DatabaseExportDocument> | Model<DatabaseImportDocument>;

@Injectable()
export class AdminService {
    constructor(
        @InjectModel(Admin.name) private readonly adminModel: Model<AdminUserDocument>,
        @InjectModel(DatabaseExport.name) private readonly exportModel: Model<DatabaseExportDocument>,
        @InjectModel(DatabaseImport.name) private readonly importModel: Model<DatabaseImportDocument>,
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
            // Export job no longer exists (might have been cancelled or deleted)
            // This is not an error - just exit gracefully
            return;
        }

        try {
            // Check if export was cancelled before we started
            if (this.isJobCancelled(exportJob)) {
                return;
            }

            // Mark export as in progress
            await this.markJobInProgress(exportJob);

            // Export all collections with streaming
            const { filename, fileSize, totalDocuments, collectionsCount } =
                await this.exportAllCollectionsStreaming(exportId);

            // Mark export as completed
            await this.markExportCompleted(exportJob, filename, fileSize, collectionsCount, totalDocuments);

            // Send success notification
            await this.sendExportCompletedEmail(exportJob);
        } catch (error) {
            await this.handleJobFailure(exportJob, error, this.sendExportFailedEmail.bind(this));
        }
    }

    /**
     * Check if a job (export or import) has been cancelled
     * @param job The job to check
     * @returns True if cancelled, false otherwise
     */
    private isJobCancelled(job: JobDocument): boolean {
        return job.status === ExportStatus.CANCELLED || job.status === ImportStatus.CANCELLED;
    }

    /**
     * Mark a job (export or import) as in progress
     * @param job The job to update
     */
    private async markJobInProgress(job: JobDocument): Promise<void> {
        job.status = ExportStatus.IN_PROGRESS as any;
        job.startedAt = new Date();
        try {
            await job.save();
        } catch (error) {
            // Job might have been deleted - exit gracefully
            return;
        }
    }

    /**
     * Export all database collections using streaming to avoid memory issues
     * @param exportId ID of the export job (for cancellation checks)
     * @returns Export metadata with statistics
     */
    private async exportAllCollectionsStreaming(
        exportId: string,
    ): Promise<{ filename: string; fileSize: number; totalDocuments: number; collectionsCount: number }> {
        if (!this.connection || !this.connection.db) {
            throw new InternalServerErrorException('Database connection not available');
        }

        const collections = await this.connection.db.listCollections().toArray();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `database-export-${timestamp}.json.gz`;
        const exportPath = this.getExportPath(filename);

        // Ensure export directory exists
        const fs = require('fs').promises;
        const path = require('path');
        await fs.mkdir(path.dirname(exportPath), { recursive: true });

        let totalDocuments = 0;
        let isFirstCollection = true;

        // Create streaming pipeline
        const writeStream = createWriteStream(exportPath);
        const gzipStream = zlib.createGzip();
        gzipStream.pipe(writeStream);

        // Start JSON object
        gzipStream.write('{\n');

        for (const collInfo of collections) {
            //ignore refreshToken collection
            if (collInfo.name === 'refreshtokens') {
                continue;
            }
            const collName = collInfo.name;

            // Check for cancellation
            if (await this.checkCancellationDuringOperation(exportId, this.exportModel, ExportStatus.CANCELLED)) {
                gzipStream.end();
                writeStream.end();
                throw new HttpException('Export cancelled by user', HttpStatus.CONFLICT);
            }

            // Add comma between collections
            if (!isFirstCollection) {
                gzipStream.write(',\n');
            }
            isFirstCollection = false;

            // Write collection name
            gzipStream.write(`  "${collName}": [\n`);

            // Stream documents from collection
            const cursor = this.connection.db.collection(collName).find({});
            let isFirstDoc = true;

            for await (const doc of cursor) {
                if (!isFirstDoc) {
                    gzipStream.write(',\n');
                }
                isFirstDoc = false;

                // Write document as JSON with ObjectIds converted to Extended JSON format
                const convertedDoc = this.convertToExtendedJSON(doc);
                gzipStream.write('    ' + JSON.stringify(convertedDoc));
                totalDocuments++;
            }

            // Close collection array
            gzipStream.write('\n  ]');
        }

        // Close JSON object
        gzipStream.write('\n}\n');
        gzipStream.end();

        // Wait for stream to finish
        await new Promise<void>((resolve, reject) => {
            writeStream.on('finish', () => resolve());
            writeStream.on('error', reject);
        });

        // Get file size
        const stats = await fs.stat(exportPath);

        return {
            filename,
            fileSize: stats.size,
            totalDocuments,
            collectionsCount: collections.length,
        };
    }

    /**
     * Check if a job was cancelled during execution
     * @param jobId ID of the job
     * @param model The model to query (export or import)
     * @param cancelledStatus The status value indicating cancellation
     * @returns True if cancelled, false otherwise
     */
    private async checkCancellationDuringOperation<T extends JobDocument>(
        jobId: string,
        model: Model<T>,
        cancelledStatus: JobStatus,
    ): Promise<boolean> {
        const job = await model.findById(jobId);
        return job?.status === cancelledStatus;
    }

    /**
     * Get the filesystem path for an export file
     * @param filename Name of the export file
     * @returns Full filesystem path
     */
    private getExportPath(filename: string): string {
        const path = require('path');
        const exportsDir = this.configService.get<string>('EXPORTS_DIR') || './exports';
        return path.join(exportsDir, filename);
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
        try {
            await exportJob.save();
        } catch (error) {
            // Export might have been deleted - exit gracefully
            return;
        }
    }

    /**
     * Handle job failure (export or import)
     * @param job The job that failed
     * @param error The error that occurred
     * @param sendEmailFn Function to send failure notification email
     */
    private async handleJobFailure(
        job: JobDocument | null,
        error: any,
        sendEmailFn: (job: JobDocument, errorMessage: string) => Promise<void>,
    ): Promise<void> {
        if (!job) return;

        job.status = ExportStatus.FAILED as any;
        job.completedAt = new Date();
        job.errorMessage = error.message;
        try {
            await job.save();
        } catch (saveError) {
            // Job might have been deleted - exit gracefully
            return;
        }

        // Send failure email
        await sendEmailFn(job, error.message);
    }

    /**
     * Send email notification when export is completed
     * @param exportJob The completed export job
     */
    private async sendExportCompletedEmail(exportJob: DatabaseExportDocument): Promise<void> {
        try {
            const adminEmail = await this.getAdminEmail(exportJob.adminId.toString());
            if (!adminEmail) {
                return;
            }

            const { from, name } = this.getFromAddress();

            await this.mailerService['mailerProvider'].sendMail({
                to: adminEmail,
                subject: 'Database Export Completed',
                template: 'exportCompleted',
                from,
                context: {
                    fromName: name,
                    exportId: exportJob._id.toString(),
                    fileSize: this.formatFileSize(exportJob.fileSize || 0),
                    collectionsCount: exportJob.collectionsCount,
                    documentsCount: exportJob.documentsCount,
                    completedAt: exportJob.completedAt?.toISOString(),
                },
            });
        } catch (error) {
            console.error(`Failed to send export completed email for export ${exportJob._id}:`, error);
        }
    }

    /**
     * Send email notification when export fails
     * @param exportJob The failed export job
     * @param errorMessage The error message
     */
    private async sendExportFailedEmail(exportJob: DatabaseExportDocument, errorMessage: string): Promise<void> {
        try {
            const adminEmail = await this.getAdminEmail(exportJob.adminId.toString());
            if (!adminEmail) {
                return;
            }

            const { from, name } = this.getFromAddress();

            await this.mailerService['mailerProvider'].sendMail({
                to: adminEmail,
                subject: 'Database Export Failed',
                template: 'exportFailed',
                from,
                context: {
                    fromName: name,
                    exportId: exportJob._id.toString(),
                    errorMessage,
                },
            });
        } catch (error) {
            console.error(`Failed to send export failed email for export ${exportJob._id}:`, error);
        }
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
     * Get admin by ID and return email if exists
     * @param adminId ID of the admin
     * @returns Admin email or null
     */
    private async getAdminEmail(adminId: string): Promise<string | null> {
        try {
            const admin = await this.adminModel.findById(adminId).exec();
            return admin?.email || null;
        } catch (error) {
            return null;
        }
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
     * Generic method to cancel an ongoing operation (export or import)
     * @param jobId ID of the job to cancel
     * @param model The model to query
     * @param pendingStatus Pending status value
     * @param inProgressStatus In progress status value
     * @param cancelledStatus Cancelled status value
     * @returns True if cancelled, false otherwise
     */
    private async cancelJob<T extends JobDocument>(
        jobId: string,
        model: Model<T>,
        pendingStatus: JobStatus,
        inProgressStatus: JobStatus,
        cancelledStatus: JobStatus,
    ): Promise<boolean> {
        const job = await model.findById(jobId);

        if (!job) {
            return false;
        }

        // Can only cancel pending or in-progress jobs
        if (job.status !== pendingStatus && job.status !== inProgressStatus) {
            return false;
        }

        job.status = cancelledStatus as any;
        job.completedAt = new Date();
        await job.save();

        return true;
    }

    /**
     * Cancel an ongoing export operation
     * @param exportId ID of the export to cancel
     * @returns True if cancelled, false otherwise
     */
    async cancelExport(exportId: string): Promise<boolean> {
        return this.cancelJob(
            exportId,
            this.exportModel,
            ExportStatus.PENDING,
            ExportStatus.IN_PROGRESS,
            ExportStatus.CANCELLED,
        );
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

    // ========== IMPORT METHODS ==========

    /**
     * Initiate a full database import.
     * The import runs asynchronously in the background.
     * @param adminId ID of the admin initiating the import
     * @param file The uploaded file buffer
     * @param originalFilename Original name of the uploaded file
     * @param dto Import configuration
     * @returns The created import job document
     */
    async initiateImport(
        adminId: string,
        file: Buffer,
        originalFilename: string,
        dto: CreateImportDto,
    ): Promise<DatabaseImportDocument> {
        // Save uploaded file temporarily
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `database-import-${timestamp}.json.gz`;
        const importPath = this.getImportPath(filename);

        // Ensure import directory exists
        const fs = require('fs').promises;
        const path = require('path');
        await fs.mkdir(path.dirname(importPath), { recursive: true });

        // Write file to disk
        await fs.writeFile(importPath, file);

        // Get file size
        const stats = await fs.stat(importPath);

        // Create import record
        const importJob = new this.importModel({
            adminId,
            status: ImportStatus.PENDING,
            filename: originalFilename,
            fileKey: filename,
            fileSize: stats.size,
        });
        await importJob.save();

        // Start import in background (don't await)
        this.performImport(importJob._id.toString(), dto.clearExisting || false);

        return importJob;
    }

    /**
     * Perform the actual database import operation.
     * This runs asynchronously and updates the import status.
     * @param importId ID of the import job
     * @param clearExisting Whether to clear existing data before importing
     */
    private async performImport(importId: string, clearExisting: boolean): Promise<void> {
        let importJob = await this.importModel.findById(importId);
        if (!importJob) {
            return;
        }

        try {
            // Check if import was cancelled before we started
            if (this.isJobCancelled(importJob)) {
                return;
            }

            // Mark import as in progress
            await this.markJobInProgress(importJob);

            // Import all collections with streaming
            const { totalDocuments, collectionsCount } = await this.importAllCollectionsStreaming(
                importId,
                importJob.fileKey!,
                clearExisting,
            );

            if (clearExisting) {
                await this.cleanupOrphanedJobs();
            }

            // Mark import as completed
            await this.markImportCompleted(importJob, collectionsCount, totalDocuments);

            // Send success notification
            await this.sendImportCompletedEmail(importJob);
        } catch (error) {
            await this.handleJobFailure(importJob, error, this.sendImportFailedEmail.bind(this));
        }
    }

    /**
     * Import all database collections using streaming to avoid memory issues
     * @param importId ID of the import job (for cancellation checks)
     * @param fileKey The file key to import from
     * @param clearExisting Whether to clear existing data before importing
     * @returns Import metadata with statistics
     */
    private async importAllCollectionsStreaming(
        importId: string,
        fileKey: string,
        clearExisting: boolean,
    ): Promise<{ totalDocuments: number; collectionsCount: number }> {
        if (!this.connection || !this.connection.db) {
            throw new InternalServerErrorException('Database connection not available');
        }

        const importPath = this.getImportPath(fileKey);
        const fs = require('fs');

        // Check if file exists
        if (!fs.existsSync(importPath)) {
            throw new HttpException('Import file not found on disk', HttpStatus.NOT_FOUND);
        }

        // Read and decompress file
        const fileContent = await this.readAndDecompressFile(importPath);

        // Parse JSON
        let data: Record<string, any[]>;
        try {
            data = JSON.parse(fileContent);
        } catch (error) {
            throw new HttpException('Invalid JSON format in import file', HttpStatus.BAD_REQUEST);
        }

        let totalDocuments = 0;
        let collectionsCount = 0;

        // Process each collection
        for (const [collectionName, documents] of Object.entries(data)) {
            // Check for cancellation
            if (await this.checkCancellationDuringOperation(importId, this.importModel, ImportStatus.CANCELLED)) {
                throw new HttpException('Import cancelled by user', HttpStatus.CONFLICT);
            }

            if (!Array.isArray(documents)) {
                continue;
            }

            const collection = this.connection.db.collection(collectionName);

            // Clear existing data if requested
            if (clearExisting) {
                await collection.deleteMany({});
            }

            // Insert documents in batches
            if (documents.length > 0) {
                const batchSize = 1000;
                for (let i = 0; i < documents.length; i += batchSize) {
                    const batch = documents.slice(i, i + batchSize);
                    // Convert Extended JSON ObjectIds back to MongoDB ObjectIds
                    const convertedBatch = batch.map((doc) => this.convertFromExtendedJSON(doc));
                    await collection.insertMany(convertedBatch, { ordered: false });
                    totalDocuments += batch.length;

                    // Check for cancellation between batches
                    if (
                        await this.checkCancellationDuringOperation(importId, this.importModel, ImportStatus.CANCELLED)
                    ) {
                        throw new HttpException('Import cancelled by user', HttpStatus.CONFLICT);
                    }
                }
                collectionsCount++;
            }
        }

        return {
            totalDocuments,
            collectionsCount,
        };
    }

    /**
     * Read and decompress a gzip file
     * @param filePath Path to the file
     * @returns Decompressed content as string
     */
    private async readAndDecompressFile(filePath: string): Promise<string> {
        const fs = require('fs');
        const util = require('util');
        const gunzip = util.promisify(zlib.gunzip);

        const compressed = fs.readFileSync(filePath);
        const decompressed = await gunzip(compressed);
        return decompressed.toString('utf-8');
    }

    /**
     * Convert a MongoDB document to Extended JSON format
     * Recursively converts ObjectIds to { $oid: "..." } format
     * @param obj The object to convert
     * @returns The object with ObjectIds converted to Extended JSON
     */
    private convertToExtendedJSON(obj: any): any {
        if (obj === null || obj === undefined) {
            return obj;
        }

        // Handle ObjectId instances
        if (obj instanceof Types.ObjectId) {
            return { $oid: obj.toString() };
        }

        // Handle Date instances
        if (obj instanceof Date) {
            return { $date: obj.toISOString() };
        }

        // Handle arrays
        if (Array.isArray(obj)) {
            return obj.map((item) => this.convertToExtendedJSON(item));
        }

        // Handle objects
        if (typeof obj === 'object') {
            const converted: any = {};
            for (const [key, value] of Object.entries(obj)) {
                converted[key] = this.convertToExtendedJSON(value);
            }
            return converted;
        }

        return obj;
    }

    /**
     * Convert Extended JSON format back to MongoDB types
     * Recursively converts { $oid: "..." } to ObjectId instances
     * @param obj The object to convert
     * @returns The object with Extended JSON converted to MongoDB types
     */
    private convertFromExtendedJSON(obj: any): any {
        if (obj === null || obj === undefined) {
            return obj;
        }

        // Handle Extended JSON ObjectId format: { $oid: "..." }
        if (obj.$oid && typeof obj.$oid === 'string') {
            return new Types.ObjectId(obj.$oid);
        }

        // Handle Extended JSON Date format: { $date: "..." }
        if (obj.$date && typeof obj.$date === 'string') {
            return new Date(obj.$date);
        }

        // Handle arrays
        if (Array.isArray(obj)) {
            return obj.map((item) => this.convertFromExtendedJSON(item));
        }

        // Handle objects
        if (typeof obj === 'object') {
            const converted: any = {};
            for (const [key, value] of Object.entries(obj)) {
                converted[key] = this.convertFromExtendedJSON(value);
            }
            return converted;
        }

        return obj;
    }

    /**
     * Get the filesystem path for an import file
     * @param filename Name of the import file
     * @returns Full filesystem path
     */
    private getImportPath(filename: string): string {
        const path = require('path');
        const importsDir = this.configService.get<string>('IMPORTS_DIR') || './imports';
        return path.join(importsDir, filename);
    }

    /**
     * Clean up exports and imports with PENDING or IN_PROGRESS status after clearExisting import.
     * These jobs were likely restored from a backup but their background processes no longer exist.
     */
    private async cleanupOrphanedJobs(): Promise<void> {
        try {
            // Cancel all pending or in-progress exports
            await this.exportModel.updateMany(
                {
                    status: {
                        $in: [ExportStatus.PENDING, ExportStatus.IN_PROGRESS],
                    },
                },
                {
                    $set: {
                        status: ExportStatus.CANCELLED,
                        completedAt: new Date(),
                    },
                },
            );

            await this.importModel.updateMany(
                {
                    status: {
                        $in: [ImportStatus.PENDING, ImportStatus.IN_PROGRESS],
                    },
                },
                {
                    $set: {
                        status: ImportStatus.CANCELLED,
                        completedAt: new Date(),
                    },
                },
            );
        } catch (error) {
            // Log error but don't fail the import
            console.error('Error cleaning up orphaned jobs:', error);
        }
    }

    /**
     * Mark import as completed and update metadata
     * @param importJob The import job to update
     * @param collectionsCount Number of collections imported
     * @param documentsCount Number of documents imported
     */
    private async markImportCompleted(
        importJob: DatabaseImportDocument,
        collectionsCount: number,
        documentsCount: number,
    ): Promise<void> {
        importJob.status = ImportStatus.COMPLETED;
        importJob.completedAt = new Date();
        importJob.collectionsCount = collectionsCount;
        importJob.documentsCount = documentsCount;
        try {
            await importJob.save();
        } catch (error) {
            return;
        }
    }

    /**
     * Send email notification when import is completed
     * @param importJob The completed import job
     */
    private async sendImportCompletedEmail(importJob: DatabaseImportDocument): Promise<void> {
        try {
            const adminEmail = await this.getAdminEmail(importJob.adminId.toString());
            if (!adminEmail) {
                return;
            }

            const { from, name } = this.getFromAddress();

            await this.mailerService['mailerProvider'].sendMail({
                to: adminEmail,
                subject: 'Database Import Completed',
                template: 'importCompleted',
                from,
                context: {
                    fromName: name,
                    importId: importJob._id.toString(),
                    filename: importJob.filename,
                    collectionsCount: importJob.collectionsCount,
                    documentsCount: importJob.documentsCount,
                    completedAt: importJob.completedAt?.toISOString(),
                },
            });
        } catch (error) {
            console.error(`Failed to send import completed email for import ${importJob._id}:`, error);
        }
    }

    /**
     * Send email notification when import fails
     * @param importJob The failed import job
     * @param errorMessage The error message
     */
    private async sendImportFailedEmail(importJob: DatabaseImportDocument, errorMessage: string): Promise<void> {
        try {
            const adminEmail = await this.getAdminEmail(importJob.adminId.toString());
            if (!adminEmail) {
                return;
            }

            const { from, name } = this.getFromAddress();

            await this.mailerService['mailerProvider'].sendMail({
                to: adminEmail,
                subject: 'Database Import Failed',
                template: 'importFailed',
                from,
                context: {
                    fromName: name,
                    importId: importJob._id.toString(),
                    filename: importJob.filename,
                    errorMessage,
                },
            });
        } catch (error) {
            console.error(`Failed to send import failed email for import ${importJob._id}:`, error);
        }
    }

    /**
     * Get the status of an import job
     * @param importId ID of the import
     * @returns Import job document or null
     */
    async getImportStatus(importId: string): Promise<DatabaseImportDocument | null> {
        return this.importModel.findById(importId).exec();
    }

    /**
     * Cancel an ongoing import operation
     * @param importId ID of the import to cancel
     * @returns True if cancelled, false otherwise
     */
    async cancelImport(importId: string): Promise<boolean> {
        return this.cancelJob(
            importId,
            this.importModel,
            ImportStatus.PENDING,
            ImportStatus.IN_PROGRESS,
            ImportStatus.CANCELLED,
        );
    }
}
