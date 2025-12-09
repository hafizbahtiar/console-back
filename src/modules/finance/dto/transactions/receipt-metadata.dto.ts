import { Exclude, Expose } from 'class-transformer';

/**
 * Receipt Metadata DTO
 * Contains metadata about a transaction receipt attachment
 */
@Exclude()
export class ReceiptMetadataDto {
    @Expose()
    receiptUrl?: string;

    @Expose()
    receiptFilename?: string;

    @Expose()
    receiptMimetype?: string;

    @Expose()
    receiptSize?: number;

    @Expose()
    receiptUploadedAt?: Date;
}

