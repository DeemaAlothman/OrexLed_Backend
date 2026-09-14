import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import type { Response } from 'express';
import { VideoGenerationsService } from './video-generations.service';
import { CreateVideoGenerationDto } from './dto/create-video-generation.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, VideoGenerationStatus } from '../../generated/prisma/client';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';

const UPLOAD_DIR = join(
  process.cwd(),
  'uploads',
  'video-generations',
  'source-images',
);
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

mkdirSync(UPLOAD_DIR, { recursive: true });

@Controller('video-generations')
export class VideoGenerationsController {
  constructor(
    private readonly videoGenerationsService: VideoGenerationsService,
  ) {}

  @HttpCode(HttpStatus.ACCEPTED)
  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, callback) => {
          callback(null, `${randomUUID()}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
          callback(
            new BadRequestException(
              'Only JPEG, PNG, or WEBP images are allowed',
            ),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  create(
    @Body() dto: CreateVideoGenerationDto,
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    const imagePath = image
      ? `/uploads/video-generations/source-images/${image.filename}`
      : null;
    return this.videoGenerationsService.create(user.id, dto, imagePath);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.videoGenerationsService.findByIdForUser(
      id,
      user.id,
      user.role === Role.ADMIN,
    );
  }

  @Get(':id/download')
  async download(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const job = await this.videoGenerationsService.findByIdForUser(
      id,
      user.id,
      user.role === Role.ADMIN,
    );

    if (job.status !== VideoGenerationStatus.COMPLETED || !job.videoPath) {
      throw new BadRequestException('This video is not ready yet');
    }

    const absolutePath = join(process.cwd(), job.videoPath);
    const downloadName = `${job.title.replace(/[^\p{L}\p{N}\s-]/gu, '').trim() || 'video'}.mp4`;
    res.download(absolutePath, downloadName);
  }
}
