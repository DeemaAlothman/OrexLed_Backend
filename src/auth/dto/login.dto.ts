import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  /** A phone number (new accounts) or an email address (legacy accounts registered before the phone switch). */
  @IsString()
  @MinLength(3)
  identifier: string;

  @IsString()
  @MinLength(1)
  password: string;
}
