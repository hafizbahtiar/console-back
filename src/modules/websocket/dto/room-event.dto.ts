import { IsString, IsNotEmpty, MaxLength, MinLength, Matches } from 'class-validator';

/**
 * Join Room Event DTO
 */
export class JoinRoomEventDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(1, { message: 'Room name cannot be empty' })
    @MaxLength(50, { message: 'Room name cannot exceed 50 characters' })
    @Matches(/^[a-zA-Z0-9_-]+$/, { message: 'Room name can only contain letters, numbers, underscores, and hyphens' })
    room: string;
}

/**
 * Leave Room Event DTO
 */
export class LeaveRoomEventDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(1, { message: 'Room name cannot be empty' })
    @MaxLength(50, { message: 'Room name cannot exceed 50 characters' })
    room: string;
}

