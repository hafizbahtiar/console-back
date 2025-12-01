import {
  Controller,
  Get,
  Delete,
  UseGuards,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { SessionResponseDto } from '../auth/dto/session-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { successResponse, noContentResponse } from '../../common/responses/response.util';
import { SuccessResponse } from '../../common/responses/response.interface';
import { plainToInstance } from 'class-transformer';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getSessions(@GetUser() user: any): Promise<SuccessResponse<SessionResponseDto[]>> {
    const sessions = await this.sessionsService.findByUserId(user.userId);
    const sessionsDto = sessions.map((session) =>
      plainToInstance(SessionResponseDto, session),
    );
    return successResponse(sessionsDto, 'Sessions retrieved successfully');
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async revokeSession(
    @GetUser() user: any,
    @Param('id') sessionId: string,
  ): Promise<SuccessResponse<{ message: string }>> {
    await this.sessionsService.revokeSession(user.userId, sessionId);
    return successResponse(
      { message: 'Session revoked successfully' },
      'Session revoked successfully',
    );
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async revokeAllSessions(
    @GetUser() user: any,
  ): Promise<SuccessResponse<{ message: string }>> {
    await this.sessionsService.revokeAllSessions(user.userId);
    return successResponse(
      { message: 'All sessions revoked successfully' },
      'All sessions revoked successfully',
    );
  }
}
