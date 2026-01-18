import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/user.schema';
import { Company, CompanyDocument } from '../company/company.schema';
import { Student, StudentDocument } from '../student/student.schema';
import { Application, ApplicationDocument } from '../application/application.schema';
import { Post, PostDocument } from '../post/post.schema';
import { StatsDto } from './dto/stats.dto';

@Injectable()
export class StatsService {
    constructor(
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
        @InjectModel(Company.name) private readonly companyModel: Model<CompanyDocument>,
        @InjectModel(Student.name) private readonly studentModel: Model<StudentDocument>,
        @InjectModel(Application.name) private readonly applicationModel: Model<ApplicationDocument>,
        @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
    ) {}

    async getStats(): Promise<StatsDto> {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const [
            totalUsers,
            totalCompanies,
            totalStudents,
            totalApplications,
            totalPosts,
            applicationsByStatus,
            applicationsOverTime,
            topCompaniesRaw,
            orphanOffersRaw,
        ] = await Promise.all([
            this.userModel.countDocuments(),
            this.companyModel.countDocuments(),
            this.studentModel.countDocuments(),
            this.applicationModel.countDocuments(),
            this.postModel.countDocuments(),

            // --- Aggregation 1: Applications by Status (Pie Chart) ---
            this.applicationModel.aggregate([
                { $group: { _id: '$status', value: { $sum: 1 } } },
                { $project: { name: '$_id', value: 1, _id: 0 } },
            ]),

            // --- Aggregation 2: Applications per Month (Bar Chart) ---
            // Groups applications by creation month (YYYY-MM), sorts by date, and limits to the last 6 months

            this.applicationModel.aggregate([
                {
                    $match: {
                        createdAt: { $gte: sixMonthsAgo },
                    },
                },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
                { $project: { name: '$_id', count: 1, _id: 0 } },
            ]),

            // --- Aggregation 3: Top Companies & Response Rate ---
            this.postModel.aggregate([
                {
                    $group: {
                        _id: '$company',
                        offersCount: { $sum: 1 },
                        postIds: { $push: '$_id' },
                    },
                },
                { $sort: { offersCount: -1 } },
                { $limit: 5 },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'companyInfo',
                    },
                },
                { $unwind: '$companyInfo' },
                {
                    $lookup: {
                        from: 'applications',
                        let: { posts: '$postIds' },
                        pipeline: [{ $match: { $expr: { $in: ['$post', '$$posts'] } } }, { $project: { status: 1 } }],
                        as: 'companyApplications',
                    },
                },
                {
                    $project: {
                        name: '$companyInfo.name',
                        offersCount: 1,
                        responseRate: {
                            $cond: {
                                if: { $eq: [{ $size: '$companyApplications' }, 0] },
                                then: 0,
                                else: {
                                    $multiply: [
                                        {
                                            $divide: [
                                                {
                                                    $size: {
                                                        $filter: {
                                                            input: '$companyApplications',
                                                            as: 'app',
                                                            cond: { $ne: ['$$app.status', 'Pending'] },
                                                        },
                                                    },
                                                },
                                                { $size: '$companyApplications' },
                                            ],
                                        },
                                        100,
                                    ],
                                },
                            },
                        },
                        _id: 0,
                    },
                },
                {
                    $addFields: {
                        responseRate: { $round: ['$responseRate', 0] },
                    },
                },
            ]),

            // --- Aggregation 4: Orphan Offers ---
            // Counts posts that have zero associated applications
            this.postModel.aggregate([
                {
                    $lookup: {
                        from: 'applications',
                        localField: '_id',
                        foreignField: 'post',
                        as: 'applications',
                    },
                },
                { $match: { applications: { $size: 0 } } },
                { $count: 'count' },
            ]),
        ]);

        return {
            totalUsers,
            totalCompanies,
            totalStudents,
            totalApplications,
            totalPosts,
            applicationsByStatus: applicationsByStatus || [],
            applicationsOverTime: applicationsOverTime || [],
            orphanOffersCount: orphanOffersRaw[0]?.count || 0,
            topCompanies: topCompaniesRaw || [],
        };
    }

    /**
     * Retrieves public statistics for the landing page
     * Returns basic counts without authentication
     * @returns An object containing public stats (posts, companies, students)
     */
    async getPublicStats(): Promise<{ totalPosts: number; totalCompanies: number; totalStudents: number }> {
        const [totalPosts, totalCompanies, totalStudents] = await Promise.all([
            this.postModel.countDocuments({ isVisible: true }),
            this.companyModel.countDocuments({ deletedAt: { $exists: false }, isValid: true }),
            this.studentModel.countDocuments({ deletedAt: { $exists: false } }),
        ]);

        return {
            totalPosts,
            totalCompanies,
            totalStudents,
        };
    }
}
