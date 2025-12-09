import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { Config } from '../../config/config.interface';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { AccountsModule } from '../accounts/accounts.module';
import { SessionsModule } from '../sessions/sessions.module';
import { EmailModule } from '../email/email.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OwnerOnlyGuard } from './guards/owner-only.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<Config>) => ({
        secret: configService.get('jwt.accessSecret', { infer: true }),
        signOptions: {
          expiresIn: configService.get('jwt.accessExpiration', { infer: true }),
        },
      }),
      inject: [ConfigService],
    }),
    forwardRef(() => UsersModule),
    AccountsModule,
    forwardRef(() => SessionsModule),
    forwardRef(() => EmailModule), // Use forwardRef to break circular dependency with NotificationsModule
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy, JwtAuthGuard, OwnerOnlyGuard],
  exports: [AuthService, JwtStrategy, JwtRefreshStrategy, PassportModule, JwtModule, JwtAuthGuard, OwnerOnlyGuard],
})
export class AuthModule { }
