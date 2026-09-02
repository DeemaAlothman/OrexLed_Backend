import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { extname, join } from 'path';
import { mkdirSync, unlinkSync } from 'fs';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { FindProjectsQueryDto } from './dto/find-projects-query.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../../generated/prisma/client';

const IMAGE_DIR = join(process.cwd(), 'uploads', 'projects', 'images');
const VIDEO_DIR = join(process.cwd(), 'uploads', 'projects', 'videos');
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024;

mkdirSync(IMAGE_DIR, { recursive: true });
mkdirSync(VIDEO_DIR, { recursive: true });

type ProjectUploadFiles = {
  image?: Express.Multer.File[];
  video?: Express.Multer.File[];
};

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'video', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: (_req, file, callback) => {
            callback(null, file.fieldname === 'video' ? VIDEO_DIR : IMAGE_DIR);
          },
          filename: (_req, file, callback) => {
            callback(null, `${randomUUID()}${extname(file.originalname)}`);
          },
        }),
        limits: { fileSize: MAX_VIDEO_SIZE_BYTES },
        fileFilter: (_req, file, callback) => {
          if (
            file.fieldname === 'image' &&
            !ALLOWED_IMAGE_TYPES.includes(file.mimetype)
          ) {
            callback(
              new BadRequestException(
                'Only JPEG, PNG, or WEBP images are allowed',
              ),
              false,
            );
            return;
          }
          if (
            file.fieldname === 'video' &&
            !ALLOWED_VIDEO_TYPES.includes(file.mimetype)
          ) {
            callback(
              new BadRequestException(
                'Only MP4, WEBM, or MOV videos are allowed',
              ),
              false,
            );
            return;
          }
          callback(null, true);
        },
      },
    ),
  )
  create(
    @Body() dto: CreateProjectDto,
    @UploadedFiles() files: ProjectUploadFiles,
  ) {
    const image = files.image?.[0];
    const video = files.video?.[0];

    if (!image) {
      throw new BadRequestException('Project image is required');
    }
    if (!video) {
      throw new BadRequestException('Project video is required');
    }
    if (image.size > MAX_IMAGE_SIZE_BYTES) {
      unlinkSync(image.path);
      throw new BadRequestException('Image exceeds the 5MB limit');
    }
    if (video.size > MAX_VIDEO_SIZE_BYTES) {
      unlinkSync(video.path);
      throw new BadRequestException('Video exceeds the 100MB limit');
    }

    return this.projectsService.create(
      dto,
      `/uploads/projects/images/${image.filename}`,
      `/uploads/projects/videos/${video.filename}`,
    );
  }

  @Public()
  @Get()
  findAll(@Query() query: FindProjectsQueryDto) {
    return this.projectsService.findAll(query);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'video', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: (_req, file, callback) => {
            callback(null, file.fieldname === 'video' ? VIDEO_DIR : IMAGE_DIR);
          },
          filename: (_req, file, callback) => {
            callback(null, `${randomUUID()}${extname(file.originalname)}`);
          },
        }),
        limits: { fileSize: MAX_VIDEO_SIZE_BYTES },
        fileFilter: (_req, file, callback) => {
          if (
            file.fieldname === 'image' &&
            !ALLOWED_IMAGE_TYPES.includes(file.mimetype)
          ) {
            callback(
              new BadRequestException(
                'Only JPEG, PNG, or WEBP images are allowed',
              ),
              false,
            );
            return;
          }
          if (
            file.fieldname === 'video' &&
            !ALLOWED_VIDEO_TYPES.includes(file.mimetype)
          ) {
            callback(
              new BadRequestException(
                'Only MP4, WEBM, or MOV videos are allowed',
              ),
              false,
            );
            return;
          }
          callback(null, true);
        },
      },
    ),
  )
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @UploadedFiles() files: ProjectUploadFiles,
  ) {
    const image = files.image?.[0];
    const video = files.video?.[0];

    if (image && image.size > MAX_IMAGE_SIZE_BYTES) {
      unlinkSync(image.path);
      throw new BadRequestException('Image exceeds the 5MB limit');
    }
    if (video && video.size > MAX_VIDEO_SIZE_BYTES) {
      unlinkSync(video.path);
      throw new BadRequestException('Video exceeds the 100MB limit');
    }

    return this.projectsService.update(
      id,
      dto,
      image ? `/uploads/projects/images/${image.filename}` : undefined,
      video ? `/uploads/projects/videos/${video.filename}` : undefined,
    );
  }

  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }
}
