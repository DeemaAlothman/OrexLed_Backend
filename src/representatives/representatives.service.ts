import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRepresentativeDto } from './dto/create-representative.dto';
import { FindRepresentativesQueryDto } from './dto/find-representatives-query.dto';
import { UpdateRepresentativeDto } from './dto/update-representative.dto';
import { buildPaginationMeta } from '../common/utils/paginate';
import { Prisma } from '../../generated/prisma/client';

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

  async findAll(query: FindRepresentativesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.RepresentativeWhereInput = {
      ...(query.status && { status: query.status }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { phone: { contains: query.search, mode: 'insensitive' } },
          { nationalId: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.representative.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.representative.count({ where }),
    ]);

    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  async update(id: string, dto: UpdateRepresentativeDto) {
    await this.findByIdOrThrow(id);
    return this.prisma.representative.update({
      where: { id },
      data: { status: dto.status },
    });
  }
}
