import { Exclude, Expose, Transform } from 'class-transformer';

@Exclude()
export class ImportHistoryResponseDto {
    @Expose()
    @Transform(({ obj }) => obj._id?.toString() || obj.id?.toString())
    id: string;

    @Expose()
    filename: string;

    @Expose()
    fileType: string;

    @Expose()
    totalRows: number;

    @Expose()
    importedCount: number;

    @Expose()
    failedCount: number;

    @Expose()
    errors: string[];

    @Expose()
    status: 'pending' | 'processing' | 'completed' | 'failed';

    @Expose()
    columnMapping?: Record<string, string>;

    @Expose()
    createdAt: Date;

    @Expose()
    completedAt?: Date;
}

