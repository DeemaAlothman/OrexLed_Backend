import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { join } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { VeoService } from './veo.service';
import { VideoCreditsService } from '../users/video-credits.service';
import { CreateVideoGenerationDto } from './dto/create-video-generation.dto';
import { VideoGenerationStatus } from '../../generated/prisma/client';

const OUTPUT_DIR = join(process.cwd(), 'uploads', 'video-generations');

@Injectable()
export class VideoGenerationsService {
  private readonly logger = new Logger(VideoGenerationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly veoService: VeoService,
    private readonly videoCreditsService: VideoCreditsService,
  ) {}

  async create(
    userId: string,
    dto: CreateVideoGenerationDto,
    imagePath: string | null,
  ) {
    const job = await this.prisma.$transaction(async (tx) => {
      const created = await tx.videoGeneration.create({
        data: {
          userId,
          title: dto.title,
          prompt: dto.prompt,
          style: dto.style,
          aspectRatio: dto.aspectRatio,
          imagePath,
        },
      });

      // Composed in the same transaction: if credit is insufficient, this throws and the job insert rolls back too.
      await this.videoCreditsService.spend(tx, userId, created.id);

      return created;
    });

    // Fire and forget: video generation takes minutes, the client polls GET /video-generations/:id.
    void this.process(job.id);

    return job;
  }

  async findByIdForUser(id: string, userId: string, isAdmin: boolean) {
    const job = await this.prisma.videoGeneration.findUnique({ where: { id } });
    if (!job) {
      throw new NotFoundException('Video generation job not found');
    }
    if (job.userId !== userId && !isAdmin) {
      throw new ForbiddenException();
    }
    return job;
  }

  private async process(jobId: string) {
    const job = await this.prisma.videoGeneration.findUnique({
      where: { id: jobId },
    });
    if (!job) return;

    await this.prisma.videoGeneration.update({
      where: { id: jobId },
      data: { status: VideoGenerationStatus.PROCESSING },
    });

    try {
      const videoBuffer = await this.veoService.generateVideo({
        prompt: job.prompt,
        aspectRatio: job.aspectRatio,
        // job.imagePath is the public "/uploads/..." URL path; reconstruct the on-disk path to read it.
        imagePath: job.imagePath
          ? join(process.cwd(), job.imagePath)
          : undefined,
      });

      await mkdir(OUTPUT_DIR, { recursive: true });
      const filename = `${randomUUID()}.mp4`;
      await writeFile(join(OUTPUT_DIR, filename), videoBuffer);

      await this.prisma.videoGeneration.update({
        where: { id: jobId },
        data: {
          status: VideoGenerationStatus.COMPLETED,
          videoPath: `/uploads/video-generations/${filename}`,
        },
      });
    } catch (error) {
      this.logger.error(`Video generation failed for job ${jobId}`, error);
      await this.prisma.videoGeneration.update({
        where: { id: jobId },
        data: {
          status: VideoGenerationStatus.FAILED,
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
        },
      });
      await this.videoCreditsService.refund(job.userId, jobId);
    }
  }
}
