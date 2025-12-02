/**
 * Storage provider abstraction used by the S3 module.
 *
 * Implementations (MinIO, AWS S3, etc.) must provide these methods so the
 * higher-level application code can operate independently from the concrete
 * storage backend.
 */
export interface IStorageProvider {
    /**
     * Generate a presigned URL that allows a client to upload a file directly
     * to the storage backend.
     *
     * @param originalFilename - Original filename provided by the client. Used
     *   to preserve/derive the file extension.
     * @param fileType - Logical file type (e.g. 'logo' or 'cv') used to build
     *   the final storage key / fileName.
     * @param userId - Identifier of the uploading user — may be embedded in
     *   the stored filename to enforce basic ownership semantics.
     * @returns Promise resolving to an object containing the storage `fileName`
     *   (the key under which the file will be stored) and the `uploadUrl` that
     *   the client can PUT to.
     */
    generatePresignedUploadUrl(
        originalFilename: string,
        fileType: 'logo' | 'cv',
        userId: string,
    ): Promise<{ fileName: string; uploadUrl: string }>;

    /**
     * Generate a presigned URL that allows a client to download a private file.
     * Implementations may perform validation (path safety, ownership checks)
     * and should throw appropriate errors when the file is not accessible.
     *
     * @param fileName - The storage key / filename to download.
     * @param userId - Requesting user's id used for ownership checks.
     * @returns Promise resolving to an object with a `downloadUrl` string.
     */
    generatePresignedDownloadUrl(fileName: string, userId: string): Promise<{ downloadUrl: string }>;

    /**
     * Generate a public download URL for a file (no ownership checks).
     *
     * @param fileName - The storage key / filename to download.
     * @returns Promise resolving to an object with a `downloadUrl` string.
     */
    generatePublicDownloadUrl(fileName: string): Promise<{ downloadUrl: string }>;

    /**
     * Delete a file from the storage backend. Implementations may validate
     * path safety and ownership and should throw `NotFoundException` or
     * `ForbiddenException` when appropriate.
     *
     * @param fileName - The storage key / filename to delete.
     * @param userId - Requesting user's id used for ownership checks.
     */
    deleteFile(fileName: string, userId: string): Promise<void>;

    /**
     * Check whether a file exists in the storage backend.
     *
     * @param fileName - The storage key / filename to check.
     * @returns Promise resolving to `true` when the file exists, otherwise
     *   `false`.
     */
    fileExists(fileName: string): Promise<boolean>;
}
