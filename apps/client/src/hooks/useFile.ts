export function useFile(blob: Blob | undefined | null, defaultName = 'file'): File | null {
    if (!blob) return null;
    const mime = blob.type || 'application/octet-stream';
    const ext = mime.includes('/') ? mime.split('/')[1] : 'bin';

    return new File([blob], `${defaultName}.${ext}`, {
        type: mime,
        lastModified: Date.now(),
    });
}
