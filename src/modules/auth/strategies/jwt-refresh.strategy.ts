import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Config } from '../../../config/config.interface';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { UsersService } from '../../users/users.service';
import { AccountsService } from '../../accounts/accounts.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private configService: ConfigService<Config>,
    private usersService: UsersService,
    private accountsService: AccountsService,
  ) {
    const secret = configService.get('jwt.refreshSecret', { infer: true });
    if (!secret) {
      throw new Error(
        'JWT_REFRESH_SECRET is not defined in environment variables',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const account = await this.accountsService.findById(payload.accountId);
    if (!account || !account.isActive) {
      throw new UnauthorizedException('Account not found or inactive');
    }

    return {
      userId: user._id.toString(),
      accountId: account._id.toString(),
      email: account.email,
      role: user.role,
      username: user.username,
    };
  }
}
