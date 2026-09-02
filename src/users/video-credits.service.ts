import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  Prisma,
  VideoCreditTransactionType,
} from '../../generated/prisma/client';

type Client = PrismaService | Prisma.TransactionClient;

const INITIAL_GRANT_AMOUNT = 3;

@Injectable()
export class VideoCreditsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Records the free signup grant. Call within the same transaction as user creation. */
  async grantInitial(tx: Client, userId: string) {
    await tx.videoCreditTransaction.create({
      data: {
        userId,
        type: VideoCreditTransactionType.INITIAL_GRANT,
        amount: INITIAL_GRANT_AMOUNT,
        balanceAfter: INITIAL_GRANT_AMOUNT,
      },
    });
  }

  /**
   * Locks the user's row, checks and decrements the balance, and logs the spend — all in one
   * atomic step so two concurrent requests can never both succeed past a balance of 1.
   * Pass `tx` to compose this inside a larger transaction (e.g. alongside creating the job row).
   */
  async spend(tx: Client, userId: string, videoGenerationId: string) {
    const [row] = await tx.$queryRaw<{ videoCredits: number }[]>`
      SELECT "videoCredits" FROM "users" WHERE id = ${userId} FOR UPDATE
    `;

    if (!row || row.videoCredits < 1) {
      throw new HttpException(
        'Insufficient video credits. Please top up your balance.',
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const balanceAfter = row.videoCredits - 1;
    await tx.user.update({
      where: { id: userId },
      data: { videoCredits: balanceAfter },
    });
    await tx.videoCreditTransaction.create({
      data: {
        userId,
        type: VideoCreditTransactionType.GENERATION_SPEND,
        amount: -1,
        balanceAfter,
        videoGenerationId,
      },
    });
  }

  async refund(userId: string, videoGenerationId: string) {
    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: { videoCredits: { increment: 1 } },
      });
      await tx.videoCreditTransaction.create({
        data: {
          userId,
          type: VideoCreditTransactionType.GENERATION_REFUND,
          amount: 1,
          balanceAfter: user.videoCredits,
          videoGenerationId,
        },
      });
    });
  }

  async topUp(
    userId: string,
    amount: number,
    performedByUserId: string,
    note?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: { videoCredits: { increment: amount } },
      });
      await tx.videoCreditTransaction.create({
        data: {
          userId,
          type: VideoCreditTransactionType.ADMIN_TOPUP,
          amount,
          balanceAfter: user.videoCredits,
          performedByUserId,
          note,
        },
      });
      return user;
    });
  }

  findHistoryForUser(userId: string) {
    return this.prisma.videoCreditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
