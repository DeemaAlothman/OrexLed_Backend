import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  MaintenanceRequestStatus,
  QuoteRequestStatus,
  RepresentativeStatus,
} from '../../generated/prisma/client';

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfWeek() {
  const date = startOfToday();
  date.setDate(date.getDate() - 6);
  return date;
}

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const today = startOfToday();
    const weekStart = startOfWeek();

    const [
      newQuoteRequests,
      todayQuoteRequests,
      weekQuoteRequests,
      totalQuoteRequests,
      wonQuoteRequests,
      newMaintenanceRequests,
      todayMaintenanceRequests,
      weekMaintenanceRequests,
      totalMaintenanceRequests,
      totalRepresentatives,
      pendingRepresentatives,
      approvedRepresentatives,
      topRepresentativeGroups,
    ] = await Promise.all([
      this.prisma.quoteRequest.count({
        where: { status: QuoteRequestStatus.NEW },
      }),
      this.prisma.quoteRequest.count({
        where: { createdAt: { gte: today } },
      }),
      this.prisma.quoteRequest.count({
        where: { createdAt: { gte: weekStart } },
      }),
      this.prisma.quoteRequest.count(),
      this.prisma.quoteRequest.count({
        where: { status: QuoteRequestStatus.WON },
      }),
      this.prisma.maintenanceRequest.count({
        where: { status: MaintenanceRequestStatus.NEW },
      }),
      this.prisma.maintenanceRequest.count({
        where: { createdAt: { gte: today } },
      }),
      this.prisma.maintenanceRequest.count({
        where: { createdAt: { gte: weekStart } },
      }),
      this.prisma.maintenanceRequest.count(),
      this.prisma.representative.count(),
      this.prisma.representative.count({
        where: { status: RepresentativeStatus.PENDING },
      }),
      this.prisma.representative.count({
        where: { status: RepresentativeStatus.APPROVED },
      }),
      this.prisma.quoteRequest.groupBy({
        by: ['representativeId'],
        where: { representativeId: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { representativeId: 'desc' } },
        take: 5,
      }),
    ]);

    const topRepresentativeIds = topRepresentativeGroups
      .map((group) => group.representativeId)
      .filter((id): id is string => id !== null);

    const topRepresentativeDetails = topRepresentativeIds.length
      ? await this.prisma.representative.findMany({
          where: { id: { in: topRepresentativeIds } },
          select: { id: true, name: true, phone: true },
        })
      : [];

    const topRepresentatives = topRepresentativeGroups.map((group) => {
      const representative = topRepresentativeDetails.find(
        (rep) => rep.id === group.representativeId,
      );
      return {
        representative: representative ?? null,
        quoteRequestsCount: group._count._all,
      };
    });

    return {
      quoteRequests: {
        new: newQuoteRequests,
        today: todayQuoteRequests,
        thisWeek: weekQuoteRequests,
        total: totalQuoteRequests,
        conversionRate:
          totalQuoteRequests > 0
            ? Number(((wonQuoteRequests / totalQuoteRequests) * 100).toFixed(1))
            : 0,
      },
      maintenanceRequests: {
        new: newMaintenanceRequests,
        today: todayMaintenanceRequests,
        thisWeek: weekMaintenanceRequests,
        total: totalMaintenanceRequests,
      },
      representatives: {
        total: totalRepresentatives,
        pending: pendingRepresentatives,
        approved: approvedRepresentatives,
      },
      topRepresentatives,
    };
  }
}
