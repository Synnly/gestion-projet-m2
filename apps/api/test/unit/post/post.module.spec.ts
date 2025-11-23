import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule'; // <--- Ajout
import { getModelToken } from '@nestjs/mongoose'; // <--- Ajout

import { PostService } from '../../../src/post/post.service';
import { PostController } from '../../../src/post/post.controller';
import { Post } from '../../../src/post/post.schema'; // <--- Ajout
import { Company } from '../../../src/company/company.schema'; // <--- Ajout

describe('PostModule', () => {
    let module: TestingModule;
    let postService: PostService;
    let postController: PostController;

    // Mocks
    const mockPostModel = {
        find: jest.fn(),
        findById: jest.fn(),
        create: jest.fn(),
    };

    const mockCompanyModel = {
        find: jest.fn(),
        findOne: jest.fn(),
    };

    const mockJwtService = {
        sign: jest.fn(),
        verify: jest.fn(),
    };

    const mockConfigService = {
        get: jest.fn(),
    };

    const mockSchedulerRegistry = {
        addCronJob: jest.fn(),
        deleteCronJob: jest.fn(),
    };

    beforeEach(async () => {
        module = await Test.createTestingModule({
            controllers: [PostController],
            providers: [
                PostService,
                {
                    provide: getModelToken(Post.name),
                    useValue: mockPostModel,
                },
                {
                    provide: getModelToken(Company.name),
                    useValue: mockCompanyModel,
                },
                // Services
                {
                    provide: JwtService,
                    useValue: mockJwtService,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
                {
                    provide: SchedulerRegistry,
                    useValue: mockSchedulerRegistry,
                },
            ],
        }).compile();

        postService = module.get<PostService>(PostService);
        postController = module.get<PostController>(PostController);
    });

    it('should be defined when module is instantiated', () => {
        expect(module).toBeDefined();
    });

    it('should provide PostService when module is instantiated', () => {
        expect(postService).toBeDefined();
        expect(postService).toBeInstanceOf(PostService);
    });

    it('should provide PostController when module is instantiated', () => {
        expect(postController).toBeDefined();
        expect(postController).toBeInstanceOf(PostController);
    });

    it('should export PostService when module is instantiated', () => {
        expect(postService).toBeDefined();
    });
});