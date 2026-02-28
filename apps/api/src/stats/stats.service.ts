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
    async getPublicStats(): Promise<{ totalPosts: string; totalCompanies: string; totalStudents: string }> {
        const [totalPosts, totalCompanies, totalStudents] = await Promise.all([
            this.postModel.countDocuments({ isVisible: true }),
            this.companyModel.countDocuments({ deletedAt: { $exists: false }, isValid: true }),
            this.studentModel.countDocuments({ deletedAt: { $exists: false } }),
        ]);

        const formatCount = (n: number): number | string => {
            if (n < 10) return n;

            if (n < 100) {
                // 10 - 99: round to nearest 10 (no decimal)
                return Math.round(n / 10) * 10;
            }

            // 10 - 9_999: round to nearest 10 (last digit 0)
            if (n < 1_000) {
                const rounded = Math.round(n / 10) * 10;
                const k = rounded / 1000;
                return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
            }
            // 10k - 999_999: round to nearest 100
            if (n < 1_000_000) {
                const rounded = Math.round(n / 100) * 100;
                const k = rounded / 1000;
                return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
            }
            // >= 1_000_000: show in M with one decimal when needed
            const roundedM = Math.round(n / 100_000) / 10; // e.g. 1.2M
            return roundedM % 1 === 0 ? `${roundedM.toFixed(0)}M` : `${roundedM.toFixed(1)}M`;
        };

        return {
            totalPosts: formatCount(totalPosts).toString(),
            totalCompanies: formatCount(totalCompanies).toString(),
            totalStudents: formatCount(totalStudents).toString(),
        };
    }

    /**
     * Retrieves the latest public posts for the landing page
     * Returns only visible posts with populated company information
     * @param limit - Number of posts to return (default: 6)
     * @returns Array of posts with company details
     */
    async getLatestPublicPosts(limit: number = 6): Promise<Post[]> {
        return this.postModel
            .find({ isVisible: true })
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('company', 'name email logo address')
            .exec();
    }

    /**
     * Calculates application acceptance statistics by company
     * @returns A mapping of company ID to accepted application count and acceptance rate
     */
    async getApplicationAcceptanceStatsByCompany(): Promise<Record<string, { count: number; rate: number }>> {
        const accepted = await this.applicationModel.aggregate([
            { $match: { status: 'Accepted' } },
            {
                $lookup: {
                    from: 'posts',
                    localField: 'post',
                    foreignField: '_id',
                    as: 'postInfo',
                },
            },
            { $unwind: '$postInfo' },
            {
                $group: {
                    _id: '$postInfo.company',
                    acceptedCount: { $sum: 1 },
                },
            },
            {
                $project: {
                    companyId: { $toString: '$_id' },
                    acceptedCount: 1,
                },
            },
        ]);

        const total = await this.applicationModel.aggregate([
            {
                $lookup: {
                    from: 'posts',
                    localField: 'post',
                    foreignField: '_id',
                    as: 'postInfo',
                },
            },
            { $unwind: '$postInfo' },
            {
                $group: {
                    _id: '$postInfo.company',
                    totalCount: { $sum: 1 },
                },
            },
            {
                $project: {
                    companyId: { $toString: '$_id' },
                    totalCount: 1,
                },
            },
        ]);

        const totalMap = new Map(total.map((item) => [item._id, item.totalCount]));

        return Object.fromEntries(
            accepted.map((item) => [
                item.studentId,
                {
                    count: item.acceptedCount,
                    rate: item.acceptedCount / (totalMap.get(item.companyId) ?? 1),
                },
            ]),
        );
    }

    /**
     * Calculates application acceptance statistics by student
     * @returns A mapping of student ID to accepted application count and acceptance rate
     */
    async getApplicationAcceptanceStatsByStudent(): Promise<Record<string, { count: number; rate: number }>> {
        const accepted = await this.applicationModel.aggregate([
            { $match: { status: 'Accepted' } },
            {
                $group: {
                    _id: '$student',
                    acceptedCount: { $sum: 1 },
                },
            },
            {
                $project: {
                    studentId: { $toString: '$_id' },
                    acceptedCount: 1,
                },
            },
        ]);

        const total = await this.applicationModel.aggregate([
            {
                $group: {
                    _id: '$student',
                    totalCount: { $sum: 1 },
                },
            },
            {
                $project: {
                    studentId: { $toString: '$_id' },
                    totalCount: 1,
                },
            },
        ]);

        const totalMap = new Map(total.map((item) => [item.studentId, item.totalCount]));

        return Object.fromEntries(
            accepted.map((item) => [
                item.studentId,
                {
                    count: item.acceptedCount,
                    rate: item.acceptedCount / (totalMap.get(item.studentId) ?? 1),
                },
            ]),
        );
    }
}
