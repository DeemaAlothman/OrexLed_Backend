import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { MaintenanceRequestStatus } from '../../../generated/prisma/client';

export class UpdateMaintenanceRequestDto {
  @IsOptional()
  @IsEnum(MaintenanceRequestStatus)
  status?: MaintenanceRequestStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  assignedTo?: string;
}
