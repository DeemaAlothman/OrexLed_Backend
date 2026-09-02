import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { VideoAspectRatio, VideoStyle } from '../../../generated/prisma/client';

export class CreateVideoGenerationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  title: string;

  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  prompt: string;

  @IsOptional()
  @IsEnum(VideoStyle)
  style?: VideoStyle;

  @IsOptional()
  @IsEnum(VideoAspectRatio)
  aspectRatio?: VideoAspectRatio;
}
