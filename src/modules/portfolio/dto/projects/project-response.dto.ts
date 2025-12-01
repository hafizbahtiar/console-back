import { Exclude, Expose, Transform } from 'class-transformer';
import { Types } from 'mongoose';

@Exclude()
export class ProjectResponseDto {
    @Expose()
    @Transform(({ obj }) => obj._id?.toString() || obj.id?.toString())
    id: string;

    @Expose()
    @Transform(({ obj }) => obj.userId?.toString() || obj.userId)
    userId: string;

    @Expose()
    title: string;

    @Expose()
    description?: string;

    @Expose()
    image?: string;

    @Expose()
    url?: string;

    @Expose()
    githubUrl?: string;

    @Expose()
    tags: string[];

    @Expose()
    technologies: string[];

    @Expose()
    startDate?: Date;

    @Expose()
    endDate?: Date;

    @Expose()
    featured: boolean;

    @Expose()
    order: number;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;
}

