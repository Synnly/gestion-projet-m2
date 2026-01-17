import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { ForumAccessGuard } from '../../../../src/forum/guards/forum-access.guard';

describe('ForumAccessGuard', () => {
    let guard: ForumAccessGuard;
    let forumModel: any;

    const mockForumModel = {
        findById: jest.fn(),
    };

    const createMockExecutionContext = (request: any = {}): ExecutionContext => {
        return {
            switchToHttp: () => ({
                getRequest: () => request,
            }),
            getHandler: jest.fn(),
            getClass: jest.fn(),
        } as unknown as ExecutionContext;
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ForumAccessGuard,
                {
                    provide: getModelToken('Forum'),
                    useValue: mockForumModel,
                },
            ],
        }).compile();

        guard = module.get<ForumAccessGuard>(ForumAccessGuard);
        forumModel = module.get(getModelToken('Forum'));

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(guard).toBeDefined();
    });

    describe('canActivate', () => {
        it('should throw ForbiddenException when user is not authenticated', async () => {
            const context = createMockExecutionContext({
                user: null,
                params: { forumId: new Types.ObjectId().toString() },
            });

            await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
            await expect(guard.canActivate(context)).rejects.toThrow('User not authenticated');
        });

        it('should return true when user is a STUDENT', async () => {
            const context = createMockExecutionContext({
                user: { role: 'STUDENT', sub: new Types.ObjectId() },
                params: { forumId: new Types.ObjectId().toString() },
            });

            const result = await guard.canActivate(context);

            expect(result).toBe(true);
            expect(mockForumModel.findById).not.toHaveBeenCalled();
        });

        it('should return true when user is an ADMIN', async () => {
            const context = createMockExecutionContext({
                user: { role: 'ADMIN', sub: new Types.ObjectId() },
                params: { forumId: new Types.ObjectId().toString() },
            });

            const result = await guard.canActivate(context);

            expect(result).toBe(true);
            expect(mockForumModel.findById).not.toHaveBeenCalled();
        });

        it('should throw NotFoundException when COMPANY user tries to access non-existent forum', async () => {
            const forumId = new Types.ObjectId().toString();
            mockForumModel.findById.mockResolvedValue(null);

            const context = createMockExecutionContext({
                user: { role: 'COMPANY', sub: new Types.ObjectId() },
                params: { forumId },
            });

            await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
            await expect(guard.canActivate(context)).rejects.toThrow('Forum not found');
            expect(mockForumModel.findById).toHaveBeenCalledWith(forumId);
        });

        it('should return true when COMPANY user accesses general forum (no company)', async () => {
            const forumId = new Types.ObjectId().toString();
            mockForumModel.findById.mockResolvedValue({
                _id: forumId,
                company: null,
            });

            const context = createMockExecutionContext({
                user: { role: 'COMPANY', sub: new Types.ObjectId() },
                params: { forumId },
            });

            const result = await guard.canActivate(context);

            expect(result).toBe(true);
            expect(mockForumModel.findById).toHaveBeenCalledWith(forumId);
        });

        it('should return true when COMPANY user accesses their own company forum', async () => {
            const companyId = new Types.ObjectId();
            const forumId = new Types.ObjectId().toString();
            mockForumModel.findById.mockResolvedValue({
                _id: forumId,
                company: { _id: companyId },
            });

            const context = createMockExecutionContext({
                user: { role: 'COMPANY', sub: companyId },
                params: { forumId },
            });

            const result = await guard.canActivate(context);

            expect(result).toBe(true);
            expect(mockForumModel.findById).toHaveBeenCalledWith(forumId);
        });

        it('should throw ForbiddenException when COMPANY user tries to access another company forum', async () => {
            const companyId = new Types.ObjectId();
            const otherCompanyId = new Types.ObjectId();
            const forumId = new Types.ObjectId().toString();
            mockForumModel.findById.mockResolvedValue({
                _id: forumId,
                company: { _id: otherCompanyId },
            });

            const context = createMockExecutionContext({
                user: { role: 'COMPANY', sub: companyId },
                params: { forumId },
            });

            await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
            await expect(guard.canActivate(context)).rejects.toThrow('Access denied to this forum');
            expect(mockForumModel.findById).toHaveBeenCalledWith(forumId);
        });

        it('should throw ForbiddenException when user has an unknown role', async () => {
            const context = createMockExecutionContext({
                user: { role: 'UNKNOWN_ROLE', sub: new Types.ObjectId() },
                params: { forumId: new Types.ObjectId().toString() },
            });

            await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
            await expect(guard.canActivate(context)).rejects.toThrow('Access denied to this forum');
        });

        it('should return true when COMPANY user accesses forum with undefined company._id', async () => {
            const forumId = new Types.ObjectId().toString();
            mockForumModel.findById.mockResolvedValue({
                _id: forumId,
                company: { _id: undefined },
            });

            const context = createMockExecutionContext({
                user: { role: 'COMPANY', sub: new Types.ObjectId() },
                params: { forumId },
            });

            const result = await guard.canActivate(context);

            expect(result).toBe(true);
            expect(mockForumModel.findById).toHaveBeenCalledWith(forumId);
        });
    });
});
