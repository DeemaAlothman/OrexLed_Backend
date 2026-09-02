import { Injectable, NotFoundException } from '@nestjs/common';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { FindProjectsQueryDto } from './dto/find-projects-query.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { buildPaginationMeta } from '../common/utils/paginate';

function deleteUploadedFile(relativePath: string) {
  const absolutePath = join(process.cwd(), relativePath);
  if (existsSync(absolutePath)) {
    unlinkSync(absolutePath);
  }
}

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateProjectDto, imagePath: string, videoPath: string) {
    return this.prisma.project.create({
      data: {
        description: dto.description,
        imagePath,
        videoPath,
      },
    });
  }

  async findAll(query: FindProjectsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.project.count(),
    ]);

    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  async update(
    id: string,
    dto: UpdateProjectDto,
    imagePath?: string,
    videoPath?: string,
  ) {
    const existing = await this.prisma.project.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Project not found');
    }

    const updated = await this.prisma.project.update({
      where: { id },
      data: {
        ...(dto.description !== undefined && { description: dto.description }),
        ...(imagePath && { imagePath }),
        ...(videoPath && { videoPath }),
      },
    });

    if (imagePath) {
      deleteUploadedFile(existing.imagePath);
    }
    if (videoPath) {
      deleteUploadedFile(existing.videoPath);
    }

    return updated;
  }

  async remove(id: string) {
    const existing = await this.prisma.project.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Project not found');
    }

    await this.prisma.project.delete({ where: { id } });

    deleteUploadedFile(existing.imagePath);
    deleteUploadedFile(existing.videoPath);
  }
}
