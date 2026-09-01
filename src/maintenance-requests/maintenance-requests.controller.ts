import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import { MaintenanceRequestsService } from './maintenance-requests.service';
import { CreateMaintenanceRequestDto } from './dto/create-maintenance-request.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../../generated/prisma/client';

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'maintenance-requests');
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

mkdirSync(UPLOAD_DIR, { recursive: true });

@Controller('maintenance-requests')
export class MaintenanceRequestsController {
  constructor(
    private readonly maintenanceRequestsService: MaintenanceRequestsService,
  ) {}

  @Public()
  @HttpCode(HttpStatus.CREATED)
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
    @Body() dto: CreateMaintenanceRequestDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    if (!image) {
      throw new BadRequestException('Problem image is required');
    }

    return this.maintenanceRequestsService.create(
      dto,
      `/uploads/maintenance-requests/${image.filename}`,
    );
  }

  @Roles(Role.ADMIN)
  @Get()
  findAll() {
    return this.maintenanceRequestsService.findAll();
  }
}
