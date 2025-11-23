import {
    Controller,
    Post,
    Get,
    Delete,
    Param,
    Body,
    UseGuards,
    HttpCode,
    HttpStatus,
    Request,
    BadRequestException,
    ValidationPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { S3Service } from './s3.service';
import { GeneratePresignedUploadDto } from './dto/generatePresigned.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RATE_LIMIT } from './s3.constants';
import { OwnerGuard } from './owner.guard';

/**
 * S3Controller - Simplified REST API for file management
 *
 * All endpoints require authentication via AuthGuard (JWT in HttpOnly cookie)
 *
 * Endpoints:
 * - POST /files/signed/logo - Generate presigned URL for logo upload
 * - POST /files/signed/cv - Generate presigned URL for CV upload
 * - GET /files/signed/download/:fileName - Generate presigned URL for download
 * - DELETE /files/:fileName - Delete a file
 */
@Controller('/api/files')
export class S3Controller {
    constructor(private readonly s3Service: S3Service) {}

    /**
     * Generate a presigned URL for logo upload
     * Rate limited
     *
     * @param dto Contains originalFilename and fileType
     * @param req Express request object (contains user from AuthGuard)
     * @returns Object with fileName and uploadUrl
     */
    @Post('signed/logo')
    @UseGuards(AuthGuard)
    @Throttle({ default: RATE_LIMIT.UPLOAD })
    @HttpCode(HttpStatus.OK)
    async generateLogoUploadUrl(
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
        dto: GeneratePresignedUploadDto,
        @Request() req: any,
    ): Promise<{ fileName: string; uploadUrl: string }> {
        const userId = req.user?.sub || req.user?.id;

        if (!userId) {
            throw new BadRequestException('User ID not found in request');
        }

        // Validate file extension for logo
        const extension = dto.originalFilename.split('.').pop()?.toLowerCase();
        const allowedExtensions = ['png', 'jpg', 'jpeg', 'svg'];
        if (!extension || !allowedExtensions.includes(extension)) {
            throw new BadRequestException(`Invalid file extension for logo. Allowed: ${allowedExtensions.join(', ')}`);
        }

        return this.s3Service.generatePresignedUploadUrl(dto.originalFilename, 'logo', userId);
    }

    /**
     * Generate a presigned URL for CV upload
     * Rate limited
     *
     * @param dto Contains originalFilename and fileType
     * @param req Express request object (contains user from AuthGuard)
     * @returns Object with fileName and uploadUrl
     */
    @Post('signed/cv')
    @UseGuards(AuthGuard)
    @Throttle({ default: RATE_LIMIT.UPLOAD })
    @HttpCode(HttpStatus.OK)
    async generateCvUploadUrl(
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
        dto: GeneratePresignedUploadDto,
        @Request() req: any,
    ): Promise<{ fileName: string; uploadUrl: string }> {
        const userId = req.user?.sub || req.user?.id;

        if (!userId) {
            throw new BadRequestException('User ID not found in request');
        }

        return this.s3Service.generatePresignedUploadUrl(dto.originalFilename, 'cv', userId);
    }

    /**
     * Generate a presigned URL for file download
     * Rate limited
     * Verifies file ownership before generating URL
     *
     * @param fileName Full path of the file (from route params)
     * @param req Express request object (contains user from AuthGuard)
     * @returns Object with downloadUrl
     */
    @Get('signed/download/:fileName')
    @UseGuards(AuthGuard)
    @Throttle({ default: RATE_LIMIT.DOWNLOAD })
    @HttpCode(HttpStatus.OK)
    async generateDownloadUrl(
        @Param('fileName') fileName: string,
        @Request() req: any,
    ): Promise<{ downloadUrl: string }> {
        const userId = req.user?.sub || req.user?.id;

        if (!userId) {
            throw new BadRequestException('User ID not found in request');
        }

        const url = await this.s3Service.generatePresignedDownloadUrl(fileName, userId);
        return url;
    }

    /**
     * Generate a presigned URL for public file download (company logos)
     * Rate limited but no ownership verification
     * Requires authentication
     *
     * @param fileName Full path of the file (from route params)
     * @returns Object with downloadUrl
     */
    @Get('signed/public/:fileName')
    @Throttle({ default: RATE_LIMIT.DOWNLOAD })
    @HttpCode(HttpStatus.OK)
    async generatePublicDownloadUrl(
        @Param('fileName') fileName: string,
    ): Promise<{ downloadUrl: string }> {
        const url = await this.s3Service.generatePublicDownloadUrl(fileName);
        return url;
    }

    /**
     * Delete a file from storage
     * Rate limited
     * Verifies ownership before deletion
     *
     * @param fileName Full path of the file (from route params)
     * @param req Express request object (contains user from AuthGuard)
     * @returns Success confirmation
     */
    @Delete(':fileName')
    @Throttle({ default: RATE_LIMIT.DELETE })
    @UseGuards(AuthGuard, OwnerGuard)
    @HttpCode(HttpStatus.OK)
    async deleteFile(@Param('fileName') fileName: string, @Request() req: any): Promise<{ success: boolean }> {
        const userId = req.user?.sub || req.user?.id;

        if (!userId) {
            throw new BadRequestException('User ID not found in request');
        }

        await this.s3Service.deleteFile(fileName, userId);

        return { success: true };
    }
}
