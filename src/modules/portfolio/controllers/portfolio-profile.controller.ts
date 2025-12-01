import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, UseGuards } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import {
    successResponse,
} from '../../../common/responses/response.util';
import { SuccessResponse } from '../../../common/responses/response.interface';
import { PortfolioProfileService } from '../services/portfolio-profile.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { PortfolioProfileResponseDto } from '../dto/profile/portfolio-profile-response.dto';
import { UpdatePortfolioProfileDto } from '../dto/profile/update-portfolio-profile.dto';

class UpdateAvatarDto {
  avatar: string;
}

class UpdateResumeDto {
  resumeUrl: string;
}

@Controller('portfolio/profile')
@UseGuards(JwtAuthGuard)
export class PortfolioProfileController {
  constructor(private readonly portfolioProfileService: PortfolioProfileService) {}

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
  async uploadAvatar(
    @GetUser() user: any,
    @Body() body: UpdateAvatarDto,
  ): Promise<SuccessResponse<PortfolioProfileResponseDto>> {
    const profile = await this.portfolioProfileService.updateAvatar(user.userId, body.avatar);
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
