export interface FileUploadOptions {
  maxSize?: number;
  allowedMimeTypes?: string[];
  destination?: string;
  generateThumbnail?: boolean;
  resize?: {
    width?: number;
    height?: number;
    quality?: number;
  };
}

export interface UploadedFile {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  url: string;
  thumbnailUrl?: string;
}

