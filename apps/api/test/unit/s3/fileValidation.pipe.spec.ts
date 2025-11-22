import { BadRequestException } from '@nestjs/common';
import { FileValidationPipe } from '../../../src/s3/pipes/fileValidation.pipe';

describe('FileValidationPipe (extensions only)', () => {
    let pipe: FileValidationPipe;

    beforeEach(() => {
        pipe = new FileValidationPipe();
    });

    it('accepts valid logo filename', async () => {
        const dto = { originalFilename: 'logo.png', fileType: 'logo' };
        await expect(pipe.transform(dto)).resolves.toEqual(dto);
    });

    it('accepts valid cv filename', async () => {
        const dto = { originalFilename: 'resume.pdf', fileType: 'cv' };
        await expect(pipe.transform(dto)).resolves.toEqual(dto);
    });

    it('rejects missing originalFilename', async () => {
        await expect(pipe.transform({ fileType: 'logo' } as any)).rejects.toThrow(BadRequestException);
    });

    it('rejects filename without extension', async () => {
        const dto = { originalFilename: 'noextension', fileType: 'logo' };
        await expect(pipe.transform(dto)).rejects.toThrow(BadRequestException);
    });

    it('rejects filename ending with dot (empty extension)', async () => {
        const dto = { originalFilename: 'filename.', fileType: 'logo' };
        await expect(pipe.transform(dto)).rejects.toThrow('File must have an extension');
    });

    it('rejects invalid extension for logo', async () => {
        const dto = { originalFilename: 'document.pdf', fileType: 'logo' };
        await expect(pipe.transform(dto)).rejects.toThrow(BadRequestException);
    });

    it('is case-insensitive for extension', async () => {
        const dto = { originalFilename: 'logo.PNG', fileType: 'logo' };
        await expect(pipe.transform(dto)).resolves.toEqual(dto);
    });

    it('handles filenames with multiple dots', async () => {
        const dto = { originalFilename: 'my.company.logo.png', fileType: 'logo' };
        await expect(pipe.transform(dto)).resolves.toEqual(dto);
    });

    it('rejects filename with path traversal', async () => {
        const dto = { originalFilename: '../secret.png', fileType: 'logo' };
        await expect(pipe.transform(dto as any)).rejects.toThrow('Invalid filename: path traversal detected');
    });

    it('rejects filename containing null byte', async () => {
        const dto = { originalFilename: 'logo\0.png', fileType: 'logo' };
        await expect(pipe.transform(dto as any)).rejects.toThrow('Invalid filename: null byte detected');
    });

    it('rejects invalid extension for cv', async () => {
        const dto = { originalFilename: 'image.png', fileType: 'cv' };
        await expect(pipe.transform(dto as any)).rejects.toThrow('Invalid file extension for cv');
    });

    it('defaults to cv when fileType is missing and accepts pdf', async () => {
        const dto = { originalFilename: 'resume.PDF' };
        await expect(pipe.transform(dto as any)).resolves.toEqual(dto);
    });
});
