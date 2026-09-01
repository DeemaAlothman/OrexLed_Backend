import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RepresentativesService } from '../representatives/representatives.service';
import { CreateQuoteRequestDto } from './dto/create-quote-request.dto';

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

  findAll() {
    return this.prisma.quoteRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}
