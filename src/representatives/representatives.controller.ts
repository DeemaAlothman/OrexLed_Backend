import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { RepresentativesService } from './representatives.service';
import { CreateRepresentativeDto } from './dto/create-representative.dto';
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
  findAll() {
    return this.representativesService.findAll();
  }
}
