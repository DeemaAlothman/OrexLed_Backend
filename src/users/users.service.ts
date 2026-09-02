import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VideoCreditsService } from './video-credits.service';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { buildPaginationMeta } from '../common/utils/paginate';
import { Role } from '../../generated/prisma/client';

const USER_SAFE_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  videoCredits: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly videoCreditsService: VideoCreditsService,
  ) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByIdSafe(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: USER_SAFE_SELECT,
    });
  }

  create(data: {
    email: string;
    name: string;
    passwordHash: string;
    role?: Role;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email.toLowerCase(),
          name: data.name,
          passwordHash: data.passwordHash,
          role: data.role ?? Role.USER,
        },
      });
      await this.videoCreditsService.grantInitial(tx, user.id);
      return user;
    });
  }

  async findAll(query: FindUsersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        select: USER_SAFE_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count(),
    ]);

    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  async updateRole(id: string, role: Role) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: USER_SAFE_SELECT,
    });
  }
}
