import { Exclude, Expose, Transform } from 'class-transformer';
import { Types } from 'mongoose';

@Exclude()
export class ExpenseCategoryResponseDto {
    @Expose()
    @Transform(({ obj }) => obj._id?.toString() || obj.id?.toString())
    id: string;

    @Expose()
    @Transform(({ obj }) => obj.userId?.toString() || obj.userId)
    userId: string;

    @Expose()
    name: string;

    @Expose()
    color?: string;

    @Expose()
    icon?: string;

    @Expose()
    order: number;

    @Expose()
    description?: string;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;
}

