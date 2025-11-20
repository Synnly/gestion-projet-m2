export function useUploadFile() {
    const upload = async (file: File, signedUrl: string) => {
        await fetch(signedUrl, {
            method: 'PUT',
            body: file,
        }).catch((error) => {
            console.error('Error uploading file:', error);
        });
    };
    return upload;
}
