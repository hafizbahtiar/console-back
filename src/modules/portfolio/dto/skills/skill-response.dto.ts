import { Exclude, Expose, Transform } from 'class-transformer';

@Exclude()
export class SkillResponseDto {
    @Expose()
    @Transform(({ obj }) => obj._id?.toString() || obj.id?.toString())
    id: string;

    @Expose()
    @Transform(({ obj }) => obj.userId?.toString() || obj.userId)
    userId: string;

    @Expose()
    name: string;

    @Expose()
    category: string;

    @Expose()
    level?: number;

    @Expose()
    icon?: string;

    @Expose()
    color?: string;

    @Expose()
    order: number;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;
}

