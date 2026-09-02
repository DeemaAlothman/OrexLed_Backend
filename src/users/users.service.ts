import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VideoCreditsService } from './video-credits.service';
import { Role } from '../../generated/prisma/client';

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
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        videoCredits: true,
        createdAt: true,
      },
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

  findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        videoCredits: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
