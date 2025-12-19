import { Types } from 'mongoose';
import { ApplicationStatus } from '../application.schema';
import { ApplicationDto } from '../dto/application.dto';
import { PostDto } from '../../post/dto/post.dto';
import { StudentDto } from '../../student/dto/student.dto';

/**
 * Utility to generate application DTOs for a given student and list of posts.
 * This only builds DTO objects (no DB write). Useful for quick seeding/tests.
 */
export function buildApplicationsForStudent(studentId: string, postIds: string[]): ApplicationDto[] {
    const student = new StudentDto({ _id: new Types.ObjectId(studentId) as any });

    return postIds.map((postId) => {
        const post = new PostDto({ _id: new Types.ObjectId(postId) as any });

        return new ApplicationDto({
            _id: new Types.ObjectId(),
            post,
            student,
            status: ApplicationStatus.Pending,
            cv: 'dummy-cv.pdf',
            coverLetter: 'dummy-lm.pdf',
        });
    });
}
