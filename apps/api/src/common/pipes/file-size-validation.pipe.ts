import { PipeTransform, Injectable, PayloadTooLargeException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FileSizeValidationPipe implements PipeTransform {
  constructor(private readonly configService: ConfigService) {}

  transform(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const maxSize = this.configService.get<number>('IMPORT_MAX_SIZE_BYTES') || 2 * 1024 * 1024;

    if (file.size > maxSize) {
      throw new PayloadTooLargeException(
        `File is too large. Max allowed size is ${maxSize / (1024 * 1024)}MB`
      );
    }

    return file;
  }
}