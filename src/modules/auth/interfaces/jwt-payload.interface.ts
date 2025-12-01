export interface JwtPayload {
  sub: string; // userId
  email: string;
  accountId: string;
  role: string;
  type: 'access' | 'refresh';
}
