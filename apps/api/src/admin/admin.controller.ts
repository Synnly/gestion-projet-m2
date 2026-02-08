import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Req,
    Res,
    UseGuards,
    ValidationPipe,
    HttpStatus,
    HttpException,
    StreamableFile,
    UseInterceptors,
    UploadedFile,
    ParseFilePipe,
    MaxFileSizeValidator,
    FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response, Request } from 'express';
import { AdminService } from './admin.service';
import { CreateExportDto } from './dto/createExportDto';
import { CreateImportDto } from './dto/createImportDto';
import {
    ExportInitiatedResponseDto,
    ExportStatusResponseDto,
    ExportListItemDto,
    ExportCancelledResponseDto,
} from './dto/exportResponseDto';
import {
    ImportInitiatedResponseDto,
    ImportStatusResponseDto,
    ImportListItemDto,
    ImportCancelledResponseDto,
} from './dto/importResponseDto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../common/roles/roles.guard';
import { Roles } from '../common/roles/roles.decorator';
import { Role } from '../common/roles/roles.enum';

/**
 * Controller handling admin-specific operations.
 * All routes require admin authentication.
 */
@Controller('/api/admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    /**
     * Initiate a full database export.
     * The export runs in the background and the admin receives an email when complete.
     * @param dto Export configuration
     * @param req Authenticated request containing user info
     * @returns Export job information including ID for tracking
     */
    @Post('export')
    async createExport(
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
        dto: CreateExportDto,
        @Req() req: Request,
    ): Promise<ExportInitiatedResponseDto> {
        const adminId = ((req as any).user.sub || (req as any).user._id).toString();
        const exportJob = await this.adminService.initiateExport(adminId, dto);

        return {
            message: 'Export initiated. You will receive an email when the export is complete.',
            exportId: exportJob._id.toString(),
            status: exportJob.status,
        };
    }

    /**
     * Get the status and details of a specific export.
     * @param exportId ID of the export to retrieve
     * @returns Export information including status, file URL if completed
     */
    @Get('export/:exportId')
    async getExportStatus(@Param('exportId') exportId: string): Promise<ExportStatusResponseDto> {
        const exportJob = await this.adminService.getExportStatus(exportId);

        if (!exportJob) {
            throw new HttpException('Export not found', HttpStatus.NOT_FOUND);
        }

        return {
            exportId: exportJob._id.toString(),
            status: exportJob.status,
            fileUrl: exportJob.fileUrl,
            fileSize: exportJob.fileSize,
            collectionsCount: exportJob.collectionsCount,
            documentsCount: exportJob.documentsCount,
            startedAt: exportJob.startedAt,
            completedAt: exportJob.completedAt,
            errorMessage: exportJob.errorMessage,
        };
    }

    /**
     * List all exports for the authenticated admin.
     * @param req Authenticated request containing user info
     * @returns List of export jobs
     */
    @Get('exports')
    async listExports(@Req() req: Request): Promise<ExportListItemDto[]> {
        const adminId = ((req as any).user.sub || (req as any).user._id).toString();
        const exports = await this.adminService.getExportsByAdmin(adminId);

        return exports.map((exp) => ({
            exportId: exp._id.toString(),
            status: exp.status,
            fileUrl: exp.fileUrl,
            fileSize: exp.fileSize,
            collectionsCount: exp.collectionsCount,
            documentsCount: exp.documentsCount,
            startedAt: exp.startedAt,
            completedAt: exp.completedAt,
            createdAt: exp.createdAt!,
        }));
    }

    /**
     * Cancel an ongoing export operation.
     * Only works if the export is still pending or in progress.
     * @param exportId ID of the export to cancel
     * @returns Confirmation message
     */
    @Delete('export/:exportId')
    async cancelExport(@Param('exportId') exportId: string): Promise<ExportCancelledResponseDto> {
        const cancelled = await this.adminService.cancelExport(exportId);

        if (!cancelled) {
            throw new HttpException('Export cannot be cancelled or does not exist', HttpStatus.BAD_REQUEST);
        }

        return {
            message: 'Export cancelled successfully',
            exportId,
        };
    }

    /**
     * Download a completed export file.
     * @param exportId ID of the export to download
     * @param res HTTP response object
     * @returns Streamable file
     */
    @Get('export/:exportId/download')
    async downloadExport(@Param('exportId') exportId: string, @Res({ passthrough: true }) res: Response) {
        const { stream, filename, mimeType } = await this.adminService.downloadExport(exportId);

        res.set({
            'Content-Type': mimeType,
            'Content-Disposition': `attachment; filename="${filename}"`,
        });

        return new StreamableFile(stream);
    }

    // ========== IMPORT ENDPOINTS ==========

    /**
     * Initiate a full database import.
     * The import runs in the background and the admin receives an email when complete.
     * @param file Uploaded database export file
     * @param dto Import configuration
     * @param req Authenticated request containing user info
     * @returns Import job information including ID for tracking
     */
    @Post('import')
    @UseInterceptors(FileInterceptor('file'))
    async createImport(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 500 * 1024 * 1024 }), // 500MB max
                    new FileTypeValidator({ fileType: /(gzip|json|gz)$/ }),
                ],
            }),
        )
        file: Express.Multer.File,
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
        dto: CreateImportDto,
        @Req() req: Request,
    ): Promise<ImportInitiatedResponseDto> {
        const adminId = ((req as any).user.sub || (req as any).user._id).toString();
        const importJob = await this.adminService.initiateImport(adminId, file.buffer, file.originalname, dto);

        return {
            message: 'Import initiated. You will receive an email when the import is complete.',
            importId: importJob._id.toString(),
            status: importJob.status,
        };
    }

    /**
     * Get the status and details of a specific import.
     * @param importId ID of the import to retrieve
     * @returns Import information including status
     */
    @Get('import/:importId')
    async getImportStatus(@Param('importId') importId: string): Promise<ImportStatusResponseDto> {
        const importJob = await this.adminService.getImportStatus(importId);

        if (!importJob) {
            throw new HttpException('Import not found', HttpStatus.NOT_FOUND);
        }

        return {
            importId: importJob._id.toString(),
            status: importJob.status,
            filename: importJob.filename,
            fileSize: importJob.fileSize,
            collectionsCount: importJob.collectionsCount,
            documentsCount: importJob.documentsCount,
            startedAt: importJob.startedAt,
            completedAt: importJob.completedAt,
            errorMessage: importJob.errorMessage,
        };
    }

    /**
     * List all imports for the authenticated admin.
     * @param req Authenticated request containing user info
     * @returns List of import jobs
     */
    @Get('imports')
    async listImports(@Req() req: Request): Promise<ImportListItemDto[]> {
        const adminId = ((req as any).user.sub || (req as any).user._id).toString();
        const imports = await this.adminService.getImportsByAdmin(adminId);

        return imports.map((imp) => ({
            importId: imp._id.toString(),
            status: imp.status,
            filename: imp.filename,
            fileSize: imp.fileSize,
            collectionsCount: imp.collectionsCount,
            documentsCount: imp.documentsCount,
            startedAt: imp.startedAt,
            completedAt: imp.completedAt,
            createdAt: imp.createdAt!,
        }));
    }

    /**
     * Cancel an ongoing import operation.
     * Only works if the import is still pending or in progress.
     * @param importId ID of the import to cancel
     * @returns Confirmation message
     */
    @Delete('import/:importId')
    async cancelImport(@Param('importId') importId: string): Promise<ImportCancelledResponseDto> {
        const cancelled = await this.adminService.cancelImport(importId);

        if (!cancelled) {
            throw new HttpException('Import cannot be cancelled or does not exist', HttpStatus.BAD_REQUEST);
        }

        return {
            message: 'Import cancelled successfully',
            importId,
        };
    }
}
