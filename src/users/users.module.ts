import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { VideoCreditsService } from './video-credits.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, VideoCreditsService],
  exports: [UsersService, VideoCreditsService],
})
export class UsersModule {}
