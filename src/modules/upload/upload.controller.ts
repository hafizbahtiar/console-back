import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { FileUploadService } from './services/file-upload.service';
import { UploadResponseDto } from './dto/upload-response.dto';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import { Config } from '../../config/config.interface';
import { successResponse } from '../../common/responses/response.util';
import { SuccessResponse } from '../../common/responses/response.interface';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(
    private readonly fileUploadService: FileUploadService,
    private readonly configService: ConfigService<Config>,
  ) {}

  @Post('image')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<SuccessResponse<UploadResponseDto>> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const uploadConfig = this.configService.get('upload', { infer: true });
    const uploaded = await this.fileUploadService.uploadFile(file, {
      maxSize: uploadConfig?.maxImageSize,
      allowedMimeTypes: uploadConfig?.allowedImageTypes,
      destination: 'images',
      generateThumbnail: true,
      resize: {
        width: 300,
        height: 300,
        quality: 80,
      },
    });

    const uploadDto = plainToInstance(UploadResponseDto, uploaded, {
      excludeExtraneousValues: true,
    });

    return successResponse(uploadDto, 'Image uploaded successfully');
  }

  @Post('images')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<SuccessResponse<UploadResponseDto[]>> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const uploadConfig = this.configService.get('upload', { infer: true });
    const uploaded = await this.fileUploadService.uploadMultipleFiles(files, {
      maxSize: uploadConfig?.maxImageSize,
      allowedMimeTypes: uploadConfig?.allowedImageTypes,
      destination: 'images',
      generateThumbnail: true,
      resize: {
        width: 300,
        height: 300,
        quality: 80,
      },
    });

    const uploadDtos = uploaded.map((file) =>
      plainToInstance(UploadResponseDto, file, {
        excludeExtraneousValues: true,
      }),
    );

    return successResponse(uploadDtos, 'Images uploaded successfully');
  }

  @Post('document')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<SuccessResponse<UploadResponseDto>> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const uploadConfig = this.configService.get('upload', { infer: true });
    const uploaded = await this.fileUploadService.uploadFile(file, {
      maxSize: uploadConfig?.maxFileSize,
      allowedMimeTypes: uploadConfig?.allowedDocumentTypes,
      destination: 'documents',
    });

    const uploadDto = plainToInstance(UploadResponseDto, uploaded, {
      excludeExtraneousValues: true,
    });

    return successResponse(uploadDto, 'Document uploaded successfully');
  }

  @Post('avatar')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<SuccessResponse<UploadResponseDto>> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

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

    const uploadDto = plainToInstance(UploadResponseDto, uploaded, {
      excludeExtraneousValues: true,
    });

    return successResponse(uploadDto, 'Avatar uploaded successfully');
  }

  @Post('resume')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  async uploadResume(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<SuccessResponse<UploadResponseDto>> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const uploadConfig = this.configService.get('upload', { infer: true });
    const uploaded = await this.fileUploadService.uploadFile(file, {
      maxSize: uploadConfig?.maxFileSize,
      allowedMimeTypes: uploadConfig?.allowedDocumentTypes,
      destination: 'documents',
    });

    const uploadDto = plainToInstance(UploadResponseDto, uploaded, {
      excludeExtraneousValues: true,
    });

    return successResponse(uploadDto, 'Resume uploaded successfully');
  }
}

