import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class FileTypeValidationPipe implements PipeTransform {
  transform(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required');

    const allowedMimeTypes = [
      'application/json',
      'text/csv',
      'application/vnd.ms-excel',
      'text/plain',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) throw new BadRequestException('File must be a JSON or CSV');

    return file;
  }
}