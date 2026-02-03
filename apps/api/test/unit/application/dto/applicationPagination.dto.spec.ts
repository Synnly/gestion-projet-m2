import { plainToInstance } from 'class-transformer';
import { ApplicationPaginationDto, ApplicationDto } from '../../../../src/application/dto/application.dto';
import { ApplicationStatus } from '../../../../src/application/application.schema';
import { Types } from 'mongoose';

describe('applicationPaginationDto', () => {
    describe('transformation', () => {
        it('should transform plain object to ApplicationPaginationDto correctly when all fields are provided', () => {
            const applicationId = new Types.ObjectId();
            const postId = new Types.ObjectId();
            const studentId = new Types.ObjectId();

            const plainData = {
                data: [
                    {
                        _id: applicationId,
                        post: {
                            _id: postId,
                            title: 'Test Post',
                            description: 'Test Description',
                        },
                        student: {
                            _id: studentId,
                            firstName: 'John',
                            lastName: 'Doe',
                            email: 'john@example.com',
                            studentNumber: 'S12345',
                        },
                        status: ApplicationStatus.Pending,
                        cv: 'cv.pdf',
                        coverLetter: 'cover.pdf',
                        createdAt: '2025-01-01T00:00:00.000Z',
                    },
                ],
                total: 1,
                page: 1,
                limit: 10,
            };

            const dto = plainToInstance(ApplicationPaginationDto, plainData);

            expect(dto.total).toBe(1);
            expect(dto.page).toBe(1);
            expect(dto.limit).toBe(10);
            expect(dto.data).toHaveLength(1);
            expect(dto.data[0]).toBeInstanceOf(ApplicationDto);
        });

        it('should transform empty data array correctly', () => {
            const plainData = {
                data: [],
                total: 0,
                page: 1,
                limit: 10,
            };

            const dto = plainToInstance(ApplicationPaginationDto, plainData);

            expect(dto.total).toBe(0);
            expect(dto.page).toBe(1);
            expect(dto.limit).toBe(10);
            expect(dto.data).toHaveLength(0);
        });

        it('should transform multiple applications correctly', () => {
            const plainData = {
                data: [
                    {
                        _id: new Types.ObjectId(),
                        post: { _id: new Types.ObjectId(), title: 'Post 1' },
                        student: { _id: new Types.ObjectId(), firstName: 'John', lastName: 'Doe' },
                        status: ApplicationStatus.Pending,
                        cv: 'cv1.pdf',
                    },
                    {
                        _id: new Types.ObjectId(),
                        post: { _id: new Types.ObjectId(), title: 'Post 2' },
                        student: { _id: new Types.ObjectId(), firstName: 'Jane', lastName: 'Doe' },
                        status: ApplicationStatus.Accepted,
                        cv: 'cv2.pdf',
                    },
                ],
                total: 25,
                page: 2,
                limit: 10,
            };

            const dto = plainToInstance(ApplicationPaginationDto, plainData);

            expect(dto.total).toBe(25);
            expect(dto.page).toBe(2);
            expect(dto.limit).toBe(10);
            expect(dto.data).toHaveLength(2);
        });

        it('should exclude extraneous values when excludeExtraneousValues is true', () => {
            const plainData = {
                data: [],
                total: 0,
                page: 1,
                limit: 10,
                extraField: 'should be excluded',
            };

            const dto = plainToInstance(ApplicationPaginationDto, plainData, { excludeExtraneousValues: true });

            expect((dto as any).extraField).toBeUndefined();
            expect(dto.total).toBe(0);
        });
    });
});
