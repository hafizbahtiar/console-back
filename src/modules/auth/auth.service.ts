import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Config } from '../../config/config.interface';
import { UsersService } from '../users/users.service';
import { AccountsService } from '../accounts/accounts.service';
import { SessionsService } from '../sessions/sessions.service';
import { EmailService } from '../email/services/email.service';
import { PasswordUtil } from '../../common/utils/password.util';
import { parseUserAgent } from '../../common/utils/user-agent.util';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { Request } from 'express';
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private accountsService: AccountsService,
    private sessionsService: SessionsService,
    private emailService: EmailService,
    private jwtService: JwtService,
    private configService: ConfigService<Config>,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Check if email already exists
    const existingAccount = await this.accountsService.findByEmail(
      registerDto.email,
    );
    if (existingAccount) {
      throw new ConflictException('Email already registered');
    }

    // Check if username already exists
    const existingUser = await this.usersService.findByUsername(
      registerDto.username,
    );
    if (existingUser) {
      throw new ConflictException('Username already taken');
    }

    // Hash password
    const hashedPassword = await PasswordUtil.hash(
      registerDto.password,
      this.configService,
    );

    // Create user
    const user = await this.usersService.create({
      username: registerDto.username.toLowerCase(),
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      displayName: `${registerDto.firstName} ${registerDto.lastName}`,
      role: 'user',
    });

    // Create account
    const account = await this.accountsService.create({
      userId: user._id,
      email: registerDto.email.toLowerCase(),
      password: hashedPassword,
      accountType: 'email',
    });

    // Generate email verification token
    const verificationToken =
      await this.accountsService.generateEmailVerificationToken(
        account._id.toString(),
      );

    // Send welcome email with verification link (non-blocking)
    this.emailService
      .sendWelcomeEmail({
        name: user.displayName || user.firstName,
        email: account.email,
        verificationToken,
      })
      .catch((error) => {
        // Log error but don't fail registration
        console.error('Failed to send welcome email:', error);
      });

    // Generate tokens
    const tokens = await this.generateTokens(
      user._id.toString(),
      account._id.toString(),
      account.email,
      user.role,
    );

    const userDoc = user.toObject ? user.toObject() : user;
    return {
      ...tokens,
      user: {
        id: userDoc._id.toString(),
        username: userDoc.username,
        firstName: userDoc.firstName,
        lastName: userDoc.lastName,
        displayName: userDoc.displayName,
        avatar: userDoc.avatar,
        bio: userDoc.bio,
        location: userDoc.location,
        website: userDoc.website,
        role: userDoc.role,
        email: account.email,
        emailVerified: account.emailVerified,
      },
    };
  }

  async login(loginDto: LoginDto, req: Request): Promise<AuthResponseDto> {
    // Find account by email
    const account = await this.accountsService.findByEmail(loginDto.email);
    if (!account) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await PasswordUtil.verify(
      account.password,
      loginDto.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Get user
    const user = await this.usersService.findById(account.userId.toString());
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Update last login
    await this.usersService.updateLastLogin(user._id.toString());

    // Create session
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ipAddress = req.ip || req.socket.remoteAddress || 'Unknown';

    // Parse user agent to extract device information
    const deviceInfo = parseUserAgent(userAgent);
    await this.sessionsService.create({
      userId: user._id,
      accountId: account._id,
      userAgent,
      ipAddress,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      deviceType: deviceInfo.deviceType,
      deviceName: deviceInfo.deviceName,
      isActive: true,
      lastActivityAt: new Date(),
    });

    // Generate tokens
    const tokens = await this.generateTokens(
      user._id.toString(),
      account._id.toString(),
      account.email,
      user.role,
    );

    const userDoc = user.toObject ? user.toObject() : user;
    return {
      ...tokens,
      user: {
        id: userDoc._id.toString(),
        username: userDoc.username,
        firstName: userDoc.firstName,
        lastName: userDoc.lastName,
        displayName: userDoc.displayName,
        avatar: userDoc.avatar,
        bio: userDoc.bio,
        location: userDoc.location,
        website: userDoc.website,
        role: userDoc.role,
        email: account.email,
        emailVerified: account.emailVerified,
      },
    };
  }

  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get('jwt.refreshSecret', { infer: true }),
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Verify user and account still exist and are active
      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      const account = await this.accountsService.findById(payload.accountId);
      if (!account || !account.isActive) {
        throw new UnauthorizedException('Account not found or inactive');
      }

      // Generate new tokens (token rotation)
      const tokens = await this.generateTokens(
        user._id.toString(),
        account._id.toString(),
        account.email,
        user.role,
      );

      const userDoc = user.toObject ? user.toObject() : user;
      return {
        ...tokens,
        user: {
          id: userDoc._id.toString(),
          username: userDoc.username,
          firstName: userDoc.firstName,
          lastName: userDoc.lastName,
          displayName: userDoc.displayName,
          avatar: userDoc.avatar,
          bio: userDoc.bio,
          location: userDoc.location,
          website: userDoc.website,
          role: userDoc.role,
          email: account.email,
          emailVerified: account.emailVerified,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async getMe(userId: string, accountId: string): Promise<any> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const account = await this.accountsService.findById(accountId);
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const userDoc = user.toObject ? user.toObject() : user;
    const accountDoc = account.toObject ? account.toObject() : account;

    return {
      id: userDoc._id.toString(),
      username: userDoc.username,
      firstName: userDoc.firstName,
      lastName: userDoc.lastName,
      displayName: userDoc.displayName,
      avatar: userDoc.avatar,
      bio: userDoc.bio,
      location: userDoc.location,
      website: userDoc.website,
      role: userDoc.role,
      email: accountDoc.email,
      emailVerified: accountDoc.emailVerified,
      isActive: userDoc.isActive,
      createdAt: userDoc.createdAt || new Date(),
      updatedAt: userDoc.updatedAt || new Date(),
    };
  }

  async forgotPassword(email: string): Promise<void> {
    // Check if account exists first
    const account = await this.accountsService.findByEmail(email);

    // Security: Don't reveal if email exists to prevent email enumeration attacks
    // Always return success, but only send email if account exists
    if (!account) {
      // Log for security monitoring (non-existent email attempts)
      this.logger.warn(
        `Password reset requested for non-existent email: ${email}`,
      );
      return;
    }

    // Generate reset token
    const token = await this.accountsService.generatePasswordResetToken(email);
    if (!token) {
      // This shouldn't happen if account exists, but handle it gracefully
      this.logger.error(
        `Failed to generate reset token for existing account: ${email}`,
      );
      return;
    }

    // Get user for email personalization
    const user = await this.usersService.findById(account.userId.toString());
    if (!user) {
      this.logger.error(`User not found for account: ${email}`);
      return;
    }

    // Build reset URL
    const frontendConfig = this.configService.get('frontend', { infer: true });
    const frontendUrl = frontendConfig?.url || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    // Send password reset email (non-blocking)
    this.emailService
      .sendForgotPasswordEmail({
        name: user.displayName || user.firstName,
        email: account.email,
        resetToken: token,
        resetUrl,
      })
      .then(() => {
        this.logger.log(`Password reset email sent to: ${email}`);
      })
      .catch((error) => {
        // Log error but don't fail the request
        this.logger.error(
          `Failed to send password reset email to ${email}:`,
          error,
        );
      });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashedPassword = await PasswordUtil.hash(
      newPassword,
      this.configService,
    );
    const updatedAccount = await this.accountsService.resetPassword(
      token,
      hashedPassword,
    );

    if (!updatedAccount) {
      throw new NotFoundException('Invalid or expired reset token');
    }

    // Get user for email
    const user = await this.usersService.findById(
      updatedAccount.userId.toString(),
    );
    if (user) {
      // Send password changed notification (non-blocking)
      this.emailService
        .sendPasswordChangedEmail({
          name: user.displayName || user.firstName,
          email: updatedAccount.email,
        })
        .catch((error) => {
          console.error('Failed to send password changed email:', error);
        });
    }
  }

  async verifyEmail(token: string): Promise<void> {
    await this.accountsService.updateEmailVerification(token);
  }

  async changePassword(
    userId: string,
    accountId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    // Find account
    const account = await this.accountsService.findById(accountId);
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await PasswordUtil.verify(
      account.password,
      currentPassword,
    );
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await PasswordUtil.hash(
      newPassword,
      this.configService,
    );

    // Update password
    await this.accountsService.updatePassword(accountId, hashedPassword);

    // Get user for email notification
    const user = await this.usersService.findById(userId);
    if (user) {
      // Send password changed notification (non-blocking)
      this.emailService
        .sendPasswordChangedEmail({
          name: user.displayName || user.firstName,
          email: account.email,
        })
        .catch((error) => {
          this.logger.error(
            `Failed to send password changed email to ${account.email}:`,
            error,
          );
        });
    }
  }

  private async generateTokens(
    userId: string,
    accountId: string,
    email: string,
    role: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessPayload: JwtPayload = {
      sub: userId,
      email,
      accountId,
      role,
      type: 'access',
    };

    const refreshPayload: JwtPayload = {
      sub: userId,
      email,
      accountId,
      role,
      type: 'refresh',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.configService.get('jwt.accessSecret', { infer: true }),
        expiresIn: this.configService.get('jwt.accessExpiration', {
          infer: true,
        }),
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.configService.get('jwt.refreshSecret', { infer: true }),
        expiresIn: this.configService.get('jwt.refreshExpiration', {
          infer: true,
        }),
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
