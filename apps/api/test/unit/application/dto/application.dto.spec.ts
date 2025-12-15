import { plainToInstance } from 'class-transformer';
import { Types } from 'mongoose';
import { ApplicationDto } from '../../../../src/application/dto/application.dto';
import { ApplicationStatus } from '../../../../src/application/application.schema';

describe('ApplicationDto', () => {
    describe('transformation', () => {
        it('should map exposed fields when created from plain object with full data', () => {
            const applicationId = new Types.ObjectId('507f1f77bcf86cd799439011');
            const data: any = {
                _id: applicationId,
                post: { _id: new Types.ObjectId('507f1f77bcf86cd799439012'), title: 'Post title' },
                student: { _id: new Types.ObjectId('507f1f77bcf86cd799439013'), firstName: 'John', lastName: 'Doe' },
                status: ApplicationStatus.Accepted,
                cv: 'cv.pdf',
                coverLetter: 'lm.docx',
                deletedAt: new Date(),
            };

            const dto = plainToInstance(ApplicationDto, data, { excludeExtraneousValues: true });

            expect(dto._id.toHexString()).toBe(applicationId.toHexString());
            expect(dto.status).toBe(ApplicationStatus.Accepted);
            expect(dto.cv).toBe('cv.pdf');
            expect(dto.coverLetter).toBe('lm.docx');
            expect((dto as any).deletedAt).toBeUndefined();
        });

        it('should create dto with minimal fields when coverLetter is missing', () => {
            const applicationId = new Types.ObjectId('507f1f77bcf86cd799439014');
            const data: any = {
                _id: applicationId,
                post: { _id: new Types.ObjectId('507f1f77bcf86cd799439015'), title: 'Another post' },
                student: { _id: new Types.ObjectId('507f1f77bcf86cd799439016'), firstName: 'Jane', lastName: 'Smith' },
                status: ApplicationStatus.Pending,
                cv: 'resume.doc',
            };

            const dto = plainToInstance(ApplicationDto, data, { excludeExtraneousValues: true });

            expect(dto._id.toHexString()).toBe(applicationId.toHexString());
            expect(dto.status).toBe(ApplicationStatus.Pending);
            expect(dto.coverLetter).toBeUndefined();
        });
    });
});
