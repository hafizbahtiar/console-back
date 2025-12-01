import { Exclude, Expose, Transform } from 'class-transformer';

@Exclude()
export class ContactResponseDto {
    @Expose()
    @Transform(({ obj }) => obj._id?.toString() || obj.id?.toString())
    id: string;

    @Expose()
    @Transform(({ obj }) => obj.userId?.toString() || obj.userId)
    userId: string;

    @Expose()
    platform: string;

    @Expose()
    url: string;

    @Expose()
    icon?: string;

    @Expose()
    order: number;

    @Expose()
    active: boolean;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;
}

