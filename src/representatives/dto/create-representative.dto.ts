import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Gender } from '../../../generated/prisma/client';

export class CreateRepresentativeDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lineage: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fatherName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(150)
  motherName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  birthPlace: string;

  @IsDateString()
  birthDate: string;

  @IsString()
  @Matches(/^[0-9]{6,15}$/, { message: 'Invalid national ID' })
  nationalId: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsString()
  @MinLength(2)
  @MaxLength(255)
  address: string;

  @IsString()
  @Matches(/^\+?[0-9]{7,15}$/, { message: 'Invalid mobile number' })
  phone: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  shamCashWallet?: string;
}
