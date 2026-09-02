import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { QuoteRequestStatus } from '../../../generated/prisma/client';

export class FindQuoteRequestsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(QuoteRequestStatus)
  status?: QuoteRequestStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsUUID()
  representativeId?: string;
}
