import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PayloadTooLargeException, BadRequestException } from '@nestjs/common';
import { FileSizeValidationPipe } from '../../../../src/common/pipes/file-size-validation.pipe'; // Ajustez le chemin

describe('FileSizeValidationPipe', () => {
    let pipe: FileSizeValidationPipe;
    let mockConfigService: any;

    beforeEach(async () => {
        mockConfigService = {
            get: jest.fn((key: string) => {
                if (key === 'IMPORT_MAX_SIZE_BYTES') return 2 * 1024 * 1024; // 2 Mo
                return null;
            }),
        };

        pipe = new FileSizeValidationPipe(mockConfigService);
    });

    it('should throw PayloadTooLargeException (413) with correct message if file is too big', () => {
        const bigFile = {
            fieldname: 'file',
            originalname: 'big.csv',
            encoding: '7bit',
            mimetype: 'text/csv',
            size: 5 * 1024 * 1024, // 5 Mo
            buffer: Buffer.from(''),
            stream: null as any,
            destination: '',
            filename: '',
            path: '',
        } as Express.Multer.File;

        try {
            pipe.transform(bigFile);
        } catch (error) {
            expect(error).toBeInstanceOf(PayloadTooLargeException);
            
            expect(error.getStatus()).toBe(413);

            expect(error.getResponse()).toEqual({
                message: 'File is too large. Max allowed size is 2MB',
                error: 'Payload Too Large',
                statusCode: 413
            });
        }
    });

    it('should pass if file size is valid', () => {
        const validFile = { size: 1 * 1024 * 1024 } as Express.Multer.File; // 1 Mo
        
        const result = pipe.transform(validFile);
        expect(result).toBe(validFile);
    });

    it('should throw BadRequestException if file is missing', () => {
        try {
            pipe.transform(undefined as any);
        } catch (error) {
            expect(error).toBeInstanceOf(BadRequestException);
            expect(error.message).toBe('File is required');
        }
    });
});