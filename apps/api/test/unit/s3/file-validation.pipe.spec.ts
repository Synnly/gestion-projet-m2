import { BadRequestException } from '@nestjs/common';
import { FileValidationPipe, FileValidator } from '../../../src/s3/pipes/file-validation.pipe';

describe('FileValidationPipe', () => {
  let pipe: FileValidationPipe;

  beforeEach(() => {
    pipe = new FileValidationPipe();
  });

  describe('transform', () => {
    it('should validate a correct logo filename', async () => {
      const dto = {
        originalFilename: 'company-logo.png',
        fileType: 'logo',
      };

      const result = await pipe.transform(dto);

      expect(result).toEqual(dto);
    });

    it('should validate a correct CV filename', async () => {
      const dto = {
        originalFilename: 'resume.pdf',
        fileType: 'cv',
      };

      const result = await pipe.transform(dto);

      expect(result).toEqual(dto);
    });

    it('should reject missing originalFilename', async () => {
      const dto = {
        fileType: 'logo',
      };

      await expect(pipe.transform(dto)).rejects.toThrow(BadRequestException);
      await expect(pipe.transform(dto)).rejects.toThrow('originalFilename is required');
    });

    it('should reject null or undefined value', async () => {
      await expect(pipe.transform(null)).rejects.toThrow(BadRequestException);
      await expect(pipe.transform(undefined)).rejects.toThrow(BadRequestException);
    });

    it('should reject path traversal attempts with ..', async () => {
      const dto = {
        originalFilename: '../../../etc/passwd',
        fileType: 'logo',
      };

      await expect(pipe.transform(dto)).rejects.toThrow('path traversal detected');
    });

    it('should reject path traversal attempts with /', async () => {
      const dto = {
        originalFilename: 'path/to/file.png',
        fileType: 'logo',
      };

      await expect(pipe.transform(dto)).rejects.toThrow('path traversal detected');
    });

    it('should reject path traversal attempts with backslash', async () => {
      const dto = {
        originalFilename: 'path\\to\\file.png',
        fileType: 'logo',
      };

      await expect(pipe.transform(dto)).rejects.toThrow('path traversal detected');
    });

    it('should reject null byte in filename', async () => {
      const dto = {
        originalFilename: 'file\0.png',
        fileType: 'logo',
      };

      await expect(pipe.transform(dto)).rejects.toThrow('null byte detected');
    });

    it('should reject filename without extension', async () => {
      const dto = {
        originalFilename: 'noextension',
        fileType: 'logo',
      };

      await expect(pipe.transform(dto)).rejects.toThrow(BadRequestException);
      await expect(pipe.transform(dto)).rejects.toThrow('Invalid file extension');
    });

    it('should reject invalid extension for logo', async () => {
      const dto = {
        originalFilename: 'document.pdf',
        fileType: 'logo',
      };

      await expect(pipe.transform(dto)).rejects.toThrow('Invalid file extension for logo');
    });

    it('should reject invalid extension for CV', async () => {
      const dto = {
        originalFilename: 'image.png',
        fileType: 'cv',
      };

      await expect(pipe.transform(dto)).rejects.toThrow('Invalid file extension for cv');
    });

    it('should accept all valid logo extensions', async () => {
      const validExtensions = ['png', 'jpg', 'jpeg', 'svg'];

      for (const ext of validExtensions) {
        const dto = {
          originalFilename: `logo.${ext}`,
          fileType: 'logo',
        };
        await expect(pipe.transform(dto)).resolves.toEqual(dto);
      }
    });

    it('should accept all valid CV extensions', async () => {
      const validExtensions = ['pdf', 'doc', 'docx'];

      for (const ext of validExtensions) {
        const dto = {
          originalFilename: `resume.${ext}`,
          fileType: 'cv',
        };
        await expect(pipe.transform(dto)).resolves.toEqual(dto);
      }
    });

    it('should be case-insensitive for extensions', async () => {
      const dto = {
        originalFilename: 'logo.PNG',
        fileType: 'logo',
      };

      const result = await pipe.transform(dto);
      expect(result).toEqual(dto);
    });

    it('should handle filenames with multiple dots', async () => {
      const dto = {
        originalFilename: 'my.company.logo.png',
        fileType: 'logo',
      };

      const result = await pipe.transform(dto);
      expect(result).toEqual(dto);
    });
  });
});

describe('FileValidator', () => {
  describe('sanitizeSvg', () => {
    it('should remove script tags from SVG', () => {
      const svgWithScript = '<svg><script>alert("xss")</script><circle /></svg>';
      const result = FileValidator.sanitizeSvg(svgWithScript);

      expect(result).not.toContain('<script');
      expect(result).toContain('<svg>');
    });

    it('should remove onclick attributes', () => {
      const svgWithOnclick = '<svg><rect onclick="alert()" /></svg>';
      const result = FileValidator.sanitizeSvg(svgWithOnclick);

      expect(result).not.toContain('onclick');
    });

    it('should throw error if SVG is invalid after sanitization', () => {
      const invalidSvg = '<script>alert("xss")</script>';

      expect(() => FileValidator.sanitizeSvg(invalidSvg)).toThrow(
        'Invalid SVG content after sanitization',
      );
    });

    it('should remove iframe tags from SVG', () => {
      const svgWithIframe = '<svg><iframe src="evil.com"></iframe></svg>';
      const result = FileValidator.sanitizeSvg(svgWithIframe);

      expect(result).not.toContain('<iframe');
      expect(result).toContain('<svg>');
    });

    it('should throw error if SVG contains forbidden elements that patterns miss', () => {
      // This tests the failsafe check for patterns that might slip through
      // In reality, most should be caught by SVG_DANGEROUS_PATTERNS
      const svgWithForbidden = '<svg>< script>alert()</ script></svg>'; // Space to bypass pattern

      expect(() => FileValidator.sanitizeSvg(svgWithForbidden)).toThrow(
        'SVG contains forbidden elements',
      );
    });

    it('should preserve valid SVG content', () => {
      const validSvg = '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" /></svg>';
      const result = FileValidator.sanitizeSvg(validSvg);

      expect(result).toContain('<svg');
      expect(result).toContain('<circle');
    });
  });

  describe('validateFileSize', () => {
    it('should accept logo within size limit', () => {
      const size = 1 * 1024 * 1024; // 1MB

      expect(() => FileValidator.validateFileSize(size, 'logo')).not.toThrow();
    });

    it('should accept CV within size limit', () => {
      const size = 5 * 1024 * 1024; // 5MB

      expect(() => FileValidator.validateFileSize(size, 'cv')).not.toThrow();
    });

    it('should reject logo exceeding size limit', () => {
      const size = 3 * 1024 * 1024; // 3MB (> 2MB limit)

      expect(() => FileValidator.validateFileSize(size, 'logo')).toThrow(
        'File size exceeds maximum allowed size of 2MB',
      );
    });

    it('should reject CV exceeding size limit', () => {
      const size = 10 * 1024 * 1024; // 10MB (> 8MB limit)

      expect(() => FileValidator.validateFileSize(size, 'cv')).toThrow(
        'File size exceeds maximum allowed size of 8MB',
      );
    });

    it('should accept file at exact size limit', () => {
      const logoLimit = 2 * 1024 * 1024; // 2MB
      const cvLimit = 8 * 1024 * 1024; // 8MB

      expect(() => FileValidator.validateFileSize(logoLimit, 'logo')).not.toThrow();
      expect(() => FileValidator.validateFileSize(cvLimit, 'cv')).not.toThrow();
    });
  });

  describe('validateMimeType', () => {
    it('should accept valid logo MIME types', () => {
      const validMimeTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];

      for (const mimeType of validMimeTypes) {
        expect(() => FileValidator.validateMimeType(mimeType, 'logo')).not.toThrow();
      }
    });

    it('should accept valid CV MIME types', () => {
      const validMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];

      for (const mimeType of validMimeTypes) {
        expect(() => FileValidator.validateMimeType(mimeType, 'cv')).not.toThrow();
      }
    });

    it('should reject invalid MIME type for logo', () => {
      const invalidMimeType = 'application/pdf';

      expect(() => FileValidator.validateMimeType(invalidMimeType, 'logo')).toThrow(
        'Invalid MIME type for logo',
      );
    });

    it('should reject invalid MIME type for CV', () => {
      const invalidMimeType = 'image/png';

      expect(() => FileValidator.validateMimeType(invalidMimeType, 'cv')).toThrow(
        'Invalid MIME type for cv',
      );
    });
  });
});
