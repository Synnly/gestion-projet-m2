import { Types } from 'mongoose';
import { StudentDto } from '../../../../src/student/dto/student.dto';

describe('StudentDto', () => {
    describe('constructor', () => {
        it('should map fields correctly from input object', () => {
            const data: any = {
                _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
                email: 's@example.com',
                firstName: 'FN',
                lastName: 'LN',
                studentNumber: 'SN-001',
                isFirstTime: true,
            };

            const dto = new StudentDto(data);

            expect(dto._id.toHexString()).toBe('507f1f77bcf86cd799439011');
            expect(dto.email).toBe('s@example.com');
            expect(dto.firstName).toBe('FN');
            expect(dto.lastName).toBe('LN');
            expect(dto.studentNumber).toBe('SN-001');
            expect(dto.isFirstTime).toBe(true);
        });
    });
});
