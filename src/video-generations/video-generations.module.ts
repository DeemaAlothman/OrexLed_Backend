import { Module } from '@nestjs/common';
import { VideoGenerationsService } from './video-generations.service';
import { VideoGenerationsController } from './video-generations.controller';
import { VeoService } from './veo.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [VideoGenerationsController],
  providers: [VideoGenerationsService, VeoService],
})
export class VideoGenerationsModule {}
