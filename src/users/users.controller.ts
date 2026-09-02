import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { VideoCreditsService } from './video-credits.service';
import { TopUpCreditsDto } from './dto/top-up-credits.dto';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
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
  findAll(@Query() query: FindUsersQueryDto) {
    return this.usersService.findAll(query);
  }

  @Roles(Role.ADMIN)
  @Patch(':id/role')
  updateRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.usersService.updateRole(id, dto.role);
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
