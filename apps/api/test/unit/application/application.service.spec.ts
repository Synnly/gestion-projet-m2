import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ApplicationService } from '../../../src/application/application.service';
import { Application, ApplicationStatus } from '../../../src/application/application.schema';
import { CreateApplicationDto } from '../../../src/application/dto/createApplication.dto';
import { PostService } from '../../../src/post/post.service';
import { StudentService } from '../../../src/student/student.service';
import { PaginationService} from '../../../src/common/pagination/pagination.service';
import { S3Service } from '../../../src/s3/s3.service';

describe('ApplicationService', () => {
    let service: ApplicationService;

    const mockApplicationModel: any = jest.fn();
    mockApplicationModel.find = jest.fn();
    mockApplicationModel.findOne = jest.fn();

    const mockStudentService = {
        findOne: jest.fn(),
    };
    const mockPostService = {
        findOne: jest.fn(),
    };
    const mockS3Service = {
        generatePresignedUploadUrl: jest.fn(),
    };

    const mockPaginationService = {
        paginate: jest.fn(),
    };

    const studentId = new Types.ObjectId('507f1f77bcf86cd799439011');
    const postId = new Types.ObjectId('507f1f77bcf86cd799439012');

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ApplicationService,
                {
                    provide: getModelToken('Application'),
                    useValue: mockApplicationModel,
                },
                {
                    provide: StudentService,
                    useValue: mockStudentService,
                },
                {
                    provide: PostService,
                    useValue: mockPostService,
                },
                {
                    provide: S3Service,
                    useValue: mockS3Service,
                },
                {
                    provide: PaginationService,
                    useValue: mockPaginationService,
                },
            ],
        }).compile();

        service = module.get<ApplicationService>(ApplicationService);

        jest.clearAllMocks();
        mockApplicationModel.mockClear();
        // Default constructor mock to avoid undefined save errors
        mockApplicationModel.mockImplementation(() => ({
            save: jest.fn().mockResolvedValue(undefined),
        }));
    });

    it('should be defined when the service is instantiated', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should return all applications with post and student populated when findAll is called', async () => {
            const applications: Application[] = [
                { _id: postId, post: {} as any, student: {} as any, status: ApplicationStatus.Pending, cv: 'cv.pdf' },
            ];
            const exec = jest.fn().mockResolvedValue(applications);
            const populate = jest.fn().mockReturnValue({ exec });
            mockApplicationModel.find.mockReturnValue({ populate });

            const result = await service.findAll();

            expect(mockApplicationModel.find).toHaveBeenCalledWith({ deletedAt: { $exists: false } });
            expect(populate).toHaveBeenCalledWith([
                { path: 'post', select: service.postFieldsToPopulate },
                { path: 'student', select: service.studentFieldsToPopulate },
            ]);
            expect(exec).toHaveBeenCalledTimes(1);
            expect(result).toEqual(applications);
        });

        it('should return an empty array when no applications exist in the database', async () => {
            const exec = jest.fn().mockResolvedValue([]);
            const populate = jest.fn().mockReturnValue({ exec });
            mockApplicationModel.find.mockReturnValue({ populate });

            const result = await service.findAll();

            expect(result).toEqual([]);
            expect(exec).toHaveBeenCalledTimes(1);
        });
    });

    describe('findOne', () => {
        it('should return a single application when findOne is called with an existing id', async () => {
            const application: Application = {
                _id: postId,
                post: { _id: postId } as any,
                student: { _id: studentId } as any,
                status: ApplicationStatus.Pending,
                cv: 'cv.pdf',
            };
            const exec = jest.fn().mockResolvedValue(application);
            const populate = jest.fn().mockReturnValue({ exec });
            mockApplicationModel.findOne.mockReturnValue({ populate });

            const result = await service.findOne(postId);

            expect(mockApplicationModel.findOne).toHaveBeenCalledWith({
                _id: postId,
                deletedAt: { $exists: false },
            });
            expect(populate).toHaveBeenCalledWith([
                { path: 'post', select: service.postFieldsToPopulate },
                { path: 'student', select: service.studentFieldsToPopulate },
            ]);
            expect(exec).toHaveBeenCalledTimes(1);
            expect(result).toEqual(application);
        });

        it('should return null when findOne is called with a non-existent id', async () => {
            const exec = jest.fn().mockResolvedValue(null);
            const populate = jest.fn().mockReturnValue({ exec });
            mockApplicationModel.findOne.mockReturnValue({ populate });

            const result = await service.findOne(new Types.ObjectId('507f1f77bcf86cd799439099'));

            expect(result).toBeNull();
            expect(exec).toHaveBeenCalledTimes(1);
        });
    });

    describe('create', () => {
        const student = { _id: studentId, firstName: 'John', lastName: 'Doe' };
        const post = { _id: postId, title: 'Internship' };
        const dto: CreateApplicationDto = { cvExtension: 'pdf', lmExtension: 'docx' };

        it('should throw NotFoundException when the student does not exist', async () => {
            mockStudentService.findOne.mockResolvedValue(null);

            await expect(service.create(studentId, postId, dto)).rejects.toThrow(NotFoundException);
            expect(mockPostService.findOne).not.toHaveBeenCalled();
            expect(mockApplicationModel.findOne).not.toHaveBeenCalled();
        });

        it('should throw NotFoundException when the post does not exist', async () => {
            mockStudentService.findOne.mockResolvedValue(student);
            mockPostService.findOne.mockResolvedValue(null);

            await expect(service.create(studentId, postId, dto)).rejects.toThrow(NotFoundException);
            expect(mockApplicationModel.findOne).not.toHaveBeenCalled();
        });

        it('should throw ConflictException when an application already exists for the student and post', async () => {
            mockStudentService.findOne.mockResolvedValue(student);
            mockPostService.findOne.mockResolvedValue(post);
            const exec = jest.fn().mockResolvedValue({ _id: new Types.ObjectId() });
            mockApplicationModel.findOne.mockReturnValue({ exec });

            await expect(service.create(studentId, postId, dto)).rejects.toThrow(ConflictException);
            expect(exec).toHaveBeenCalledTimes(1);
            expect(mockApplicationModel).not.toHaveBeenCalled();
        });

        it('should create presigned urls for cv and cover letter when lmExtension is provided', async () => {
            mockStudentService.findOne.mockResolvedValue(student);
            mockPostService.findOne.mockResolvedValue(post);
            const exec = jest.fn().mockResolvedValue(null);
            mockApplicationModel.findOne.mockReturnValue({ exec });
            mockS3Service.generatePresignedUploadUrl
                .mockResolvedValueOnce({ fileName: 'cv-file.pdf', uploadUrl: 'https://cv-url' })
                .mockResolvedValueOnce({ fileName: 'lm-file.docx', uploadUrl: 'https://lm-url' });
            const save = jest.fn().mockResolvedValue(undefined);
            mockApplicationModel.mockImplementation(() => ({ save }));

            const result = await service.create(studentId, postId, dto);

            expect(mockS3Service.generatePresignedUploadUrl).toHaveBeenNthCalledWith(
                1,
                `${studentId.toString()}_${postId.toString()}.pdf`,
                'cv',
                studentId.toString(),
            );
            expect(mockS3Service.generatePresignedUploadUrl).toHaveBeenNthCalledWith(
                2,
                `${studentId.toString()}_${postId.toString()}.docx`,
                'lm',
                studentId.toString(),
            );
            expect(mockApplicationModel).toHaveBeenCalledWith({
                student,
                post,
                cv: 'cv-file.pdf',
                coverLetter: 'lm-file.docx',
            });
            expect(save).toHaveBeenCalledTimes(1);
            expect(result).toEqual({ cvUrl: 'https://cv-url', lmUrl: 'https://lm-url' });
        });

        it('should create an application without cover letter when no lmExtension is provided', async () => {
            mockStudentService.findOne.mockResolvedValue(student);
            mockPostService.findOne.mockResolvedValue(post);
            const exec = jest.fn().mockResolvedValue(null);
            mockApplicationModel.findOne.mockReturnValue({ exec });
            mockS3Service.generatePresignedUploadUrl.mockResolvedValueOnce({
                fileName: 'cv-only.pdf',
                uploadUrl: 'https://cv-only-url',
            });
            const save = jest.fn().mockResolvedValue(undefined);
            mockApplicationModel.mockImplementation(() => ({ save }));

            const result = await service.create(studentId, postId, { cvExtension: 'pdf' });

            expect(mockS3Service.generatePresignedUploadUrl).toHaveBeenCalledTimes(1);
            expect(mockApplicationModel).toHaveBeenCalledWith({
                student,
                post,
                cv: 'cv-only.pdf',
                coverLetter: undefined,
            });
            expect(save).toHaveBeenCalledTimes(1);
            expect(result).toEqual({ cvUrl: 'https://cv-only-url', lmUrl: undefined });
        });
    });

    describe('updateStatus', () => {
        it('should update the application status when a valid id is provided', async () => {
            const application = {
                _id: postId,
                status: ApplicationStatus.Pending,
                save: jest.fn().mockResolvedValue(true),
            };
            const exec = jest.fn().mockResolvedValue(application);
            mockApplicationModel.findOne.mockReturnValue({ exec });

            await service.updateStatus(postId, ApplicationStatus.Accepted);

            expect(mockApplicationModel.findOne).toHaveBeenCalledWith({
                _id: postId,
                deletedAt: { $exists: false },
            });
            expect(application.status).toBe(ApplicationStatus.Accepted);
            expect(application.save).toHaveBeenCalledTimes(1);
        });

        it('should throw NotFoundException when the application does not exist', async () => {
            const exec = jest.fn().mockResolvedValue(null);
            mockApplicationModel.findOne.mockReturnValue({ exec });

            await expect(service.updateStatus(postId, ApplicationStatus.Rejected)).rejects.toThrow(NotFoundException);
            expect(exec).toHaveBeenCalledTimes(1);
        });
    });
    describe('findByPostPaginated', () => {
        const postId = new Types.ObjectId('507f1f77bcf86cd799439012');

        const paginatedResult = {
            data: [
                {
                    _id: new Types.ObjectId(),
                    status: ApplicationStatus.Pending,
                    student: { _id: new Types.ObjectId(), firstName: 'John', lastName: 'Doe' },
                    post: { _id: postId, title: 'Internship' },
                },
            ],
            total: 1,
            page: 1,
            limit: 20,
        };

        it('should call paginationService.paginate with default page and limit', async () => {
            mockPaginationService.paginate.mockResolvedValue(paginatedResult);

            const result = await service.findByPostPaginated(postId, {});

            expect(mockPaginationService.paginate).toHaveBeenCalledWith(
                mockApplicationModel,
                { post: postId, deletedAt: { $exists: false } },
                1,
                20,
                [
                    { path: 'student', select: service.studentFieldsToPopulate },
                    { path: 'post', select: service.postFieldsToPopulate },
                ],
            );

            expect(result).toEqual(paginatedResult);
        });

        it('should use provided page and limit from query', async () => {
            mockPaginationService.paginate.mockResolvedValue({
                ...paginatedResult,
                page: 2,
                limit: 10,
            });

            const query = { page: 2, limit: 10 };

            const result = await service.findByPostPaginated(postId, query);

            expect(mockPaginationService.paginate).toHaveBeenCalledWith(
                mockApplicationModel,
                { post: postId, deletedAt: { $exists: false } },
                2,
                10,
                [
                    { path: 'student', select: service.studentFieldsToPopulate },
                    { path: 'post', select: service.postFieldsToPopulate },
                ],
            );

            expect(result.page).toBe(2);
            expect(result.limit).toBe(10);
        });

        it('should return empty data when paginationService returns no results', async () => {
            const emptyResult = {
                data: [],
                total: 0,
                page: 1,
                limit: 20,
            };

            mockPaginationService.paginate.mockResolvedValue(emptyResult);

            const result = await service.findByPostPaginated(postId, {});

            expect(result).toEqual(emptyResult);
            expect(result.data).toHaveLength(0);
        });
    });
});
