import { Exclude, Expose, Transform } from 'class-transformer';

@Exclude()
export class CompanyResponseDto {
    @Expose()
    @Transform(({ obj }) => obj._id?.toString() || obj.id?.toString())
    id: string;

    @Expose()
    @Transform(({ obj }) => obj.userId?.toString() || obj.userId)
    userId: string;

    @Expose()
    name: string;

    @Expose()
    logo?: string;

    @Expose()
    website?: string;

    @Expose()
    description?: string;

    @Expose()
    industry?: string;

    @Expose()
    location?: string;

    @Expose()
    foundedYear?: number;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;
}

