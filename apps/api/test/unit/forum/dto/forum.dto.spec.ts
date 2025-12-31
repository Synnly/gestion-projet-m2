import { Types } from 'mongoose';
import { plainToInstance } from 'class-transformer';
import { ForumDto } from '../../../../src/forum/dto/forum.dto';
import { CompanyDto } from '../../../../src/company/dto/company.dto';

describe('ForumDto', () => {
    describe('transformation', () => {
        it('should transform plain object to ForumDto correctly when all fields are provided', () => {
            const companyId = new Types.ObjectId();
            const forumId = new Types.ObjectId();
            const plainData = {
                _id: forumId,
                company: {
                    _id: companyId,
                    name: 'Test Company',
                },
            };

            const dto = plainToInstance(ForumDto, plainData);

            expect(dto).toBeInstanceOf(ForumDto);
            expect(dto._id).toEqual(forumId);
            expect(dto.company).toBeInstanceOf(CompanyDto);
            expect(dto.company?._id).toEqual(companyId);
            expect(dto.company?.name).toBe('Test Company');
        });

        it('should transform plain object to ForumDto correctly when company is missing (general forum)', () => {
            const forumId = new Types.ObjectId();
            const plainData = {
                _id: forumId,
            };

            const dto = plainToInstance(ForumDto, plainData);

            expect(dto).toBeInstanceOf(ForumDto);
            expect(dto._id).toEqual(forumId);
            expect(dto.company).toBeUndefined();
        });

        it('should transform plain object to ForumDto correctly when company is null', () => {
            const forumId = new Types.ObjectId();
            const plainData = {
                _id: forumId,
                company: null,
            };

            const dto = plainToInstance(ForumDto, plainData);

            expect(dto).toBeInstanceOf(ForumDto);
            expect(dto._id).toEqual(forumId);
            expect(dto.company).toBeNull();
        });

        it('should exclude extraneous properties when transforming', () => {
            const forumId = new Types.ObjectId();
            const plainData = {
                _id: forumId,
                extraField: 'should be excluded',
            };

            const dto = plainToInstance(ForumDto, plainData);

            expect(dto).toBeInstanceOf(ForumDto);
            expect(dto._id).toEqual(forumId);
            expect((dto as any).extraField).toBeUndefined();
        });

        it('should transform _id correctly using @Transform', () => {
            const forumId = new Types.ObjectId();
            const plainData = {
                _id: forumId,
            };

            const dto = plainToInstance(ForumDto, plainData);

            expect(dto._id).toEqual(forumId);
        });
    });
});
