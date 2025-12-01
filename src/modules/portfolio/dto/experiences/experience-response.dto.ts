import { Exclude, Expose, Transform, Type } from 'class-transformer';

@Exclude()
export class CompanyReferenceDto {
    @Expose()
    @Transform(({ obj }) => obj._id?.toString() || obj.id?.toString())
    id: string;

    @Expose()
    name: string;

    @Expose()
    logo?: string;

    @Expose()
    website?: string;

    @Expose()
    industry?: string;

    @Expose()
    location?: string;
}

@Exclude()
export class ExperienceResponseDto {
    @Expose()
    @Transform(({ obj }) => obj._id?.toString() || obj.id?.toString())
    id: string;

    @Expose()
    @Transform(({ obj }) => obj.userId?.toString() || obj.userId)
    userId: string;

    @Expose()
    @Transform(({ obj }) => {
        // If companyId is populated, return the populated object
        if (obj.companyId && typeof obj.companyId === 'object' && obj.companyId._id) {
            return obj.companyId;
        }
        // Otherwise return the ID string
        return obj.companyId?.toString() || obj.companyId;
    })
    @Type(() => CompanyReferenceDto)
    companyId?: string | CompanyReferenceDto;

    @Expose()
    title: string;

    @Expose()
    company?: string;

    @Expose()
    location?: string;

    @Expose()
    startDate?: Date;

    @Expose()
    endDate?: Date;

    @Expose()
    current: boolean;

    @Expose()
    description?: string;

    @Expose()
    achievements: string[];

    @Expose()
    technologies: string[];

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;
}

