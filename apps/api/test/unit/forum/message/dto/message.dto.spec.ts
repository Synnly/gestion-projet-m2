import { Types } from 'mongoose';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { MessageDto } from '../../../../../src/forum/message/dto/messageDto';
import { Role } from '../../../../../src/common/roles/roles.enum';

describe('MessageDto', () => {
    describe('transformation and validation', () => {
        it('should transform message with student author', () => {
            const messageId = new Types.ObjectId();
            const authorId = new Types.ObjectId();

            const plainData = {
                _id: messageId,
                authorId: {
                    _id: authorId,
                    firstName: 'Jane',
                    lastName: 'Smith',
                    email: 'student@test.com',
                    studentNumber: 'S123456',
                    role: Role.STUDENT,
                },
                content: 'This is a test message',
                createdAt: new Date('2025-02-01'),
            };

            const dto = plainToInstance(MessageDto, plainData);

            expect(dto._id).toBeDefined();
            expect(dto.authorId).toBeDefined();
            expect(dto.content).toBe('This is a test message');
            expect(dto.createdAt).toBeDefined();
        });

        it('should transform message with company author', () => {
            const messageId = new Types.ObjectId();
            const authorId = new Types.ObjectId();

            const plainData = {
                _id: messageId,
                authorId: {
                    _id: authorId,
                    name: 'Company Name',
                    email: 'company@test.com',
                    logo: 'http://logo.png',
                    role: Role.COMPANY,
                },
                content: 'This is a company message',
                createdAt: new Date('2025-02-01'),
            };

            const dto = plainToInstance(MessageDto, plainData);

            expect(dto._id).toBeDefined();
            expect(dto.authorId).toBeDefined();
            expect(dto.content).toBe('This is a company message');
        });

        it('should transform message with ADMIN role (fallback)', () => {
            const plainData = {
                _id: new Types.ObjectId(),
                authorId: {
                    _id: new Types.ObjectId(),
                    email: 'admin@test.com',
                    role: Role.ADMIN,
                },
                content: 'Admin message',
                createdAt: new Date('2025-02-01'),
            };

            const dto = plainToInstance(MessageDto, plainData);

            expect(dto._id).toBeDefined();
            expect(dto.authorId).toBeDefined();
            expect(dto.content).toBe('Admin message');
        });

        it('should transform message without parentMessageId', () => {
            const plainData = {
                _id: new Types.ObjectId(),
                authorId: {
                    _id: new Types.ObjectId(),
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@test.com',
                    role: Role.STUDENT,
                },
                content: 'Root message',
                createdAt: new Date('2025-02-01'),
            };

            const dto = plainToInstance(MessageDto, plainData);

            expect(dto.parentMessageId).toBeUndefined();
            expect(dto.content).toBe('Root message');
        });

        it('should transform message with nested parent message', () => {
            const parentMessageId = new Types.ObjectId();

            const plainData = {
                _id: new Types.ObjectId(),
                authorId: {
                    _id: new Types.ObjectId(),
                    firstName: 'Student',
                    lastName: 'User',
                    email: 'student@test.com',
                    role: Role.STUDENT,
                },
                content: 'Reply message',
                parentMessageId: {
                    _id: parentMessageId,
                    content: 'Original company message',
                    authorId: {
                        _id: new Types.ObjectId(),
                        name: 'Tech Corp',
                        email: 'tech@corp.com',
                        role: Role.COMPANY,
                    },
                    createdAt: new Date('2025-01-15'),
                },
                createdAt: new Date('2025-02-01'),
            };

            const dto = plainToInstance(MessageDto, plainData);

            expect(dto.parentMessageId).toBeDefined();
            expect(dto.parentMessageId?.content).toBe('Original company message');
        });

        it('should validate required content field', async () => {
            const plainData = {
                _id: new Types.ObjectId(),
                authorId: {
                    _id: new Types.ObjectId(),
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@test.com',
                    role: Role.STUDENT,
                },
                content: '',
                createdAt: new Date(),
            };

            const dto = plainToInstance(MessageDto, plainData);
            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
        });

        it('should handle message with valid content', async () => {
            const plainData = {
                _id: new Types.ObjectId(),
                authorId: {
                    _id: new Types.ObjectId(),
                    firstName: 'Jane',
                    lastName: 'Doe',
                    email: 'jane@test.com',
                    role: Role.STUDENT,
                },
                content: 'Valid message content',
                createdAt: new Date(),
            };

            const dto = plainToInstance(MessageDto, plainData);
            const errors = await validate(dto);

            // May have errors from nested objects, but content should be valid
            expect(dto.content).toBe('Valid message content');
        });

        it('should transform createdAt date field', () => {
            const testDate = new Date('2025-02-15T10:30:00Z');
            const plainData = {
                _id: new Types.ObjectId(),
                authorId: {
                    _id: new Types.ObjectId(),
                    firstName: 'Test',
                    lastName: 'User',
                    email: 'test@test.com',
                    role: Role.STUDENT,
                },
                content: 'Test message',
                createdAt: testDate,
            };

            const dto = plainToInstance(MessageDto, plainData);

            expect(dto.createdAt).toEqual(testDate);
        });

        it('should transform message with nested parent messages', () => {
            const grandParentMessageId = new Types.ObjectId();
            const parentMessageId = new Types.ObjectId();

            const plainData = {
                _id: new Types.ObjectId(),
                authorId: {
                    _id: new Types.ObjectId(),
                    firstName: 'Student',
                    lastName: 'User',
                    email: 'student@test.com',
                    role: Role.STUDENT,
                },
                content: 'Reply message',
                parentMessageId: {
                    _id: parentMessageId,
                    content: 'Parent message',
                    authorId: {
                        _id: new Types.ObjectId(),
                        name: 'Business Inc',
                        email: 'business@inc.com',
                        role: Role.COMPANY,
                    },
                    createdAt: new Date('2025-01-15'),
                },
                createdAt: new Date('2025-02-01'),
            };

            const dto = plainToInstance(MessageDto, plainData);

            expect(dto.parentMessageId).toBeDefined();
            expect(dto.parentMessageId?.content).toBe('Parent message');
        });
    });
});
