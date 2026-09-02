import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RepresentativesService } from '../representatives/representatives.service';
import { CreateQuoteRequestDto } from './dto/create-quote-request.dto';
import { FindQuoteRequestsQueryDto } from './dto/find-quote-requests-query.dto';
import { UpdateQuoteRequestDto } from './dto/update-quote-request.dto';
import { buildPaginationMeta } from '../common/utils/paginate';
import {
  Prisma,
  QuoteRequestStatus,
} from '../../generated/prisma/client';

const REPRESENTATIVE_SUMMARY_SELECT = {
  id: true,
  name: true,
  phone: true,
} satisfies Prisma.RepresentativeSelect;

@Injectable()
export class QuoteRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly representativesService: RepresentativesService,
  ) {}

  async create(dto: CreateQuoteRequestDto, imagePath: string) {
    let name = dto.name;
    let phone = dto.phone;

    if (dto.representativeId) {
      const representative = await this.representativesService.findByIdOrThrow(
        dto.representativeId,
      );
      name = representative.name;
      phone = representative.phone;
    }

    return this.prisma.quoteRequest.create({
      data: {
        name: name!,
        phone: phone!,
        location: dto.location,
        length: dto.length,
        width: dto.width,
        imagePath,
        representativeId: dto.representativeId,
      },
    });
  }

  async findAll(query: FindQuoteRequestsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.QuoteRequestWhereInput = {
      ...(query.status && { status: query.status }),
      ...(query.representativeId && {
        representativeId: query.representativeId,
      }),
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
          { location: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.quoteRequest.findMany({
        where,
        include: { representative: { select: REPRESENTATIVE_SUMMARY_SELECT } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.quoteRequest.count({ where }),
    ]);

    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  async update(id: string, dto: UpdateQuoteRequestDto) {
    const existing = await this.prisma.quoteRequest.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Quote request not found');
    }

    const updated = await this.prisma.quoteRequest.update({
      where: { id },
      data: {
        ...(dto.status && { status: dto.status }),
        ...(dto.note !== undefined && { note: dto.note }),
        ...(dto.quotedPrice !== undefined && { quotedPrice: dto.quotedPrice }),
      },
      include: { representative: { select: REPRESENTATIVE_SUMMARY_SELECT } },
    });

    const justWon =
      dto.status === QuoteRequestStatus.WON &&
      existing.status !== QuoteRequestStatus.WON;

    if (justWon && updated.representativeId) {
      await this.prisma.commission.upsert({
        where: { quoteRequestId: updated.id },
        create: {
          quoteRequestId: updated.id,
          representativeId: updated.representativeId,
          dealValue: updated.quotedPrice,
        },
        update: { dealValue: updated.quotedPrice },
      });
    }

    return updated;
  }
}
