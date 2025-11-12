import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { FILE_SIZE_LIMITS, ALLOWED_TYPES, SVG_DANGEROUS_PATTERNS } from '../s3.constants';

/**
 * FileValidationPipe - Simplified version for presigned URL architecture
 * 
 * Since files are uploaded directly to MinIO via presigned URLs,
 * this pipe validates the filename and provides client-side validation hints
 * 
 * Actual file validation happens via:
 * 1. MinIO bucket policies (Content-Type enforcement)
 * 2. Post-upload webhook validation (optional)
 * 3. Client-side validation (file size, MIME type)
 */
@Injectable()
export class FileValidationPipe implements PipeTransform {
    /**
     * Validates the originalFilename for security issues
     * @param value The DTO containing originalFilename
     * @returns The validated DTO
     */
    async transform(value: any): Promise<any> {
        if (!value || !value.originalFilename) {
            throw new BadRequestException('originalFilename is required');
        }

        const { originalFilename, fileType } = value;

        // Check for path traversal attempts
        if (originalFilename.includes('..') || originalFilename.includes('/') || originalFilename.includes('\\')) {
            throw new BadRequestException('Invalid filename: path traversal detected');
        }

        // Check for null bytes
        if (originalFilename.includes('\0')) {
            throw new BadRequestException('Invalid filename: null byte detected');
        }

        // Check extension
        const extension = originalFilename.split('.').pop()?.toLowerCase();
        if (!extension) {
            throw new BadRequestException('File must have an extension');
        }

        // Validate extension matches file type
        const allowedExtensions: string[] = fileType === 'logo' 
            ? [...ALLOWED_TYPES.LOGO.EXTENSIONS]
            : [...ALLOWED_TYPES.CV.EXTENSIONS];

        if (!allowedExtensions.includes(extension)) {
            throw new BadRequestException(
                `Invalid file extension for ${fileType}. Allowed: ${allowedExtensions.join(', ')}`
            );
        }

        return value;
    }
}

/**
 * Utility class for file validation
 * These methods can be used for post-upload validation if needed
 */
export class FileValidator {
    /**
     * Sanitize SVG content by removing dangerous elements
     * This should be called after upload when processing SVG files
     * @param svgContent The SVG file content as string
     * @returns Sanitized SVG content
     */
    static sanitizeSvg(svgContent: string): string {
        let sanitized = svgContent;

        for (const pattern of SVG_DANGEROUS_PATTERNS) {
            sanitized = sanitized.replace(pattern, '');
        }

        // Verify SVG is still valid
        if (!sanitized.includes('<svg')) {
            throw new Error('Invalid SVG content after sanitization');
        }

        // Check for remaining dangerous patterns
        const forbidden = /<\s*(script|iframe|object|foreignObject)\b/i;
        if (forbidden.test(sanitized)) {
            throw new Error('SVG contains forbidden elements');
        }

        return sanitized;
    }

    /**
     * Validate file size against limits
     * @param size File size in bytes
     * @param fileType 'logo' or 'cv'
     * @throws Error if size exceeds limit
     */
    static validateFileSize(size: number, fileType: 'logo' | 'cv'): void {
        const maxSize = fileType === 'logo' ? FILE_SIZE_LIMITS.LOGO : FILE_SIZE_LIMITS.CV;
        
        if (size > maxSize) {
            throw new Error(`File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`);
        }
    }

    /**
     * Validate MIME type
     * @param mimeType The MIME type to validate
     * @param fileType 'logo' or 'cv'
     * @throws Error if MIME type is not allowed
     */
    static validateMimeType(mimeType: string, fileType: 'logo' | 'cv'): void {
        const allowedTypes: string[] = fileType === 'logo' 
            ? [...ALLOWED_TYPES.LOGO.MIME_TYPES]
            : [...ALLOWED_TYPES.CV.MIME_TYPES];

        if (!allowedTypes.includes(mimeType)) {
            throw new Error(`Invalid MIME type for ${fileType}. Allowed: ${allowedTypes.join(', ')}`);
        }
    }
}
