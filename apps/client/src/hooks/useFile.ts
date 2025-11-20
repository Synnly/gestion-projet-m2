/**
@description hook to create file from blob
@Param Blob the blob of file
*/
export function useFile(blob: Blob | undefined | null, defaultName = 'file'): File | null {

    if (!blob) return null;
    const mime = blob.type || 'application/octet-stream';
    const ext = mime.includes('/') ? mime.split('/')[1] : 'bin';

    const fileRes = new File([blob], `${defaultName}.${ext}`, {
        type: mime,
        lastModified: Date.now(),
    });
    return fileRes
}
