import { IsString, IsOptional, IsDateString, IsUrl, MinLength, MaxLength } from 'class-validator';

export class CreateCertificationDto {
    @IsString()
    @MinLength(1)
    @MaxLength(200)
    name: string;

    @IsString()
    @MinLength(1)
    @MaxLength(200)
    issuer: string;

    @IsDateString()
    issueDate: string;

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

