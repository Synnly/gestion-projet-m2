import { plainToInstance } from 'class-transformer';
import { Types } from 'mongoose';
import { TopicDto } from '../../../../../src/forum/topic/dto/topic.dto';

describe('TopicDto', () => {
    describe('transformation', () => {
        it('should transform plain object to TopicDto correctly when all fields are provided', () => {
            const topicId = new Types.ObjectId();
            const messageId1 = new Types.ObjectId();
            const messageId2 = new Types.ObjectId();
            const authorId = new Types.ObjectId();
            const plainData = {
                _id: topicId,
                title: 'Test Topic',
                description: 'Test Description',
                messages: [
                    { obj: { _id: messageId1 } },
                    { obj: { _id: messageId2 } },
                ],
                author: {
                    _id: authorId,
                    firstName: 'John',
                    lastName: 'Doe',
                    name: 'Company Name',
                    email: 'john@example.com',
                    logo: 'logo.png',
                },
                nbMessages: 2,
                createdAt: new Date('2025-01-01'),
                updatedAt: new Date('2025-01-02'),
            };

            const dto = plainToInstance(TopicDto, plainData);

            expect(dto).toBeInstanceOf(TopicDto);
            expect(dto._id).toEqual(topicId);
            expect(dto.title).toBe('Test Topic');
            expect(dto.description).toBe('Test Description');
            expect(dto.messages).toEqual([messageId1, messageId2]);
            expect(dto.author._id).toEqual(authorId);
            expect(dto.author.firstName).toBe('John');
            expect(dto.author.lastName).toBe('Doe');
            expect(dto.author.name).toBe('Company Name');
            expect(dto.author.email).toBe('john@example.com');
            expect(dto.author.logo).toBe('logo.png');
            expect(dto.nbMessages).toBe(2);
            expect(dto.createdAt).toEqual(new Date('2025-01-01'));
            expect(dto.updatedAt).toEqual(new Date('2025-01-02'));
        });

        it('should transform _id correctly using @Transform', () => {
            const topicId = new Types.ObjectId();
            const plainData = {
                _id: topicId,
                title: 'Test Topic',
                author: {
                    _id: new Types.ObjectId(),
                    email: 'test@example.com',
                },
                nbMessages: 0,
            };

            const dto = plainToInstance(TopicDto, plainData);

            expect(dto._id).toEqual(topicId);
        });

        it('should transform messages correctly when messages is empty array', () => {
            const topicId = new Types.ObjectId();
            const plainData = {
                _id: topicId,
                title: 'Test Topic',
                messages: [],
                author: {
                    _id: new Types.ObjectId(),
                    email: 'test@example.com',
                },
                nbMessages: 0,
            };

            const dto = plainToInstance(TopicDto, plainData);

            expect(dto.messages).toEqual([]);
        });

        it('should transform messages correctly when messages is null', () => {
            const topicId = new Types.ObjectId();
            const plainData = {
                _id: topicId,
                title: 'Test Topic',
                messages: null,
                author: {
                    _id: new Types.ObjectId(),
                    email: 'test@example.com',
                },
                nbMessages: 0,
            };

            const dto = plainToInstance(TopicDto, plainData);

            expect(dto.messages).toEqual([]);
        });

        it('should transform messages correctly when messages is undefined', () => {
            const topicId = new Types.ObjectId();
            const plainData = {
                _id: topicId,
                title: 'Test Topic',
                author: {
                    _id: new Types.ObjectId(),
                    email: 'test@example.com',
                },
                nbMessages: 0,
            };

            const dto = plainToInstance(TopicDto, plainData);

            expect(dto.messages).toEqual([]);
        });

        it('should handle optional description field', () => {
            const topicId = new Types.ObjectId();
            const plainData = {
                _id: topicId,
                title: 'Test Topic',
                author: {
                    _id: new Types.ObjectId(),
                    email: 'test@example.com',
                },
                nbMessages: 0,
            };

            const dto = plainToInstance(TopicDto, plainData);

            expect(dto.description).toBeUndefined();
        });

        it('should handle optional author fields', () => {
            const topicId = new Types.ObjectId();
            const authorId = new Types.ObjectId();
            const plainData = {
                _id: topicId,
                title: 'Test Topic',
                author: {
                    _id: authorId,
                    email: 'test@example.com',
                },
                nbMessages: 0,
            };

            const dto = plainToInstance(TopicDto, plainData);

            expect(dto.author._id).toEqual(authorId);
            expect(dto.author.email).toBe('test@example.com');
            expect(dto.author.firstName).toBeUndefined();
            expect(dto.author.lastName).toBeUndefined();
            expect(dto.author.name).toBeUndefined();
            expect(dto.author.logo).toBeUndefined();
        });

        it('should exclude extraneous properties when transforming', () => {
            const topicId = new Types.ObjectId();
            const plainData = {
                _id: topicId,
                title: 'Test Topic',
                extraField: 'should be excluded',
                author: {
                    _id: new Types.ObjectId(),
                    email: 'test@example.com',
                },
                nbMessages: 0,
            };

            const dto = plainToInstance(TopicDto, plainData);

            expect(dto).toBeInstanceOf(TopicDto);
            expect((dto as any).extraField).toBeUndefined();
        });

        it('should handle optional createdAt and updatedAt fields', () => {
            const topicId = new Types.ObjectId();
            const plainData = {
                _id: topicId,
                title: 'Test Topic',
                author: {
                    _id: new Types.ObjectId(),
                    email: 'test@example.com',
                },
                nbMessages: 0,
            };

            const dto = plainToInstance(TopicDto, plainData);

            expect(dto.createdAt).toBeUndefined();
            expect(dto.updatedAt).toBeUndefined();
        });
    });
});
