import 'reflect-metadata';
import { validate } from 'class-validator';
import { GeneratePresignedUploadDto } from '../../../../src/s3/dto/generate-presigned.dto';
import { plainToClass } from 'class-transformer';

describe('GeneratePresignedUploadDto', () => {
  it('should validate a correct DTO with valid filename', async () => {
    const dto = plainToClass(GeneratePresignedUploadDto, {
      originalFilename: 'document.pdf',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate filename with spaces and special chars', async () => {
    const dto = plainToClass(GeneratePresignedUploadDto, {
      originalFilename: 'My Document V2.0.pdf',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject empty filename', async () => {
    const dto = plainToClass(GeneratePresignedUploadDto, {
      originalFilename: '',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('originalFilename');
  });

  it('should reject missing filename', async () => {
    const dto = plainToClass(GeneratePresignedUploadDto, {});

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('originalFilename');
  });

  it('should reject non-string filename', async () => {
    const dto = plainToClass(GeneratePresignedUploadDto, {
      originalFilename: 123 as any,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('originalFilename');
  });

  it('should validate filename with unicode characters', async () => {
    const dto = plainToClass(GeneratePresignedUploadDto, {
      originalFilename: 'Résumé_été_2024.pdf',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});

