import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationController } from '../../../src/application/application.controller';
import { ApplicationService } from '../../../src/application/application.service';
import { ApplicationDto } from '../../../src/application/dto/application.dto';
import { ApplicationStatus } from '../../../src/application/application.schema';
import { CreateApplicationDto } from '../../../src/application/dto/createApplication.dto';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AuthGuard } from '../../../src/auth/auth.guard';
import { RolesGuard } from '../../../src/common/roles/roles.guard';
import { ApplicationOwnerGuard } from '../../../src/common/roles/applicationOwner.guard';
import { PostOwnerGuard } from 'src/post/guard/IsPostOwnerGuard';

describe('ApplicationController', () => {
    let controller: ApplicationController;
    let service: ApplicationService;

    const mockApplicationService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        updateStatus: jest.fn(),
    };

    const mockAuthGuard = { canActivate: jest.fn().mockReturnValue(true) };
    const mockRolesGuard = { canActivate: jest.fn().mockReturnValue(true) };
    const mockApplicationOwnerGuard = { canActivate: jest.fn().mockReturnValue(true) };
    const mockPostOwnerGuard = { canActivate: jest.fn().mockReturnValue(true) };
    const applicationId = new Types.ObjectId('507f1f77bcf86cd799439011');
    const studentId = new Types.ObjectId('507f1f77bcf86cd799439012');
    const postId = new Types.ObjectId('507f1f77bcf86cd799439013');

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ApplicationController],
            providers: [
                {
                    provide: ApplicationService,
                    useValue: mockApplicationService,
                },
            ],
        })
            .overrideGuard(AuthGuard)
            .useValue(mockAuthGuard)
            .overrideGuard(RolesGuard)
            .useValue(mockRolesGuard)
            .overrideGuard(ApplicationOwnerGuard)
            .useValue(mockApplicationOwnerGuard)
            .overrideGuard(PostOwnerGuard)
            .useValue(mockPostOwnerGuard)
            .compile();

        controller = module.get<ApplicationController>(ApplicationController);
        service = module.get<ApplicationService>(ApplicationService);

        jest.clearAllMocks();
    });

    it('should be defined when controller is instantiated', () => {
        expect(controller).toBeDefined();
    });

    describe('findAll', () => {
        it('should return an array of ApplicationDto when findAll is called with existing applications', async () => {
            const applications = [
                {
                    _id: applicationId,
                    post: { _id: postId, title: 'Test post' },
                    student: { _id: studentId, firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
                    status: ApplicationStatus.Pending,
                    cv: 'cv.pdf',
                    coverLetter: 'lm.docx',
                    deletedAt: new Date(),
                },
            ];
            mockApplicationService.findAll.mockResolvedValue(applications);

            const result = await controller.findAll();

            expect(result).toHaveLength(1);
            expect(result[0]).toBeInstanceOf(ApplicationDto);
            expect(result[0]._id.toString()).toBe(applicationId.toString());
            expect((result[0] as any).deletedAt).toBeUndefined();
            expect(service.findAll).toHaveBeenCalledTimes(1);
        });

        it('should return an empty array when findAll is called and no applications exist', async () => {
            mockApplicationService.findAll.mockResolvedValue([]);

            const result = await controller.findAll();

            expect(result).toEqual([]);
            expect(service.findAll).toHaveBeenCalledTimes(1);
        });
    });

    describe('findOne', () => {
        it('should return an ApplicationDto when a valid id is provided and application exists', async () => {
            const application = {
                _id: applicationId,
                post: { _id: postId, title: 'Post' },
                student: { _id: studentId, firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' },
                status: ApplicationStatus.Accepted,
                cv: 'cv.pdf',
                coverLetter: 'cover.docx',
            };
            mockApplicationService.findOne.mockResolvedValue(application);

            const result = await controller.findOne(applicationId);

            expect(result).toBeInstanceOf(ApplicationDto);
            expect(result._id.toString()).toBe(applicationId.toString());
            expect(result.status).toBe(ApplicationStatus.Accepted);
            expect(service.findOne).toHaveBeenCalledWith(applicationId);
        });

        it('should throw NotFoundException when application does not exist for the provided id', async () => {
            mockApplicationService.findOne.mockResolvedValue(null);

            await expect(controller.findOne(applicationId)).rejects.toThrow(NotFoundException);
            await expect(controller.findOne(applicationId)).rejects.toThrow(
                `Application with id ${applicationId} not found`,
            );
            expect(service.findOne).toHaveBeenCalledWith(applicationId);
        });

        it('should await service result before mapping when service returns a Promise', async () => {
            const application = {
                _id: applicationId,
                post: { _id: postId, title: 'Async Post' },
                student: { _id: studentId, firstName: 'Async', lastName: 'User', email: 'async@example.com' },
                status: ApplicationStatus.Read,
                cv: 'cv.pdf',
            };
            mockApplicationService.findOne.mockImplementation(async () => application);

            const result = await controller.findOne(applicationId);

            expect(result._id.toString()).toBe(applicationId.toString());
            expect(result.status).toBe(ApplicationStatus.Read);
        });
    });

    describe('create', () => {
        it('should return upload urls when create is called with valid data', async () => {
            const dto: CreateApplicationDto = { cvExtension: 'pdf', lmExtension: 'docx' };
            const creationResult = { cvUrl: 'cv-upload-url', lmUrl: 'lm-upload-url' };
            mockApplicationService.create.mockResolvedValue(creationResult);

            const result = await controller.create(studentId, postId, dto);

            expect(result).toEqual(creationResult);
            expect(service.create).toHaveBeenCalledWith(studentId, postId, dto);
        });
    });

    describe('updateStatus', () => {
        it('should call service updateStatus when updateStatus is invoked with valid id and status', async () => {
            mockApplicationService.updateStatus.mockResolvedValue(undefined);

            await controller.updateStatus(applicationId, ApplicationStatus.Read);

            expect(service.updateStatus).toHaveBeenCalledWith(applicationId, ApplicationStatus.Read);
            expect(service.updateStatus).toHaveBeenCalledTimes(1);
        });
    });
});
