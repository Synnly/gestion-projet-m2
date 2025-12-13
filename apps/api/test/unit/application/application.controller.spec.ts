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

describe('ApplicationController', () => {
    let controller: ApplicationController;
    let service: ApplicationService;

    const mockApplicationService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        updateStatus: jest.fn(),
        getApplicationByStudentAndPost: jest.fn(),
        findByStudent: jest.fn(),
    };

    const mockAuthGuard = { canActivate: jest.fn().mockReturnValue(true) };
    const mockRolesGuard = { canActivate: jest.fn().mockReturnValue(true) };
    const mockApplicationOwnerGuard = { canActivate: jest.fn().mockReturnValue(true) };

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
            expect(mockApplicationService.findAll).toHaveBeenCalledTimes(1);
        });

        it('should return an empty array when findAll is called and no applications exist', async () => {
            mockApplicationService.findAll.mockResolvedValue([]);

            const result = await controller.findAll();

            expect(result).toEqual([]);
            expect(mockApplicationService.findAll).toHaveBeenCalledTimes(1);
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
            expect(mockApplicationService.findOne).toHaveBeenCalledWith(applicationId);
        });

        it('should throw NotFoundException when application does not exist for the provided id', async () => {
            mockApplicationService.findOne.mockResolvedValue(null);

            await expect(controller.findOne(applicationId)).rejects.toThrow(NotFoundException);
            await expect(controller.findOne(applicationId)).rejects.toThrow(
                `Application with id ${applicationId.toString()} not found`,
            );
            expect(mockApplicationService.findOne).toHaveBeenCalledWith(applicationId);
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
            expect(mockApplicationService.create).toHaveBeenCalledWith(studentId, postId, dto);
        });
    });

    describe('updateStatus', () => {
        it('should call service updateStatus when updateStatus is invoked with valid id and status', async () => {
            mockApplicationService.updateStatus.mockResolvedValue(undefined);

            await controller.updateStatus(applicationId, ApplicationStatus.Read);

            expect(mockApplicationService.updateStatus).toHaveBeenCalledWith(applicationId, ApplicationStatus.Read);
            expect(mockApplicationService.updateStatus).toHaveBeenCalledTimes(1);
        });
    });
    describe('getApplicationByStudentAndPost', () => {
        it('should return an application when valid studentId and postId are provided', async () => {
            const application = {
                _id: applicationId,
                post: { _id: postId, title: 'Test Post' },
                student: { _id: studentId, firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
                status: ApplicationStatus.Pending,
                cv: 'cv.pdf',
                coverLetter: 'lm.docx',
            };
            mockApplicationService.getApplicationByStudentAndPost.mockResolvedValue(application);

            const result = await controller.getApplicationByStudentAndPost(studentId, postId);
            expect(result).toBeDefined();
            expect(result).not.toBeNull();
            expect(result).toBeInstanceOf(ApplicationDto);
            expect(result?._id.toString()).toBe(applicationId.toString());
            expect(result?.status).toBe(ApplicationStatus.Pending);
            expect(service.getApplicationByStudentAndPost).toHaveBeenCalledWith(studentId, postId);
        });

        it('should throw NotFoundException when no application is found for the provided studentId and postId', async () => {
            mockApplicationService.getApplicationByStudentAndPost.mockResolvedValue(null);

            expect(await controller.getApplicationByStudentAndPost(studentId, postId)).toBeNull();
            expect(service.getApplicationByStudentAndPost).toHaveBeenCalledWith(studentId, postId);
        });
    });

    describe('findMine', () => {
        it('devrait retourner une pagination filtree pour un etudiant', async () => {
            const pagination = {
                data: [
                    {
                        _id: applicationId,
                        post: { _id: postId, title: 'Post filtré' },
                        student: { _id: studentId },
                        status: ApplicationStatus.Pending,
                        cv: 'cv.pdf',
                    },
                ],
                total: 1,
                page: 1,
                limit: 10,
            };
            mockApplicationService.findByStudent.mockResolvedValue(pagination);

            const result = await controller.findMine(studentId, 1, 10, ApplicationStatus.Pending, 'query');

            expect(result.data).toHaveLength(1);
            expect(result.total).toBe(1);
            expect(mockApplicationService.findByStudent).toHaveBeenCalledWith(
                studentId,
                1,
                10,
                ApplicationStatus.Pending,
                'query',
            );
        });

        it('retourne une pagination vide quand le service renvoie vide', async () => {
            mockApplicationService.findByStudent.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 });

            const result = await controller.findMine(studentId, 1, 10);

            expect(result.data).toEqual([]);
            expect(result.total).toBe(0);
            expect(mockApplicationService.findByStudent).toHaveBeenCalledWith(studentId, 1, 10, undefined, undefined);
        });

        it('propage les erreurs du service', async () => {
            mockApplicationService.findByStudent.mockRejectedValue(new Error('boom'));

            await expect(controller.findMine(studentId, 1, 10)).rejects.toThrow('boom');
        });

        it('passe bien la recherche sans status', async () => {
            mockApplicationService.findByStudent.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 });

            await controller.findMine(studentId, 1, 5, undefined, 'test');

            expect(mockApplicationService.findByStudent).toHaveBeenCalledWith(studentId, 1, 5, undefined, 'test');
        });
    });

});
