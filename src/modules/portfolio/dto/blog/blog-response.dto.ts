import { Exclude, Expose, Transform } from 'class-transformer';

@Exclude()
export class BlogResponseDto {
    @Expose()
    @Transform(({ obj }) => obj._id?.toString() || obj.id?.toString())
    id: string;

    @Expose()
    @Transform(({ obj }) => obj.userId?.toString() || obj.userId)
    userId: string;

    @Expose()
    title: string;

    @Expose()
    slug: string;

    @Expose()
    content: string;

    @Expose()
    excerpt?: string;

    @Expose()
    coverImage?: string;

    @Expose()
    published: boolean;

    @Expose()
    publishedAt?: Date;

    @Expose()
    tags: string[];

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;
}

