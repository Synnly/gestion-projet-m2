import { ExecutionContext, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PostOwnerGuard } from '../../../../src/post/guard/IsPostOwnerGuard';
import { PostService } from '../../../../src/post/post.service';
import { Types } from 'mongoose';

describe('PostOwnerGuard', () => {
    let guard: PostOwnerGuard;
    let postService: PostService;

    const mockPostService = {
        findOne: jest.fn(),
    };

    const createMockExecutionContext = (user: any, params: any = {}, body: any = {}): ExecutionContext => {
        return {
            switchToHttp: () => ({
                getRequest: () => ({
                    user,
                    params,
                    body,
                }),
            }),
        } as ExecutionContext;
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PostOwnerGuard,
                {
                    provide: PostService,
                    useValue: mockPostService,
                },
            ],
        }).compile();

        guard = module.get<PostOwnerGuard>(PostOwnerGuard);
        postService = module.get<PostService>(PostService);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(guard).toBeDefined();
    });

    describe('canActivate', () => {
        it('should return false when user is not present', async () => {
            const context = createMockExecutionContext(null, { postId: '507f1f77bcf86cd799439011' });

            const result = await guard.canActivate(context);

            expect(result).toBe(false);
        });

        it('should return false when user.sub is not present', async () => {
            const context = createMockExecutionContext({ role: 'COMPANY' }, { postId: '507f1f77bcf86cd799439011' });

            const result = await guard.canActivate(context);

            expect(result).toBe(false);
        });

        it('should return true when user is ADMIN', async () => {
            const context = createMockExecutionContext(
                { sub: '507f1f77bcf86cd799439011', role: 'ADMIN' },
                { postId: '507f1f77bcf86cd799439012' },
            );

            const result = await guard.canActivate(context);

            expect(result).toBe(true);
            expect(mockPostService.findOne).not.toHaveBeenCalled();
        });

        it('should return true when no postId is provided', async () => {
            const context = createMockExecutionContext({ sub: '507f1f77bcf86cd799439011', role: 'COMPANY' }, {});

            const result = await guard.canActivate(context);

            expect(result).toBe(true);
        });

        it('should return true when user is the post owner (postId in params)', async () => {
            const userId = '507f1f77bcf86cd799439011';
            const postId = '507f1f77bcf86cd799439012';
            const companyId = new Types.ObjectId(userId);

            mockPostService.findOne.mockResolvedValue({
                _id: postId,
                company: { _id: companyId },
            });

            const context = createMockExecutionContext({ sub: userId, role: 'COMPANY' }, { postId });

            const result = await guard.canActivate(context);

            expect(result).toBe(true);
            expect(mockPostService.findOne).toHaveBeenCalledWith(postId);
        });

        it('should return true when user is the post owner (postId in body)', async () => {
            const userId = '507f1f77bcf86cd799439011';
            const postId = '507f1f77bcf86cd799439012';
            const companyId = new Types.ObjectId(userId);

            mockPostService.findOne.mockResolvedValue({
                _id: postId,
                company: { _id: companyId },
            });

            const context = createMockExecutionContext({ sub: userId, role: 'COMPANY' }, {}, { postId });

            const result = await guard.canActivate(context);

            expect(result).toBe(true);
            expect(mockPostService.findOne).toHaveBeenCalledWith(postId);
        });

        it('should throw NotFoundException when user is not the post owner', async () => {
            const userId = '507f1f77bcf86cd799439011';
            const postId = '507f1f77bcf86cd799439012';
            const differentCompanyId = new Types.ObjectId('507f1f77bcf86cd799439099');

            mockPostService.findOne.mockResolvedValue({
                _id: postId,
                company: { _id: differentCompanyId },
            });

            const context = createMockExecutionContext({ sub: userId, role: 'COMPANY' }, { postId });

            await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
            await expect(guard.canActivate(context)).rejects.toThrow(
                `Post with ID ${postId} not found or access denied.`,
            );
        });

        it('should throw NotFoundException when post does not exist', async () => {
            const userId = '507f1f77bcf86cd799439011';
            const postId = '507f1f77bcf86cd799439012';

            mockPostService.findOne.mockResolvedValue(null);

            const context = createMockExecutionContext({ sub: userId, role: 'COMPANY' }, { postId });

            await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
        });

        it('should return false when postService throws an error', async () => {
            const userId = '507f1f77bcf86cd799439011';
            const postId = '507f1f77bcf86cd799439012';

            mockPostService.findOne.mockRejectedValue(new Error('Database error'));

            const context = createMockExecutionContext({ sub: userId, role: 'COMPANY' }, { postId });

            await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
        });
    });
});
