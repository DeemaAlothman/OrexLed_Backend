import { Controller, Get } from '@nestjs/common';
import { StatsService } from './stats.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../../generated/prisma/client';

@Roles(Role.ADMIN)
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('summary')
  summary() {
    return this.statsService.summary();
  }
}
