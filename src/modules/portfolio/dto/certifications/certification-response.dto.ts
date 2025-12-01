import { Exclude, Expose, Transform } from 'class-transformer';

@Exclude()
export class CertificationResponseDto {
    @Expose()
    @Transform(({ obj }) => obj._id?.toString() || obj.id?.toString())
    id: string;

    @Expose()
    @Transform(({ obj }) => obj.userId?.toString() || obj.userId)
    userId: string;

    @Expose()
    name: string;

    @Expose()
    issuer: string;

    @Expose()
    issueDate: Date;

    @Expose()
    expiryDate?: Date;

    @Expose()
    credentialId?: string;

    @Expose()
    credentialUrl?: string;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;
}

