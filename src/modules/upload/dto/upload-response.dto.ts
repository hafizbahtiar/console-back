import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UploadResponseDto {
  @Expose()
  url: string;

  @Expose()
  filename: string;

  @Expose()
  originalName: string;

  @Expose()
  mimetype: string;

  @Expose()
  size: number;

  @Expose()
  path: string;
}

