import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { QuoteRequestStatus } from '../../../generated/prisma/client';

export class UpdateQuoteRequestDto {
  @IsOptional()
  @IsEnum(QuoteRequestStatus)
  status?: QuoteRequestStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  quotedPrice?: number;
}
