import { Types } from 'mongoose';
import { plainToInstance } from 'class-transformer';
import { MessageDto } from '../../../../../src/forum/message/dto/messageDto';
describe('MessageDto', () => {
    describe('transformation', () => {
        it('should transform plain object to MessageDto correctly when all fields are provided and student is author', () => {
            const messageId = new Types.ObjectId();
            const authorId = new Types.ObjectId();
            const parentMessageId = new Types.ObjectId();
            const plainData = {
                _id: messageId,
                authorId: {
                    _id: authorId,
                    firstName: 'Jane',
                    lastName: 'Smith',
                    email: 'toto@toto.com',
                    studentNumber: 'S123456',
                    isFirstTime: false,
                    role: 'STUDENT',
                },
                content: 'This is a test message',
                parentMessageId: {
                    _id: parentMessageId,
                    content: 'Parent message content',
                    authorId: {
                        _id: new Types.ObjectId(),
                        name: 'Company Name',
                        email: 'totoCorp@corp.com',
                        logo: '',
                        role: 'COMPANY',
                    },
                },
                createdAt: new Date('2025-02-01'),
            };
            const dto = plainToInstance(MessageDto, plainData);
            expect(dto._id).toEqual(messageId);
            expect(dto.authorId._id).toEqual(authorId);
            expect(dto.authorId.firstName).toBe('Jane');
            expect(dto.authorId.lastName).toBe('Smith');
            expect(dto.authorId.email).toBe('toto@toto.com');
            expect(dto.authorId.studentNumber).toBe('S123456');
            expect(dto.authorId.isFirstTime).toBe(false);
            expect(dto.content).toBe('This is a test message');
            expect(dto.parentMessageId?._id).toEqual(parentMessageId);
            expect(dto.parentMessageId?.content).toBe('Parent message content');
            expect(dto.parentMessageId?.authorId._id).toBeDefined();
            expect(dto.parentMessageId?.authorId.name).toBe('Company Name');
            expect(dto.parentMessageId?.authorId.email).toBe('totoCorp@corp.com');
            expect(dto.createdAt).toEqual(new Date('2025-02-01'));
        });
    });
});
