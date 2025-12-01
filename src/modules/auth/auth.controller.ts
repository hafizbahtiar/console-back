import {
    Controller,
    Post,
    Get,
    Body,
    UseGuards,
    Req,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { GetUser } from './decorators/get-user.decorator';
import {
    successResponse,
    createdResponse,
} from '../../common/responses/response.util';
import { SuccessResponse } from '../../common/responses/response.interface';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() registerDto: RegisterDto): Promise<SuccessResponse<AuthResponseDto>> {
        const authResponse = await this.authService.register(registerDto);
        return createdResponse(authResponse, 'User registered successfully');
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto, @Req() req: Request): Promise<SuccessResponse<AuthResponseDto>> {
        const authResponse = await this.authService.login(loginDto, req);
        return successResponse(authResponse, 'Login successful');
    }

    @Post('refresh')
    @UseGuards(JwtRefreshGuard)
    @HttpCode(HttpStatus.OK)
    async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<SuccessResponse<AuthResponseDto>> {
        const authResponse = await this.authService.refresh(refreshTokenDto.refreshToken);
        return successResponse(authResponse, 'Token refreshed successfully');
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async logout(): Promise<SuccessResponse<{ message: string }>> {
        // Stateless JWT - client removes tokens
        return successResponse({ message: 'Logged out successfully' }, 'Logged out successfully');
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getMe(@GetUser() user: any): Promise<SuccessResponse<any>> {
        const userData = await this.authService.getMe(user.userId, user.accountId);
        return successResponse(userData, 'User retrieved successfully');
    }

    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<SuccessResponse<{ message: string }>> {
        await this.authService.forgotPassword(forgotPasswordDto.email);
        return successResponse(
            { message: 'If the email exists, a reset link has been sent' },
            'If the email exists, a reset link has been sent',
        );
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<SuccessResponse<{ message: string }>> {
        await this.authService.resetPassword(
            resetPasswordDto.token,
            resetPasswordDto.password,
        );
        return successResponse(
            { message: 'Password reset successfully' },
            'Password reset successfully',
        );
    }

    @Post('verify-email')
    @HttpCode(HttpStatus.OK)
    async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto): Promise<SuccessResponse<{ message: string }>> {
        await this.authService.verifyEmail(verifyEmailDto.token);
        return successResponse(
            { message: 'Email verified successfully' },
            'Email verified successfully',
        );
    }

    @Post('change-password')
    @UseGuards(JwtAuthGuard)
    @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute for password change
    @HttpCode(HttpStatus.OK)
    async changePassword(
        @GetUser() user: any,
        @Body() changePasswordDto: ChangePasswordDto,
    ): Promise<SuccessResponse<{ message: string }>> {
        await this.authService.changePassword(
            user.userId,
            user.accountId,
            changePasswordDto.currentPassword,
            changePasswordDto.newPassword,
        );
        return successResponse(
            { message: 'Password changed successfully' },
            'Password changed successfully',
        );
    }
}
