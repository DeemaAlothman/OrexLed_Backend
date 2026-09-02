import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RepresentativesService } from './representatives.service';
import { CreateRepresentativeDto } from './dto/create-representative.dto';
import { FindRepresentativesQueryDto } from './dto/find-representatives-query.dto';
import { UpdateRepresentativeDto } from './dto/update-representative.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../../generated/prisma/client';

@Controller('representatives')
export class RepresentativesController {
  constructor(
    private readonly representativesService: RepresentativesService,
  ) {}

  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Post()
  create(@Body() dto: CreateRepresentativeDto) {
    return this.representativesService.create(dto);
  }

  @Roles(Role.ADMIN)
  @Get()
  findAll(@Query() query: FindRepresentativesQueryDto) {
    return this.representativesService.findAll(query);
  }

  @Roles(Role.ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.representativesService.findByIdOrThrow(id);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRepresentativeDto) {
    return this.representativesService.update(id, dto);
  }
}
