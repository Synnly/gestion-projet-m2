import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Report } from './report.schema';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { Message } from '../message/message.schema';
import { PaginationService } from '../../common/pagination/pagination.service';
import { PaginationResult } from '../../common/pagination/dto/paginationResult';

@Injectable()
export class ReportService {
    constructor(
        @InjectModel(Report.name) private readonly reportModel: Model<Report>,
        @InjectModel(Message.name) private readonly messageModel: Model<Message>,
        private readonly paginationService: PaginationService,
    ) {}

    /**
     * Create a new report for a message
     * @param createReportDto - The data for creating a report
     * @param reporterId - The ID of the user creating the report
     * @returns The created report
     */
    async createReport(createReportDto: CreateReportDto, reporterId: string): Promise<Report> {
        // Verify that the message exists
        const message = await this.messageModel.findById(createReportDto.messageId);
        if (!message) {
            throw new NotFoundException(`Message with ID ${createReportDto.messageId} not found`);
        }

        // Check if user already reported this message
        const existingReport = await this.reportModel.findOne({
            messageId: createReportDto.messageId,
            reporterId: new Types.ObjectId(reporterId),
        });

        if (existingReport) {
            throw new BadRequestException('You have already reported this message');
        }

        const report = await this.reportModel.create({
            ...createReportDto,
            reporterId: new Types.ObjectId(reporterId),
            messageId: new Types.ObjectId(createReportDto.messageId),
        });

        return report;
    }

    /**
     * Get all reports with pagination
     * @param page - Page number
     * @param limit - Number of items per page
     * @param status - Filter by status (optional)
     * @returns Paginated list of reports
     */
    async getAllReports(
        page: number = 1,
        limit: number = 10,
        status?: string,
    ): Promise<PaginationResult<Report>> {
        const filter: any = {};

        if (status) {
            filter.status = status;
        }

        return this.paginationService.paginate(
            this.reportModel,
            filter,
            page,
            limit,
            [
                {
                    path: 'messageId',
                    populate: [
                        {
                            path: 'topicId',
                            select: 'forumId title',
                        },
                        {
                            path: 'authorId',
                            select: 'email firstName lastName ban',
                        },
                    ],
                },
            ],
            '-1',
        );
    }

    /**
     * Get a specific report by ID
     * @param reportId - The ID of the report
     * @returns The report
     */
    async getReportById(reportId: string): Promise<Report> {
        const report = await this.reportModel
            .findById(reportId)
            .populate({
                path: 'messageId',
                populate: [
                    {
                        path: 'topicId',
                        select: 'forumId title',
                    },
                    {
                        path: 'authorId',
                        select: 'email firstName lastName',
                    },
                ],
            })
            .populate('reporterId', 'email firstName lastName')
            .exec();

        if (!report) {
            throw new NotFoundException(`Report with ID ${reportId} not found`);
        }

        return report;
    }

    /**
     * Get all reports for a specific message
     * @param messageId - The ID of the message
     * @returns List of reports for the message
     */
    async getReportsByMessageId(messageId: string): Promise<Report[]> {
        return this.reportModel
            .find({ messageId: new Types.ObjectId(messageId) })
            .populate({
                path: 'messageId',
                populate: [
                    {
                        path: 'topicId',
                        select: 'forumId title',
                    },
                    {
                        path: 'authorId',
                        select: 'email firstName lastName',
                    },
                ],
            })
            .populate('reporterId', 'email firstName lastName')
            .sort({ createdAt: -1 })
            .exec();
    }

    /**
     * Update a report's status (admin only)
     * @param reportId - The ID of the report
     * @param updateReportDto - The update data
     * @returns The updated report
     */
    async updateReportStatus(reportId: string, updateReportDto: UpdateReportDto): Promise<Report> {
        const report = await this.reportModel
            .findByIdAndUpdate(reportId, updateReportDto, { new: true })
            .populate({
                path: 'messageId',
                populate: [
                    {
                        path: 'topicId',
                        select: 'forumId title',
                    },
                    {
                        path: 'authorId',
                        select: 'email firstName lastName',
                    },
                ],
            })
            .populate('reporterId', 'email firstName lastName')
            .exec();

        if (!report) {
            throw new NotFoundException(`Report with ID ${reportId} not found`);
        }

        return report;
    }

    /**
     * Delete a report (admin only)
     * @param reportId - The ID of the report
     */
    async deleteReport(reportId: string): Promise<void> {
        const result = await this.reportModel.findByIdAndDelete(reportId);

        if (!result) {
            throw new NotFoundException(`Report with ID ${reportId} not found`);
        }
    }

    /**
     * Get reports created by a specific user
     * @param reporterId - The ID of the user
     * @returns List of reports created by the user
     */
    async getReportsByReporterId(reporterId: string): Promise<Report[]> {
        return this.reportModel
            .find({ reporterId: new Types.ObjectId(reporterId) })
            .populate({
                path: 'messageId',
                populate: [
                    {
                        path: 'topicId',
                        select: 'forumId title',
                    },
                    {
                        path: 'authorId',
                        select: 'email firstName lastName',
                    },
                ],
            })
            .sort({ createdAt: -1 })
            .exec();
    }

    /**
     * Get count of reports by status
     * @returns Object with counts for each status
     */
    async getReportStats(): Promise<Record<string, number>> {
        const stats = await this.reportModel.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                },
            },
        ]);

        return stats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
        }, {});
    }
}
