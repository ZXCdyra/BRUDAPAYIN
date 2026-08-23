import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateMerchantDto, UpdateMerchantDto } from './dto';
import { DirectionType } from '@p2p/shared';
import { ApiKeyDirection, Prisma } from '@prisma/client';
import * as crypto from 'crypto';
import { encryptSecret } from '../../common/utils/crypto';

@Injectable()
export class MerchantsService {
  private readonly logger = new Logger(MerchantsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMerchantDto) {
    const existing = await this.prisma.merchant.findUnique({
      where: { userId: dto.userId },
    });
    if (existing) {
      throw new ConflictException('Merchant already exists for this user');
    }

    try {
      const merchant = await this.prisma.merchant.create({
        data: {
          userId: dto.userId,
          name: dto.name,
        },
        include: { user: { select: { login: true, role: true } } },
      });

      this.logger.log(`Merchant created: ${merchant.id} for user ${dto.userId}`);
      return merchant;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Merchant display name is already in use');
      }
      throw e;
    }
  }

  async findById(id: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id },
      include: {
        balances: { include: { currency: { select: { code: true } } } },
        apiKeys: { where: { isActive: true } },
        user: { select: { login: true, role: true, isActive: true } },
      },
    });
    if (!merchant) {
      throw new NotFoundException(`Merchant ${id} not found`);
    }
    return merchant;
  }

  async findByUserId(userId: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { userId },
      include: {
        balances: { include: { currency: { select: { code: true } } } },
        apiKeys: { where: { isActive: true } },
      },
    });
    if (!merchant) {
      throw new NotFoundException(`Merchant for user ${userId} not found`);
    }
    return merchant;
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [merchants, total] = await Promise.all([
      this.prisma.merchant.findMany({
        skip,
        take: limit,
        include: {
          balances: { include: { currency: { select: { code: true } } } },
          user: { select: { login: true, role: true, isActive: true } },
          _count: { select: { payinOrders: true, payoutOrders: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.merchant.count(),
    ]);

    const enriched = merchants.map((m) => ({
      ...m,
      ordersCount: (m._count?.payinOrders ?? 0) + (m._count?.payoutOrders ?? 0),
    }));

    return { data: enriched, total, page, limit };
  }

  async update(id: string, dto: UpdateMerchantDto) {
    await this.findById(id);

    try {
      return await this.prisma.merchant.update({
        where: { id },
        data: dto,
        include: { balances: true },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Merchant display name is already in use');
      }
      throw e;
    }
  }

  async lock(id: string) {
    const merchant = await this.findById(id);
    if (merchant.isLock) {
      throw new ConflictException('Merchant is already locked');
    }

    this.logger.warn(`Merchant locked: ${id}`);
    return this.prisma.merchant.update({
      where: { id },
      data: { isLock: true },
    });
  }

  async unlock(id: string) {
    const merchant = await this.findById(id);
    if (!merchant.isLock) {
      throw new ConflictException('Merchant is not locked');
    }

    this.logger.log(`Merchant unlocked: ${id}`);
    return this.prisma.merchant.update({
      where: { id },
      data: { isLock: false },
    });
  }

  async generateApiKeys(merchantId: string, direction: DirectionType) {
    await this.findById(merchantId);

    const prismaDirection =
      direction === DirectionType.PAYIN
        ? ApiKeyDirection.PAYIN
        : ApiKeyDirection.PAYOUT;

    await this.prisma.merchantApiKey.updateMany({
      where: { merchantId, direction: prismaDirection, isActive: true },
      data: { isActive: false },
    });

    const publicKey = `pk_${direction.toLowerCase()}_${crypto.randomBytes(24).toString('hex')}`;
    const secretKey = `sk_${direction.toLowerCase()}_${crypto.randomBytes(32).toString('hex')}`;
    const secretKeyHash = encryptSecret(secretKey);

    const apiKey = await this.prisma.merchantApiKey.create({
      data: {
        merchantId,
        direction: prismaDirection,
        publicKey,
        secretKeyHash,
      },
    });

    this.logger.log(
      `API keys generated for merchant ${merchantId}, direction ${direction}`,
    );

    return {
      id: apiKey.id,
      publicKey,
      secretKey,
      direction,
    };
  }

  async regenerateApiKey(keyId: string) {
    const existing = await this.prisma.merchantApiKey.findUnique({
      where: { id: keyId },
    });
    if (!existing) {
      throw new NotFoundException(`API key ${keyId} not found`);
    }

    await this.prisma.merchantApiKey.update({
      where: { id: keyId },
      data: { isActive: false },
    });

    const direction = existing.direction === ApiKeyDirection.PAYIN ? 'payin' : 'payout';
    const publicKey = `pk_${direction}_${crypto.randomBytes(24).toString('hex')}`;
    const secretKey = `sk_${direction}_${crypto.randomBytes(32).toString('hex')}`;
    const secretKeyHash = encryptSecret(secretKey);

    const newKey = await this.prisma.merchantApiKey.create({
      data: {
        merchantId: existing.merchantId,
        direction: existing.direction,
        publicKey,
        secretKeyHash,
      },
    });

    this.logger.log(`API key regenerated: old=${keyId}, new=${newKey.id}`);

    return {
      id: newKey.id,
      publicKey,
      secretKey,
      direction: existing.direction,
    };
  }

  async getBalances(merchantId: string) {
    await this.findById(merchantId);

    return this.prisma.merchantBalance.findMany({
      where: { merchantId },
    });
  }

  /**
   * Обнуление балансов мерчанта (OWNER): по каждому ненулевому остатку
   * создаётся проводка MANUAL_DEBIT на текущую сумму, баланс ставится в 0.
   */
  async resetBalances(merchantId: string, dto: { currencyId?: string; comment?: string }) {
    await this.findById(merchantId);

    const result = await this.prisma.$transaction(async (tx) => {
      const balances = await tx.merchantBalance.findMany({
        where: {
          merchantId,
          ...(dto.currencyId ? { currencyId: dto.currencyId } : {}),
        },
        include: { currency: { select: { code: true } } },
      });

      const resetRows: { currencyCode: string; amount: number }[] = [];

      for (const bal of balances) {
        const amount = Number(bal.amount);
        if (Math.abs(amount) < 1e-9) continue;

        await tx.merchantBalanceTransaction.create({
          data: {
            merchantId,
            type: 'MANUAL_DEBIT',
            amount: bal.amount,
            currencyId: bal.currencyId,
            comment:
              dto.comment?.trim() ||
              `Обнуление баланса мерчанта (${bal.currency.code}) владельцем платформы`,
          },
        });

        await tx.merchantBalance.update({
          where: { merchantId_currencyId: { merchantId, currencyId: bal.currencyId } },
          data: { amount: 0 },
        });

        resetRows.push({ currencyCode: bal.currency.code, amount });
      }

      return resetRows;
    });

    this.logger.log(
      `Merchant ${merchantId} balances reset by owner: ${result
        .map((r) => `${r.currencyCode}=${r.amount}`)
        .join(', ') || 'nothing to reset'}`,
    );

    return {
      merchantId,
      reset: result,
      message:
        result.length === 0 ? 'Балансы уже нулевые' : 'Балансы обнулены, проводки MANUAL_DEBIT созданы',
    };
  }
}
