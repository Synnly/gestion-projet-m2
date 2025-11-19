import { ParseObjectIdPipe } from '../../../src/validators/parseObjectId.pipe';
import { Types } from 'mongoose';
import { BadRequestException } from '@nestjs/common';

describe('ParseObjectIdPipe', () => {
    const pipe = new ParseObjectIdPipe();

    it('should transform a valid ObjectId string to Types.ObjectId', () => {
        const id = new Types.ObjectId().toHexString();
        const res = pipe.transform(id);
        expect(res).toBeInstanceOf(Types.ObjectId);
        expect(res.toHexString()).toBe(id);
    });

    it('should throw BadRequestException when value is empty', () => {
        expect(() => pipe.transform('' as any)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException when value is not a valid ObjectId', () => {
        expect(() => pipe.transform('not-an-objectid')).toThrow(BadRequestException);
    });
});
