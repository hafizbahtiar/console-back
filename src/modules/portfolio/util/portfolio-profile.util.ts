import { PortfolioProfile } from '../schemas/portfolio-profile.schema';

export function getDefaultPortfolioProfile(userId: string): Partial<PortfolioProfile> {
  return {
    userId: undefined as any, // will be set by service using ObjectId
    bio: '',
    avatar: undefined,
    resumeUrl: undefined,
    location: '',
    availableForHire: false,
    portfolioUrl: undefined,
    theme: 'default',
  };
}
