import { IsString, IsOptional, IsDateString, IsUrl, MinLength, MaxLength } from 'class-validator';

export class UpdateCertificationDto {
    @IsString()
    @MinLength(1)
    @MaxLength(200)
    @IsOptional()
    name?: string;

    @IsString()
    @MinLength(1)
    @MaxLength(200)
    @IsOptional()
    issuer?: string;

    @IsDateString()
    @IsOptional()
    issueDate?: string;

    @IsDateString()
    @IsOptional()
    expiryDate?: string;

    @IsString()
    @IsOptional()
    @MaxLength(100)
    credentialId?: string;

    @IsUrl()
    @IsOptional()
    credentialUrl?: string;
}

