import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaintenanceRequestDto } from './dto/create-maintenance-request.dto';
import { FindMaintenanceRequestsQueryDto } from './dto/find-maintenance-requests-query.dto';
import { UpdateMaintenanceRequestDto } from './dto/update-maintenance-request.dto';
import { buildPaginationMeta } from '../common/utils/paginate';
import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class MaintenanceRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateMaintenanceRequestDto, imagePath: string) {
    return this.prisma.maintenanceRequest.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        address: dto.address,
        problem: dto.problem,
        imagePath,
      },
    });
  }

  async findAll(query: FindMaintenanceRequestsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.MaintenanceRequestWhereInput = {
      ...(query.status && { status: query.status }),
      ...((query.from || query.to) && {
        createdAt: {
          ...(query.from && { gte: new Date(query.from) }),
          ...(query.to && { lte: new Date(query.to) }),
        },
      }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { phone: { contains: query.search, mode: 'insensitive' } },
          { address: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.maintenanceRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.maintenanceRequest.count({ where }),
    ]);

    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  async update(id: string, dto: UpdateMaintenanceRequestDto) {
    const existing = await this.prisma.maintenanceRequest.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Maintenance request not found');
    }

    return this.prisma.maintenanceRequest.update({
      where: { id },
      data: {
        ...(dto.status && { status: dto.status }),
        ...(dto.note !== undefined && { note: dto.note }),
        ...(dto.assignedTo !== undefined && { assignedTo: dto.assignedTo }),
      },
    });
  }
}
