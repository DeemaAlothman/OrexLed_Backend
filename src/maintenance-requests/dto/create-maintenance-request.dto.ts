import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateMaintenanceRequestDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsString()
  @Matches(/^\+?[0-9]{7,15}$/, { message: 'Invalid mobile number' })
  phone: string;

  @IsString()
  @MinLength(2)
  @MaxLength(255)
  address: string;

  @IsString()
  @MinLength(2)
  @MaxLength(1000)
  problem: string;
}
