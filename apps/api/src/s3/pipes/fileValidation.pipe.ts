import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ALLOWED_TYPES } from '../s3.constants';

/**
 * Lightweight FileValidationPipe
 *
 * Only validates filename presence, path traversal, null bytes and extension
 * (case-insensitive) against allowed extensions for `logo` and `cv` types.
 *
 * MIME-type checks are intentionally not performed here because presigned
 * uploads send the file directly to MinIO; real content-type validation
 * should happen via MinIO policies or a post-upload verification step.
 */
@Injectable()
export class FileValidationPipe implements PipeTransform {
    async transform(value: any): Promise<any> {
        if (!value || !value.originalFilename) {
            throw new BadRequestException('originalFilename is required');
        }

        const { originalFilename, fileType } = value;

        // Basic sanitation: prevent path traversal and null bytes
        if (originalFilename.includes('..') || originalFilename.includes('/') || originalFilename.includes('\\')) {
            throw new BadRequestException('Invalid filename: path traversal detected');
        }

        if (originalFilename.includes('\0')) {
            throw new BadRequestException('Invalid filename: null byte detected');
        }

        // Ensure extension exists
        const extension = originalFilename.split('.').pop()?.toLowerCase();
        if (!extension) {
            throw new BadRequestException('File must have an extension');
        }

        // Validate extension against allowed types for the given fileType
        const allowedExtensions: string[] =
            fileType === 'logo' ? [...ALLOWED_TYPES.LOGO.EXTENSIONS] : [...ALLOWED_TYPES.CV.EXTENSIONS];

        if (!allowedExtensions.includes(extension)) {
            throw new BadRequestException(`Invalid file extension for ${fileType}`);
        }

        return value;
    }
}

// Keep no other exports here — MIME validation is removed.
