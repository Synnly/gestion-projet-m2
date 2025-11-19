import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

/**
 * Validation pipe that transforms and validates MongoDB ObjectId strings
 * Ensures the provided value is a valid ObjectId format before processing
 */
@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, Types.ObjectId> {
    /**
     * Transforms a string into a MongoDB ObjectId
     * @param value The string value to transform
     * @returns A valid MongoDB ObjectId
     * @throws {BadRequestException} if the value is missing or not a valid ObjectId format
     */
    transform(value: string): Types.ObjectId {
        if (!value) throw new BadRequestException('ObjectId is required');
        if (!Types.ObjectId.isValid(value)) {
            throw new BadRequestException(`Invalid ObjectId: ${value}`);
        }
        return new Types.ObjectId(value);
    }
}
