import {
    Controller,
    Patch,
    Delete,
    Post,
    Get,
    Body,
    Query,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    HttpCode,
    HttpStatus,
    BadRequestException,
    NotFoundException,
    Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { UsersService } from './users.service';
import { AccountsService } from '../accounts/accounts.service';
import { EmailService } from '../email/services/email.service';
import { FileUploadService } from '../upload/services/file-upload.service';
import { ConfigService } from '@nestjs/config';
import { Config } from '../../config/config.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { UserResponseDto } from '../auth/dto/user-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { successResponse } from '../../common/responses/response.util';
import { SuccessResponse } from '../../common/responses/response.interface';
import { plainToInstance } from 'class-transformer';
import { convertNestedToCsv } from '../../common/utils/csv.util';

class UpdateAvatarDto {
    avatar: string;
}

@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly accountsService: AccountsService,
        private readonly emailService: EmailService,
        private readonly fileUploadService: FileUploadService,
        private readonly configService: ConfigService<Config>,
    ) { }

    @Post('profile/avatar')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(FileInterceptor('file'))
    async uploadAvatar(
        @GetUser() user: any,
        @UploadedFile() file: Express.Multer.File,
        @Body() body?: UpdateAvatarDto, // Optional: support both file upload and URL
    ): Promise<SuccessResponse<UserResponseDto>> {
        let avatarUrl: string;

        if (file) {
            // File upload - process and upload the file
            const uploadConfig = this.configService.get('upload', { infer: true });
            const uploaded = await this.fileUploadService.uploadFile(file, {
                maxSize: uploadConfig?.maxImageSize,
                allowedMimeTypes: uploadConfig?.allowedImageTypes,
                destination: 'images',
                resize: {
                    width: 400,
                    height: 400,
                    quality: 90,
                },
            });
            avatarUrl = uploaded.url;
        } else if (body?.avatar) {
            // URL provided - use it directly
            avatarUrl = body.avatar;
        } else {
            throw new BadRequestException('No file or avatar URL provided');
        }

        const updatedUser = await this.usersService.updateAvatar(user.userId, avatarUrl);
        const userDoc = updatedUser.toObject ? updatedUser.toObject() : updatedUser;
        const account = await this.accountsService.findById(user.accountId);
        const accountDoc = account?.toObject ? account.toObject() : account;

        const userData = {
            id: userDoc._id.toString(),
            username: userDoc.username,
            firstName: userDoc.firstName,
            lastName: userDoc.lastName,
            displayName: userDoc.displayName,
            avatar: userDoc.avatar,
            role: userDoc.role,
            email: accountDoc?.email || user.email,
            emailVerified: accountDoc?.emailVerified ?? true,
            isActive: userDoc.isActive,
            createdAt: userDoc.createdAt,
            updatedAt: userDoc.updatedAt,
        };

        const userDto = plainToInstance(UserResponseDto, userData);
        return successResponse(userDto, 'Avatar updated successfully');
    }

    @Patch('profile')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async updateProfile(
        @GetUser() user: any,
        @Body() updateProfileDto: UpdateProfileDto,
    ): Promise<SuccessResponse<UserResponseDto>> {
        const updatedUser = await this.usersService.updateProfile(
            user.userId,
            updateProfileDto,
        );
        const userDoc = updatedUser.toObject ? updatedUser.toObject() : updatedUser;
        const account = await this.accountsService.findById(user.accountId);
        const accountDoc = account?.toObject ? account.toObject() : account;

        const userData = {
            id: userDoc._id.toString(),
            username: userDoc.username,
            firstName: userDoc.firstName,
            lastName: userDoc.lastName,
            displayName: userDoc.displayName,
            avatar: userDoc.avatar,
            role: userDoc.role,
            email: accountDoc?.email || user.email,
            emailVerified: accountDoc?.emailVerified ?? true,
            isActive: userDoc.isActive,
            createdAt: userDoc.createdAt,
            updatedAt: userDoc.updatedAt,
        };

        const userDto = plainToInstance(UserResponseDto, userData);

        return successResponse(userDto, 'Profile updated successfully');
    }

    @Post('account/request-deletion')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async requestAccountDeletion(
        @GetUser() user: any,
    ): Promise<SuccessResponse<{ message: string }>> {
        // Generate deletion token
        const token = await this.accountsService.generateAccountDeletionToken(
            user.accountId,
        );

        // Get user and account info for email
        const userDoc = await this.usersService.findById(user.userId);
        const account = await this.accountsService.findById(user.accountId);

        if (!userDoc || !account) {
            throw new NotFoundException('User or account not found');
        }

        // Send deletion confirmation email
        const frontendConfig = this.configService.get('frontend', { infer: true });
        const frontendUrl = frontendConfig?.url || 'http://localhost:3000';
        const deletionUrl = `${frontendUrl}/account-deletion?token=${token}`;

        await this.emailService.sendAccountDeletionEmail({
            name: userDoc.firstName || userDoc.username,
            email: account.email,
            confirmationToken: token,
            deletionUrl,
        });

        return successResponse(
            { message: 'Account deletion confirmation email sent' },
            'Please check your email for account deletion confirmation instructions',
        );
    }

    @Delete('account')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async deleteAccount(
        @GetUser() user: any,
        @Body() deleteAccountDto: DeleteAccountDto,
    ): Promise<SuccessResponse<{ message: string }>> {
        // Verify the confirmation token
        const account = await this.accountsService.verifyAccountDeletionToken(
            deleteAccountDto.confirmationToken,
        );

        if (!account) {
            throw new NotFoundException('Invalid or expired confirmation token');
        }

        // Verify the account belongs to the user
        if (account.userId.toString() !== user.userId) {
            throw new BadRequestException('Confirmation token does not match your account');
        }

        // Get user info for email
        const userDoc = await this.usersService.findById(user.userId);
        if (!userDoc) {
            throw new NotFoundException('User not found');
        }

        // Delete the account and all related data
        await this.usersService.deleteAccount(user.userId, user.accountId);

        // Send confirmation email
        try {
            const frontendConfig = this.configService.get('frontend', { infer: true });
            const frontendUrl = frontendConfig?.url || 'http://localhost:3000';
            const deletionUrl = `${frontendUrl}/account-deleted?token=${deleteAccountDto.confirmationToken}`;

            await this.emailService.sendAccountDeletionEmail({
                name: userDoc.firstName || userDoc.username,
                email: account.email,
                confirmationToken: deleteAccountDto.confirmationToken,
                deletionUrl,
            });
        } catch (error) {
            // Log error but don't fail the deletion
            console.error('Failed to send account deletion confirmation email', error);
        }

        return successResponse(
            { message: 'Account deleted successfully' },
            'Your account and all associated data have been permanently deleted',
        );
    }

    @Post('account/deactivate')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async deactivateAccount(
        @GetUser() user: any,
    ): Promise<SuccessResponse<UserResponseDto>> {
        const updatedUser = await this.usersService.deactivateAccount(user.userId);
        const userDoc = updatedUser.toObject ? updatedUser.toObject() : updatedUser;
        const account = await this.accountsService.findById(user.accountId);
        const accountDoc = account?.toObject ? account.toObject() : account;

        const userData = {
            id: userDoc._id.toString(),
            username: userDoc.username,
            firstName: userDoc.firstName,
            lastName: userDoc.lastName,
            displayName: userDoc.displayName,
            avatar: userDoc.avatar,
            role: userDoc.role,
            email: accountDoc?.email || user.email,
            emailVerified: accountDoc?.emailVerified ?? true,
            isActive: userDoc.isActive,
            createdAt: userDoc.createdAt,
            updatedAt: userDoc.updatedAt,
        };

        const userDto = plainToInstance(UserResponseDto, userData);

        return successResponse(userDto, 'Account deactivated successfully');
    }

    @Post('account/reactivate')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async reactivateAccount(
        @GetUser() user: any,
    ): Promise<SuccessResponse<UserResponseDto>> {
        const updatedUser = await this.usersService.reactivateAccount(user.userId);
        const userDoc = updatedUser.toObject ? updatedUser.toObject() : updatedUser;
        const account = await this.accountsService.findById(user.accountId);
        const accountDoc = account?.toObject ? account.toObject() : account;

        const userData = {
            id: userDoc._id.toString(),
            username: userDoc.username,
            firstName: userDoc.firstName,
            lastName: userDoc.lastName,
            displayName: userDoc.displayName,
            avatar: userDoc.avatar,
            role: userDoc.role,
            email: accountDoc?.email || user.email,
            emailVerified: accountDoc?.emailVerified ?? true,
            isActive: userDoc.isActive,
            createdAt: userDoc.createdAt,
            updatedAt: userDoc.updatedAt,
        };

        const userDto = plainToInstance(UserResponseDto, userData);

        return successResponse(userDto, 'Account reactivated successfully');
    }

    @Get('account/export')
    @UseGuards(JwtAuthGuard)
    async exportAccountData(
        @GetUser() user: any,
        @Query('format') format: string = 'json',
        @Res() res: Response,
    ): Promise<void> {
        const exportData = await this.usersService.exportAccountData(user.userId);

        if (format === 'csv') {
            // Convert to CSV format
            const csvContent = convertNestedToCsv(exportData);
            const filename = `account-data-${new Date().toISOString().split('T')[0]}.csv`;

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.send(csvContent);
        } else {
            // Return as JSON
            const filename = `account-data-${new Date().toISOString().split('T')[0]}.json`;

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.json(exportData);
        }
    }
}
