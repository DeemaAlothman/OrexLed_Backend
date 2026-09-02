import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { VideoCreditsService } from './video-credits.service';
import { TopUpCreditsDto } from './dto/top-up-credits.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../../generated/prisma/client';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly videoCreditsService: VideoCreditsService,
  ) {}

  @Roles(Role.ADMIN)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get('me')
  findMe(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findByIdSafe(user.id);
  }

  @Get('me/credits/history')
  findMyCreditHistory(@CurrentUser() user: AuthenticatedUser) {
    return this.videoCreditsService.findHistoryForUser(user.id);
  }

  @Roles(Role.ADMIN)
  @Post(':id/credits/top-up')
  topUpCredits(
    @Param('id') id: string,
    @Body() dto: TopUpCreditsDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.videoCreditsService.topUp(id, dto.amount, admin.id, dto.note);
  }
}
