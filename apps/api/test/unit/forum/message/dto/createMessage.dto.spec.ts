import { CreateMessageDto } from '../../../../../src/forum/message/dto/createMessageDto';
import { validate } from 'class-validator';
import { Types } from 'mongoose';
describe('CreateMessageDto', () => {
    describe('authorId validation', () => {
        it('authorId must be not null', async () => {
            const dto = new CreateMessageDto();
            dto.content = 'toto';
            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
        });
        it('authorId must be mongo objectId and fail if simple string is provided', async () => {
            const dto = new CreateMessageDto();
            dto.content = 'toto';
            dto.authorId = 'tata';
            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
        });
        it('authorId must be mongoId and success if mongoId is provided', async () => {
            const dto = new CreateMessageDto();
            dto.content = 'toto';
            dto.authorId = new Types.ObjectId().toString();
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });
    });
    describe('content validation', () => {
        it('content must be not null', async () => {
            const dto = new CreateMessageDto();
            dto.authorId = new Types.ObjectId().toString();
            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
        });

        it('content must be string and fail if number is provided', async () => {
            const dto = new CreateMessageDto();
            dto.authorId = new Types.ObjectId().toString();
            dto.content = 123 as any;
            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
        });
        it('content must be string and success if string is provided', async () => {
            const dto = new CreateMessageDto();
            dto.authorId = new Types.ObjectId().toString();
            dto.content = 'toto';
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });
    });
    describe('replyId validation', () => {
        it('replyId is optional, so it can be null', async () => {
            const dto = new CreateMessageDto();
            dto.authorId = new Types.ObjectId().toString();
            dto.content = 'toto';
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });
        it('replyId must be mongo objectId and fail if simple string is provided', async () => {
            const dto = new CreateMessageDto();
            dto.authorId = new Types.ObjectId().toString();
            dto.content = 'toto';
            dto.parentMessageId = 'tata';
            const errors = await validate(dto);
            expect(errors).toHaveLength(1);
        });
        it('replyId must be mongoId and success if mongoId is provided', async () => {
            const dto = new CreateMessageDto();
            dto.content = 'toto';
            dto.authorId = new Types.ObjectId().toString();
            dto.parentMessageId = new Types.ObjectId().toString();
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });
    });
});
