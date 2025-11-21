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
});
