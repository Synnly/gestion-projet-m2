export function useUploadFile() {
    const upload = async (file: File, signedUrl: string) => {
        fetch(signedUrl, {
            method: 'PUT',
            body: file,
        }).catch((_) => {});
    };
    return upload;
}
