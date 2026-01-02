import { validate } from 'class-validator';
import { Types } from 'mongoose';
import { UpdateTopicDto } from '../../../../../src/forum/topic/dto/updateTopic.dto';

describe('UpdateTopicDto', () => {
    describe('validation', () => {
        it('should validate successfully when valid messages array is provided', async () => {
            const dto = new UpdateTopicDto();
            dto.messages = [new Types.ObjectId().toString(), new Types.ObjectId().toString()] as any;

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should validate successfully when messages array is empty', async () => {
            const dto = new UpdateTopicDto();
            dto.messages = [];

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should fail validation when messages is not an array', async () => {
            const dto = new UpdateTopicDto();
            (dto as any).messages = 'not-an-array';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const messagesError = errors.find((e) => e.property === 'messages');
            expect(messagesError).toBeDefined();
            expect(messagesError?.constraints).toHaveProperty('isArray');
        });

        it('should fail validation when messages contains non-MongoId values', async () => {
            const dto = new UpdateTopicDto();
            (dto as any).messages = ['invalid-id', 'another-invalid-id'];

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const messagesError = errors.find((e) => e.property === 'messages');
            expect(messagesError).toBeDefined();
        });

        it('should fail validation when messages contains duplicate values', async () => {
            const dto = new UpdateTopicDto();
            const sameId = new Types.ObjectId().toString();
            (dto as any).messages = [sameId, sameId];

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const messagesError = errors.find((e) => e.property === 'messages');
            expect(messagesError).toBeDefined();
            expect(messagesError?.constraints).toHaveProperty('arrayUnique');
        });

        it('should fail validation when messages array contains mixed valid and invalid MongoIds', async () => {
            const dto = new UpdateTopicDto();
            (dto as any).messages = [new Types.ObjectId().toString(), 'invalid-id'];

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const messagesError = errors.find((e) => e.property === 'messages');
            expect(messagesError).toBeDefined();
        });

        it('should fail validation when messages is null', async () => {
            const dto = new UpdateTopicDto();
            (dto as any).messages = null;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const messagesError = errors.find((e) => e.property === 'messages');
            expect(messagesError).toBeDefined();
            expect(messagesError?.constraints).toHaveProperty('isArray');
        });

        it('should fail validation when messages is undefined', async () => {
            const dto = new UpdateTopicDto();

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const messagesError = errors.find((e) => e.property === 'messages');
            expect(messagesError).toBeDefined();
        });

        it('should fail validation when messages contains non-ObjectId types', async () => {
            const dto = new UpdateTopicDto();
            (dto as any).messages = [123, 456];

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const messagesError = errors.find((e) => e.property === 'messages');
            expect(messagesError).toBeDefined();
        });

        it('should validate successfully with single message', async () => {
            const dto = new UpdateTopicDto();
            dto.messages = [new Types.ObjectId().toString()] as any;

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should validate successfully with multiple unique messages', async () => {
            const dto = new UpdateTopicDto();
            dto.messages = [
                new Types.ObjectId().toString(),
                new Types.ObjectId().toString(),
                new Types.ObjectId().toString(),
            ] as any;

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });
    });
});
