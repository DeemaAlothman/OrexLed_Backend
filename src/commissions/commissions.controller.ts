import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CommissionsService } from './commissions.service';
import { FindCommissionsQueryDto } from './dto/find-commissions-query.dto';
import { PayCommissionDto } from './dto/pay-commission.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../../generated/prisma/client';

@Roles(Role.ADMIN)
@Controller('commissions')
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  @Get()
  findAll(@Query() query: FindCommissionsQueryDto) {
    return this.commissionsService.findAll(query);
  }

  @Post(':id/pay')
  pay(@Param('id') id: string, @Body() dto: PayCommissionDto) {
    return this.commissionsService.pay(id, dto);
  }
}
