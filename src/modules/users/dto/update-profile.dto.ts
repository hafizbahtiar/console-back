import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsUrl,
  Matches,
  ValidateIf,
} from 'class-validator';

export class UpdateProfileDto {
  @IsString({ message: 'First name must be a string' })
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  @Matches(/^[a-zA-Z\s'-]+$/, {
    message: 'First name can only contain letters, spaces, hyphens, and apostrophes',
  })
  @IsOptional()
  firstName?: string;

  @IsString({ message: 'Last name must be a string' })
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  @Matches(/^[a-zA-Z\s'-]+$/, {
    message: 'Last name can only contain letters, spaces, hyphens, and apostrophes',
  })
  @IsOptional()
  lastName?: string;

  @IsString({ message: 'Display name must be a string' })
  @MinLength(2, { message: 'Display name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Display name must not exceed 50 characters' })
  @IsOptional()
  displayName?: string;

  @IsString({ message: 'Bio must be a string' })
  @MaxLength(500, { message: 'Bio must not exceed 500 characters' })
  @IsOptional()
  bio?: string;

  @IsString({ message: 'Location must be a string' })
  @MaxLength(100, { message: 'Location must not exceed 100 characters' })
  @IsOptional()
  location?: string;

  @ValidateIf((o) => o.website !== undefined && o.website !== null && o.website !== '')
  @IsString({ message: 'Website must be a string' })
  @IsUrl(
    {
      protocols: ['http', 'https'],
      require_protocol: true,
    },
    { message: 'Website must be a valid URL with http:// or https://' },
  )
  @MaxLength(200, { message: 'Website URL must not exceed 200 characters' })
  @IsOptional()
  website?: string;
}
