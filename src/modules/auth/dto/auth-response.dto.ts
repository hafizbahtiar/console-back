export class AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    displayName?: string;
    avatar?: string;
    bio?: string;
    location?: string;
    website?: string;
    role: string;
    email: string;
    emailVerified: boolean;
  };
}
