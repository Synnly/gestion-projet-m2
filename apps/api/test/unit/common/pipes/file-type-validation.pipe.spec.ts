import { FileTypeValidationPipe } from '../../../../src/common/pipes/file-type-validation.pipe';
import { BadRequestException } from '@nestjs/common';

describe('FileTypeValidationPipe', () => {
  let pipe: FileTypeValidationPipe;

  beforeEach(() => {
    pipe = new FileTypeValidationPipe();
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  describe('transform', () => {
    const createMockFile = (mimetype: string): Express.Multer.File => ({
      fieldname: 'file',
      originalname: 'test',
      encoding: '7bit',
      mimetype,
      buffer: Buffer.from(''),
      size: 100,
      stream: null as any,
      destination: '',
      filename: '',
      path: '',
    });

    it('should return the file if mimetype is application/json', () => {
      const file = createMockFile('application/json');
      const result = pipe.transform(file);
      expect(result).toBe(file);
    });

    it('should return the file if mimetype is text/csv', () => {
      const file = createMockFile('text/csv');
      const result = pipe.transform(file);
      expect(result).toBe(file);
    });

    it('should return the file if mimetype is application/vnd.ms-excel (Excel CSV)', () => {
      const file = createMockFile('application/vnd.ms-excel');
      const result = pipe.transform(file);
      expect(result).toBe(file);
    });

    it('should return the file if mimetype is text/plain', () => {
      const file = createMockFile('text/plain');
      const result = pipe.transform(file);
      expect(result).toBe(file);
    });

    it('should throw BadRequestException if mimetype is invalid (e.g. image/png)', () => {
      const file = createMockFile('image/png');
      expect(() => pipe.transform(file)).toThrow(BadRequestException);
      expect(() => pipe.transform(file)).toThrow('File must be a JSON or CSV');
    });

    it('should throw BadRequestException if mimetype is invalid (e.g. application/pdf)', () => {
      const file = createMockFile('application/pdf');
      expect(() => pipe.transform(file)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException if file is null/undefined', () => {
      expect(() => pipe.transform(undefined as any)).toThrow(BadRequestException);
      expect(() => pipe.transform(null as any)).toThrow('File is required');
    });
  });
});