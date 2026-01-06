import { Exclude, Expose, Transform } from 'class-transformer';

/**
 * Data Transfer Object for Topic entity.
 */
@Exclude()
export class TopicDto {
    /**
     * Unique identifier of the topic.
     */
    @Transform((params) => params.obj._id)
    @Expose()
    _id: string;

    /**
     * Title of the topic.
     */
    @Expose()
    title: string;

    /**
     * Description of the topic.
     */
    @Expose()
    description?: string;

    /**
     * List of message IDs associated with the topic.
     */
    @Transform(({ value }) => value?.map((item) => item.obj._id) || [])
    @Expose()
    messages: string[];

    /**
     * Author information of the topic.
     * Combine fields from Company and Student schemas.
     */
    @Expose()
    author: {
        _id: string;
        firstName?: string;
        lastName?: string;
        name?: string;
        email: string;
        logo?: string;
    };

    /**
     * Number of messages in the topic.
     */
    @Expose()
    nbMessages: number;

    /**
     * Creation timestamp of the topic.
     */
    @Expose()
    createdAt?: Date;

    /**
     * Last update timestamp of the topic.
     */
    @Expose()
    updatedAt?: Date;
}
