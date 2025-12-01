import { IsBoolean, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdatePortfolioProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsUrl()
  resumeUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @IsOptional()
  @IsBoolean()
  availableForHire?: boolean;

  @IsOptional()
  @IsUrl()
  portfolioUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  theme?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsBoolean()
  showProjects?: boolean;

  @IsOptional()
  @IsBoolean()
  showCompanies?: boolean;

  @IsOptional()
  @IsBoolean()
  showSkills?: boolean;

  @IsOptional()
  @IsBoolean()
  showExperiences?: boolean;

  @IsOptional()
  @IsBoolean()
  showEducation?: boolean;

  @IsOptional()
  @IsBoolean()
  showCertifications?: boolean;

  @IsOptional()
  @IsBoolean()
  showBlog?: boolean;

  @IsOptional()
  @IsBoolean()
  showTestimonials?: boolean;

  @IsOptional()
  @IsBoolean()
  showContacts?: boolean;
}
