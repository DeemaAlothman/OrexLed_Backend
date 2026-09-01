import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRepresentativeDto } from './dto/create-representative.dto';

@Injectable()
export class RepresentativesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRepresentativeDto) {
    const existing = await this.prisma.representative.findUnique({
      where: { nationalId: dto.nationalId },
    });
    if (existing) {
      throw new ConflictException(
        'A representative with this national ID already exists',
      );
    }

    return this.prisma.representative.create({
      data: {
        ...dto,
        birthDate: new Date(dto.birthDate),
      },
    });
  }

  async findByIdOrThrow(id: string) {
    const representative = await this.prisma.representative.findUnique({
      where: { id },
    });
    if (!representative) {
      throw new NotFoundException('Representative not found');
    }
    return representative;
  }

  findAll() {
    return this.prisma.representative.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}
