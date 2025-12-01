import { Exclude, Expose, Transform } from 'class-transformer';

@Exclude()
export class TestimonialResponseDto {
    @Expose()
    @Transform(({ obj }) => obj._id?.toString() || obj.id?.toString())
    id: string;

    @Expose()
    @Transform(({ obj }) => obj.userId?.toString() || obj.userId)
    userId: string;

    @Expose()
    name: string;

    @Expose()
    role?: string;

    @Expose()
    company?: string;

    @Expose()
    content: string;

    @Expose()
    avatar?: string;

    @Expose()
    rating?: number;

    @Expose()
    featured: boolean;

    @Expose()
    order: number;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;
}

