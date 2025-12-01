import { Exclude, Expose, Transform } from 'class-transformer';

@Exclude()
export class EducationResponseDto {
    @Expose()
    @Transform(({ obj }) => obj._id?.toString() || obj.id?.toString())
    id: string;

    @Expose()
    @Transform(({ obj }) => obj.userId?.toString() || obj.userId)
    userId: string;

    @Expose()
    institution: string;

    @Expose()
    degree: string;

    @Expose()
    field?: string;

    @Expose()
    startDate: Date;

    @Expose()
    endDate?: Date;

    @Expose()
    gpa?: number;

    @Expose()
    description?: string;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;
}

