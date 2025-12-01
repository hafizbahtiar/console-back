import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { plainToInstance } from 'class-transformer';
import {
  successResponse,
} from '../../../common/responses/response.util';
import { SuccessResponse } from '../../../common/responses/response.interface';
import { PortfolioProfileService } from '../services/portfolio-profile.service';
import { FileUploadService } from '../../upload/services/file-upload.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { PortfolioProfileResponseDto } from '../dto/profile/portfolio-profile-response.dto';
import { UpdatePortfolioProfileDto } from '../dto/profile/update-portfolio-profile.dto';
import { ConfigService } from '@nestjs/config';
import { Config } from '../../../config/config.interface';

class UpdateAvatarDto {
  avatar: string;
}

class UpdateResumeDto {
  resumeUrl: string;
}

@Controller('portfolio/profile')
@UseGuards(JwtAuthGuard)
export class PortfolioProfileController {
  constructor(
    private readonly portfolioProfileService: PortfolioProfileService,
    private readonly fileUploadService: FileUploadService,
    private readonly configService: ConfigService<Config>,
  ) { }

  @Get()
  async getProfile(@GetUser() user: any): Promise<SuccessResponse<PortfolioProfileResponseDto>> {
    const profile = await this.portfolioProfileService.getByUserId(user.userId);
    const profileDto = plainToInstance(PortfolioProfileResponseDto, profile.toObject(), {
      excludeExtraneousValues: true,
    });
    return successResponse(profileDto, 'Portfolio profile retrieved successfully');
  }

  @Patch()
  async updateProfile(
    @GetUser() user: any,
    @Body() updateDto: UpdatePortfolioProfileDto,
  ): Promise<SuccessResponse<PortfolioProfileResponseDto>> {
    const profile = await this.portfolioProfileService.updateByUserId(user.userId, updateDto);
    const profileDto = plainToInstance(PortfolioProfileResponseDto, profile.toObject(), {
      excludeExtraneousValues: true,
    });
    return successResponse(profileDto, 'Portfolio profile updated successfully');
  }

  @Post('avatar')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @GetUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() body?: UpdateAvatarDto, // Optional: support both file upload and URL
  ): Promise<SuccessResponse<PortfolioProfileResponseDto>> {
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

    const profile = await this.portfolioProfileService.updateAvatar(user.userId, avatarUrl);
    const profileDto = plainToInstance(PortfolioProfileResponseDto, profile.toObject(), {
      excludeExtraneousValues: true,
    });
    return successResponse(profileDto, 'Avatar updated successfully');
  }

  @Post('resume')
  @HttpCode(HttpStatus.OK)
  async uploadResume(
    @GetUser() user: any,
    @Body() body: UpdateResumeDto,
  ): Promise<SuccessResponse<PortfolioProfileResponseDto>> {
    const profile = await this.portfolioProfileService.updateResume(user.userId, body.resumeUrl);
    const profileDto = plainToInstance(PortfolioProfileResponseDto, profile.toObject(), {
      excludeExtraneousValues: true,
    });
    return successResponse(profileDto, 'Resume updated successfully');
  }
}
