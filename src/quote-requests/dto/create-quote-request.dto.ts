import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateQuoteRequestDto {
  /** If set, name and phone are taken from the representative's own data instead of the fields below. */
  @IsOptional()
  @IsUUID()
  representativeId?: string;

  @ValidateIf((dto: CreateQuoteRequestDto) => !dto.representativeId)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ValidateIf((dto: CreateQuoteRequestDto) => !dto.representativeId)
  @IsString()
  @Matches(/^\+?[0-9]{7,15}$/, { message: 'Invalid mobile number' })
  phone?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(255)
  location: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  length: number;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  width: number;
}
