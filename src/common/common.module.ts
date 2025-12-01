import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LocationService } from './services/location.service';

@Global()
@Module({
    imports: [ConfigModule],
    providers: [LocationService],
    exports: [LocationService],
})
export class CommonModule { }

