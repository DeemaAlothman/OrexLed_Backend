import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { RepresentativeStatus } from '../../../generated/prisma/client';

export class FindRepresentativesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(RepresentativeStatus)
  status?: RepresentativeStatus;

  @IsOptional()
  @IsString()
  search?: string;
}
