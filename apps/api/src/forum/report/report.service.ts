import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
     * Get all reports grouped by reported user
     * Note: This loads all reports from the database and paginates in-memory.
     * The pagination ensures complete user groups are kept together.
     * @param page - Page number (1-based)
     * @param limit - Target number of reports per page (actual count may exceed if a user group is larger)
     * @param status - Filter by status (optional)
     * @returns Paginated list of reports, grouped by reported user
     */
    async getAllReports(
        page: number = 1,
        limit: number = 50,
        status?: string,
    ): Promise<PaginationResult<Report>> {
        const filter: any = {};

        if (status) {
            filter.status = status;
        }

        // Load all reports from database (no DB-level pagination)
        const allReports = await this.reportModel
            .find(filter)
            .populate({
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
            })
            .exec();

        // Group reports by reported user (message author)
        const userGroupsMap = new Map<string, { reports: Report[], latestDate: Date }>();
        
        allReports.forEach((report: any) => {
            const author = report.messageId?.authorId;
            if (!author) return;
            
            const userId = author._id ? author._id.toString() : author.toString();
            
            if (!userGroupsMap.has(userId)) {
                userGroupsMap.set(userId, {
                    reports: [],
                    latestDate: new Date(report.createdAt),
                });
            }
            const group = userGroupsMap.get(userId);
            if (!group) return;
            
            group.reports.push(report);
            
            const reportDate = new Date(report.createdAt);
            if (reportDate > group.latestDate) {
                group.latestDate = reportDate;
            }
        });

        // Sort user groups by latest report date (newest first)
        const sortedUserGroups = Array.from(userGroupsMap.values())
            .sort((a, b) => b.latestDate.getTime() - a.latestDate.getTime());
        
        // Build pages by grouping complete user groups
        // Each page contains user groups until the cumulative report count reaches/exceeds the limit
        let cumulativeReportCount = 0;
        const pageGroups: { reports: Report[], latestDate: Date }[][] = [];
        let currentPageGroups: { reports: Report[], latestDate: Date }[] = [];
        
        for (const userGroup of sortedUserGroups) {
            // Start a new page if we already have groups and reached the limit
            if (currentPageGroups.length > 0 && cumulativeReportCount >= limit) {
                pageGroups.push(currentPageGroups);
                currentPageGroups = [];
                cumulativeReportCount = 0;
            }
            
            currentPageGroups.push(userGroup);
            cumulativeReportCount += userGroup.reports.length;
        }
        
        // Add the last page
        if (currentPageGroups.length > 0) {
            pageGroups.push(currentPageGroups);
        }
        
        const totalPages = pageGroups.length;
        
        // Get groups for the requested page
        const selectedGroups = pageGroups[page - 1] || [];
        
        // Flatten reports from selected user groups
        const selectedReports: Report[] = [];
        selectedGroups.forEach((group) => {
            const sortedReports = group.reports.sort((a, b) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            selectedReports.push(...sortedReports);
        });

        const totalReports = allReports.length;

        return {
            data: selectedReports,
            page: page,
            limit: limit,
            total: totalReports,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        };
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
