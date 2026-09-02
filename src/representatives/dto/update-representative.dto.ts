import { IsEnum } from 'class-validator';
import { RepresentativeStatus } from '../../../generated/prisma/client';

export class UpdateRepresentativeDto {
  @IsEnum(RepresentativeStatus)
  status: RepresentativeStatus;
}
