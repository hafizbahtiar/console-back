import { Exclude, Expose, Transform } from 'class-transformer';

@Exclude()
export class PortfolioProfileResponseDto {
  @Expose()
  @Transform(({ obj }) => obj._id?.toString() || obj.id?.toString())
  id: string;

  @Expose()
  @Transform(({ obj }) => obj.userId?.toString() || obj.userId)
  userId: string;

  @Expose()
  bio?: string;

  @Expose()
  avatar?: string;

  @Expose()
  resumeUrl?: string;

  @Expose()
  location?: string;

  @Expose()
  availableForHire: boolean;

  @Expose()
  portfolioUrl?: string;

  @Expose()
  theme: string;

  @Expose()
  isPublic: boolean;

  @Expose()
  showProjects: boolean;

  @Expose()
  showCompanies: boolean;

  @Expose()
  showSkills: boolean;

  @Expose()
  showExperiences: boolean;

  @Expose()
  showEducation: boolean;

  @Expose()
  showCertifications: boolean;

  @Expose()
  showBlog: boolean;

  @Expose()
  showTestimonials: boolean;

  @Expose()
  showContacts: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
