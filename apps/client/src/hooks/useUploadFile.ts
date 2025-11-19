export function useUploadFile() {
    const upload = async (file: File, signedUrl: string) => {
        console.log(file)
        const formData = new FormData();
        formData.append('file', file);
        await fetch(signedUrl, {
            method: 'PUT',
            body: file,
        }).catch((error) => {
            console.error('Error uploading file:', error);
        });
    };
    return upload;
}
