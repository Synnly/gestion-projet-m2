/**
 * S3 Module Constants
 * 
 * Centralizes all configuration values for MinIO/S3 operations
 * All values should be loaded from environment variables when possible
 */

/** Presigned URL expiry times (in seconds) */
export const URL_EXPIRY = {
    UPLOAD: 600,    // 10 minutes for PUT operations
    DOWNLOAD: 3600, // 1 hour for GET operations
} as const;

/** Allowed file types */
export const ALLOWED_TYPES = {
    LOGO: {
        MIME_TYPES: ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'],
        EXTENSIONS: ['png', 'jpg', 'jpeg', 'svg'],
    },
    CV: {
        MIME_TYPES: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        EXTENSIONS: ['pdf', 'doc', 'docx'],
    },
} as const;

/** Path validation regex patterns */
export const PATH_REGEX = {
    /** Safe filename - prevents path traversal */
    SAFE_FILENAME: /^[a-zA-Z0-9-_\.]+$/,
    /** Safe path - prevents path traversal (no "../", no leading "/") */
    SAFE_PATH: /^(?!.*\.\.)(?!\/)[a-zA-Z0-9-_/\.]+$/,
} as const;

/** Bucket prefixes for file organization */
export const BUCKET_PREFIXES = {
    LOGO: 'logos/',
    CV: 'cvs/',
} as const;

/** SVG sanitization */
export const SVG_DANGEROUS_PATTERNS = [
    /<script[\s\S]*?<\/script>/gi,
    /on\w+\s*=/gi, // onload, onclick, etc.
    /javascript:/gi,
    /<iframe[\s\S]*?<\/iframe>/gi,
    /<embed[\s\S]*?>/gi,
    /<object[\s\S]*?<\/object>/gi,
    /<foreignObject[\s\S]*?<\/foreignObject>/gi,
] as const;

/** Rate limiting */
export const RATE_LIMIT = {
    UPLOAD: { limit: 5, ttl: 60000 }, // 5 uploads per minute
    DOWNLOAD: { limit: 400, ttl: 60000 }, // 200 downloads per minute
    DELETE: { limit: 10, ttl: 60000 }, // 10 deletes per minute
} as const;

export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');

export enum StorageProviderType {
    MINIO = 'minio',
    AWS = 'aws',
}