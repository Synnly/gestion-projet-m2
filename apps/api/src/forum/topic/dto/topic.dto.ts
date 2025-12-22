import { Exclude, Expose, Transform } from "class-transformer";

@Exclude()
export class TopicDto {
    @Transform((params) => params.obj._id)
    @Expose()
    _id: string;

    @Expose()
    title: string;

    @Expose()
    description?: string;
        
    @Transform(({ value }) => value?.map((item) => item.obj._id) || [])
    @Expose()
    messages: string[];

    @Transform((params) => params.obj._id)
    @Expose()
    author: string;

    @Expose()
    createdAt?: Date;

    @Expose()
    updatedAt?: Date;
}
