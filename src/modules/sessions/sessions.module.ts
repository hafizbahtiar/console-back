import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { Session, SessionSchema } from './schemas/session.schema';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { AuthModule } from '../auth/auth.module';
import { isApiProcess } from '../../utils/process-type.util';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Session.name, schema: SessionSchema }]),
    PassportModule,
    // Only import AuthModule in API process (needed for SessionsController with JwtAuthGuard)
    // In scheduler/worker processes, we only need SessionsService for cleanup tasks
    ...(isApiProcess() ? [forwardRef(() => AuthModule)] : []),
  ],
  // Only load controller in API process (scheduler/worker don't need HTTP endpoints)
  controllers: isApiProcess() ? [SessionsController] : [],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
