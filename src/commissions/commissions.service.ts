import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FindCommissionsQueryDto } from './dto/find-commissions-query.dto';
import { PayCommissionDto } from './dto/pay-commission.dto';
import { buildPaginationMeta } from '../common/utils/paginate';
import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class CommissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: FindCommissionsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.CommissionWhereInput = {
      ...(query.representativeId && {
        representativeId: query.representativeId,
      }),
      ...(query.paid !== undefined && { paid: query.paid }),
      ...((query.from || query.to) && {
        createdAt: {
          ...(query.from && { gte: new Date(query.from) }),
          ...(query.to && { lte: new Date(query.to) }),
        },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.commission.findMany({
        where,
        include: {
          representative: { select: { id: true, name: true, phone: true } },
          quoteRequest: {
            select: { id: true, location: true, quotedPrice: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.commission.count({ where }),
    ]);

    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  async pay(id: string, dto: PayCommissionDto) {
    const commission = await this.prisma.commission.findUnique({
      where: { id },
    });
    if (!commission) {
      throw new NotFoundException('Commission not found');
    }
    if (commission.paid) {
      throw new ConflictException('Commission is already paid');
    }

    const amount = dto.amount ?? commission.amount;
    if (amount == null) {
      throw new BadRequestException(
        'An amount must be provided — no commission percentage/policy is configured yet',
      );
    }

    return this.prisma.commission.update({
      where: { id },
      data: {
        amount,
        paid: true,
        paidAt: new Date(),
        ...(dto.note !== undefined && { note: dto.note }),
      },
    });
  }
}
