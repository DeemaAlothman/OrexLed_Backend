import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { MaintenanceRequestStatus } from '../../../generated/prisma/client';

export class FindMaintenanceRequestsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(MaintenanceRequestStatus)
  status?: MaintenanceRequestStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
