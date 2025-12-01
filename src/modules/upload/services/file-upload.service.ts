import {
  Injectable,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from 'fs';
import { join, extname, basename } from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { Config } from '../../../config/config.interface';
import { FileUploadOptions, UploadedFile } from '../interfaces/file-upload-options.interface';

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);
  private readonly uploadConfig: NonNullable<Config['upload']>;

  constructor(private configService: ConfigService<Config>) {
    const config = this.configService.get('upload', { infer: true });
    this.uploadConfig = config || {
      maxFileSize: 10485760, // 10MB
      maxImageSize: 5242880, // 5MB
      allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      allowedDocumentTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
      ],
      storagePath: 'uploads',
      publicUrl: 'http://localhost:8000/api/v1/uploads',
    };

    // Ensure upload directories exist
    this.ensureDirectoriesExist();
  }

  private ensureDirectoriesExist(): void {
    const basePath = this.getStoragePath();
    const directories = ['images', 'documents', 'thumbnails'];

    directories.forEach((dir) => {
      const dirPath = join(basePath, dir);
      if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true });
        this.logger.log(`Created upload directory: ${dirPath}`);
      }
    });
  }

  private getStoragePath(): string {
    return join(process.cwd(), this.uploadConfig.storagePath);
  }

  private getPublicUrl(): string {
    return this.uploadConfig.publicUrl;
  }

  private validateFile(
    file: Express.Multer.File,
    options?: FileUploadOptions,
  ): void {
    const maxSize = options?.maxSize || this.uploadConfig.maxFileSize;
    const allowedTypes = options?.allowedMimeTypes || [
      ...this.uploadConfig.allowedImageTypes,
      ...this.uploadConfig.allowedDocumentTypes,
    ];

    // Validate file size
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`,
      );
    }

    // Validate file type
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      );
    }
  }

  private generateUniqueFilename(originalName: string): string {
    const ext = extname(originalName);
    const name = basename(originalName, ext);
    const sanitizedName = name.replace(/[^a-zA-Z0-9-_]/g, '_');
    return `${sanitizedName}_${uuidv4()}${ext}`;
  }

  private isImage(mimetype: string): boolean {
    return this.uploadConfig.allowedImageTypes.includes(mimetype);
  }

  async uploadFile(
    file: Express.Multer.File,
    options?: FileUploadOptions,
  ): Promise<UploadedFile> {
    try {
      // Validate file
      this.validateFile(file, options);

      // Determine destination directory
      const isImageFile = this.isImage(file.mimetype);
      const destination = options?.destination || (isImageFile ? 'images' : 'documents');
      const storagePath = this.getStoragePath();
      const destPath = join(storagePath, destination);

      // Ensure destination directory exists
      if (!existsSync(destPath)) {
        mkdirSync(destPath, { recursive: true });
      }

      // Generate unique filename
      const filename = this.generateUniqueFilename(file.originalname);
      const filePath = join(destPath, filename);

      // Save file
      writeFileSync(filePath, file.buffer);

      // Process image if needed
      let thumbnailUrl: string | undefined;
      if (isImageFile && (options?.generateThumbnail || options?.resize)) {
        const processedImage = await this.processImage(file.buffer, options);
        const processedPath = join(destPath, `thumb_${filename}`);
        writeFileSync(processedPath, processedImage);
        thumbnailUrl = `${this.getPublicUrl()}/${destination}/thumb_${filename}`;
      }

      const publicUrl = `${this.getPublicUrl()}/${destination}/${filename}`;

      this.logger.log(`File uploaded successfully: ${filename}`);

      return {
        filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: filePath,
        url: publicUrl,
        thumbnailUrl,
      };
    } catch (error) {
      this.logger.error(`File upload failed: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    options?: FileUploadOptions,
  ): Promise<UploadedFile[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file, options));
    return Promise.all(uploadPromises);
  }

  private async processImage(
    buffer: Buffer,
    options?: FileUploadOptions,
  ): Promise<Buffer> {
    try {
      let sharpInstance = sharp(buffer);

      // Resize if specified
      if (options?.resize) {
        const resizeOptions: sharp.ResizeOptions = {};
        if (options.resize.width) resizeOptions.width = options.resize.width;
        if (options.resize.height) resizeOptions.height = options.resize.height;
        if (!resizeOptions.width && !resizeOptions.height) {
          // Default thumbnail size
          resizeOptions.width = 300;
          resizeOptions.height = 300;
        }
        resizeOptions.fit = 'inside';
        resizeOptions.withoutEnlargement = true;
        sharpInstance = sharpInstance.resize(resizeOptions);
      }

      // Set quality if specified (for JPEG/WebP)
      if (options?.resize?.quality) {
        sharpInstance = sharpInstance.jpeg({ quality: options.resize.quality });
      } else {
        // Default quality for thumbnails
        sharpInstance = sharpInstance.jpeg({ quality: 80 });
      }

      return await sharpInstance.toBuffer();
    } catch (error) {
      this.logger.error(`Image processing failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to process image');
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
        this.logger.log(`File deleted: ${filePath}`);

        // Also try to delete thumbnail if it exists
        const thumbnailPath = filePath.replace(
          basename(filePath),
          `thumb_${basename(filePath)}`,
        );
        if (existsSync(thumbnailPath)) {
          unlinkSync(thumbnailPath);
          this.logger.log(`Thumbnail deleted: ${thumbnailPath}`);
        }
      }
    } catch (error) {
      this.logger.error(`File deletion failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to delete file');
    }
  }

  async optimizeImage(
    buffer: Buffer,
    options?: { width?: number; height?: number; quality?: number },
  ): Promise<Buffer> {
    try {
      let sharpInstance = sharp(buffer);

      if (options?.width || options?.height) {
        sharpInstance = sharpInstance.resize({
          width: options.width,
          height: options.height,
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      if (options?.quality) {
        sharpInstance = sharpInstance.jpeg({ quality: options.quality });
      }

      return await sharpInstance.toBuffer();
    } catch (error) {
      this.logger.error(`Image optimization failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to optimize image');
    }
  }
}

