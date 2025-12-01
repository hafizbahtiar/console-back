import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Typing Event DTO
 */
export class TypingEventDto {
    @IsBoolean()
    isTyping: boolean;

    @IsString()
    @IsOptional()
    @MaxLength(50, { message: 'Room name cannot exceed 50 characters' })
    room?: string;
}

