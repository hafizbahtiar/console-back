import { IsString, IsNotEmpty, IsOptional, MaxLength, MinLength } from 'class-validator';

/**
 * Message Event DTO
 * 
 * Validates message event payloads.
 */
export class MessageEventDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(1, { message: 'Message cannot be empty' })
    @MaxLength(1000, { message: 'Message cannot exceed 1000 characters' })
    message: string;

    @IsString()
    @IsOptional()
    @MaxLength(50, { message: 'Room name cannot exceed 50 characters' })
    room?: string;
}

