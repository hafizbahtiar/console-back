export class UserResponseDto {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  avatar?: string;
  role: string;
  email: string;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
