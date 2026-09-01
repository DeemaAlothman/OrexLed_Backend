import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaintenanceRequestDto } from './dto/create-maintenance-request.dto';

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

  findAll() {
    return this.prisma.maintenanceRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}
