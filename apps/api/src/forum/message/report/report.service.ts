import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Report, ReportDocument } from './report.schema';
import { Message, MessageDocument } from '../message.schema';
import { User, UserDocument } from '../../../user/user.schema';
import { CreateReportDto } from './dto/create-report.dto';

/**
 * Service responsible for handling report-related operations.
 */
@Injectable()
export class ReportService {
    constructor(
        @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
        @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) {}

    /**
     * Create a new report for a message.
     * @param createReportDto - Data for creating the report
     * @param reporterId - The ID of the user making the report
     * @returns The created report with reported user email
     */
    async createReport(
        createReportDto: CreateReportDto,
        reporterId: string,
    ): Promise<{ report: Report; reportedUserEmail: string }> {
        const { messageId, reason, explanation } = createReportDto;

        // Validate messageId format
        if (!Types.ObjectId.isValid(messageId)) {
            throw new BadRequestException("L'ID du message n'est pas valide");
        }

        // Check if message exists
        const message = await this.messageModel.findById(messageId).populate('author').exec();
        if (!message) {
            throw new NotFoundException('Message non trouvé');
        }

        // Get the reported user's email
        const reportedUser = await this.userModel.findById(message.author).exec();
        if (!reportedUser) {
            throw new NotFoundException("L'utilisateur signalé n'a pas été trouvé");
        }

        // Check if user has already reported this message
        const existingReport = await this.reportModel
            .findOne({
                messageId: new Types.ObjectId(messageId),
                reporterId: new Types.ObjectId(reporterId),
            })
            .exec();

        if (existingReport) {
            throw new BadRequestException('Vous avez déjà signalé ce message');
        }

        // Create the report
        const report = await this.reportModel.create({
            messageId: new Types.ObjectId(messageId),
            reporterId: new Types.ObjectId(reporterId),
            reason,
            explanation,
        });

        return {
            report,
            reportedUserEmail: reportedUser.email,
        };
    }

    /**
     * Get all reports (for admin purposes).
     * @returns All reports with populated message and reporter data
     */
    async getAllReports(): Promise<Report[]> {
        return this.reportModel.find().populate('messageId').populate('reporterId').exec();
    }

    /**
     * Get reports for a specific message.
     * @param messageId - The ID of the message
     * @returns All reports for the message
     */
    async getReportsByMessage(messageId: string): Promise<Report[]> {
        if (!Types.ObjectId.isValid(messageId)) {
            throw new BadRequestException("L'ID du message n'est pas valide");
        }

        return this.reportModel
            .find({ messageId: new Types.ObjectId(messageId) })
            .populate('reporterId')
            .exec();
    }
}
