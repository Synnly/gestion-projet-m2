import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PostService } from '../../../src/post/post.service';
import { PostController } from '../../../src/post/post.controller';
import { PaginationService } from '../../../src/common/pagination/pagination.service';
import { GeoService } from '../../../src/common/geography/geo.service';
import { CompanyService } from '../../../src/company/company.service';

describe('PostModule', () => {
    let module: TestingModule;
    let postService: PostService;
    let postController: PostController;

    const mockPostModel = {
        find: jest.fn(),
        findById: jest.fn(),
        create: jest.fn(),
    };

    const mockJwtService = {
        sign: jest.fn(),
        verify: jest.fn(),
    };

    const mockConfigService = {
        get: jest.fn(),
    };

    const mockPaginationService = {
        paginate: jest.fn(),
    };

    const mockGeoService = {
        geocodeAddress: jest.fn().mockResolvedValue([2.3522, 48.8566]),
    };

    const mockCompanyService = {
        findOne: jest.fn().mockResolvedValue({
            streetNumber: '10',
            streetName: 'Rue de Test',
            postalCode: '75001',
            city: 'Paris',
            country: 'France',
        }),
    };

    beforeEach(async () => {
        module = await Test.createTestingModule({
            controllers: [PostController],
            providers: [
                PostService,
                {
                    provide: 'PostModel',
                    useValue: mockPostModel,
                },
                {
                    provide: JwtService,
                    useValue: mockJwtService,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
                {
                    provide: PaginationService,
                    useValue: mockPaginationService,
                },
                {
                    provide: GeoService,
                    useValue: mockGeoService,
                },
                {
                    provide: CompanyService,
                    useValue: mockCompanyService,
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
