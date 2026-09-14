import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @Matches(/^\+?[0-9]{7,15}$/, { message: 'Invalid mobile number' })
  phone: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(72, { message: 'Password must be at most 72 characters long' })
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;
}
