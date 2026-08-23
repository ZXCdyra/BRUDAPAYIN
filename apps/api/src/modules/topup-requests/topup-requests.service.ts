import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma, type TopUpRequestStatus } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';
import type { CreateTopUpRequestDto, ApproveTopUpRequestDto } from './dto/create-topup-request.dto';

@Injectable()
export class TopUpRequestsService {
  private readonly logger = new Logger(TopUpRequestsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(traderId: string, dto: CreateTopUpRequestDto, proofFileId?: string) {
    return this.prisma.topUpRequest.create({
      data: {
        traderId,
        txHash: dto.tx_hash,
        network: dto.network,
        amountUsdt: dto.amount_usdt,
        comment: dto.comment,
        proofFileId,
      },
      include: {
        trader: {
          select: {
            id: true,
            user: { select: { login: true } },
          },
        },
      },
    });
  }

  async findByTrader(traderId: string, status?: TopUpRequestStatus, page = 1, limit = 30) {
    const skip = (page - 1) * limit;
    const where: Prisma.TopUpRequestWhereInput = { traderId };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.topUpRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          trader: {
            select: {
              id: true,
              user: { select: { login: true } },
            },
          },
        },
      }),
      this.prisma.topUpRequest.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async listAll(page = 1, limit = 50, status?: TopUpRequestStatus) {
    const skip = (page - 1) * limit;
    const where: Prisma.TopUpRequestWhereInput = {};
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.topUpRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          trader: {
            select: {
              id: true,
              user: { select: { login: true } },
            },
          },
          admin: { select: { login: true } },
          proofFile: { select: { originalName: true } },
        },
      }),
      this.prisma.topUpRequest.count({ where }),
    ]);

    // Serialize BigInt and Decimal to strings for JSON
    const serialized = data.map((r) => ({
      ...r,
      amountUsdt: r.amountUsdt.toString(),
      approvedAt: r.approvedAt?.toISOString() ?? null,
      rejectedAt: r.rejectedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    return { data: serialized, total, page, limit };
  }

  async approve(id: string, dto: ApproveTopUpRequestDto, adminId: string) {
    // Check if request exists and is PENDING
    const request = await this.prisma.topUpRequest.findUnique({ where: { id } });
    if (!request) {
      throw new NotFoundException('Top-up request not found');
    }
    if (request.status !== 'PENDING') {
      throw new BadRequestException(`Request already ${request.status}`);
    }

    // Start a transaction to approve and create balance transaction + settlement
    return this.prisma.$transaction(async (tx) => {
      // Update request status
      const updated = await tx.topUpRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          adminId,
          adminNote: dto.admin_note,
          approvedAt: new Date(),
        },
        include: {
          trader: {
            select: {
              id: true,
              user: { select: { login: true } },
            },
          },
        },
      });

      // Create TOP_UP balance transaction
      // Find USDT currency
      const usdtCurrency = await tx.currency.findFirst({ where: { code: 'USDT' } });
      if (usdtCurrency) {
        await tx.balanceTransaction.create({
          data: {
            traderId: updated.traderId,
            type: 'TOP_UP',
            amount: updated.amountUsdt,
            currencyId: usdtCurrency.id,
            referenceId: updated.id,
            createdById: adminId,
            comment: `Top-up approved. TX: ${updated.txHash}`,
          },
        });
      }

      // Create settlement record
      await tx.settlement.create({
        data: {
          adminId,
          traderId: updated.traderId,
          type: 'CREDIT',
          amount: updated.amountUsdt,
          currencyId: usdtCurrency?.id!,
          note: `Top-up approved. TX: ${updated.txHash}`,
        },
      });

      return updated;
    });
  }

  async reject(id: string, adminId: string, adminNote?: string) {
    const request = await this.prisma.topUpRequest.findUnique({ where: { id } });
    if (!request) {
      throw new NotFoundException('Top-up request not found');
    }
    if (request.status !== 'PENDING') {
      throw new BadRequestException(`Request already ${request.status}`);
    }

    return this.prisma.topUpRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        adminId,
        adminNote,
        rejectedAt: new Date(),
      },
    });
  }
}
