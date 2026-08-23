import { Injectable } from '@nestjs/common';
import { TraderTierDirection } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';

/**
 * «Лесенка процентов» трейдера: диапазоны сумм → процент трейдера.
 * Если подходящий диапазон не найден, используется плоская ставка профиля.
 */
@Injectable()
export class TraderRatesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Возвращает эффективную ставку трейдера как долю (0.11 = 11%).
   * Приоритет: подходящий тир по сумме → плоская ставка профиля.
   */
  async resolveFraction(
    traderProfileId: string,
    direction: TraderTierDirection,
    amount: number,
    flatFractionFallback: number,
  ): Promise<number> {
    const tiers = await this.prisma.traderCommissionTier.findMany({
      where: { traderProfileId, direction },
      orderBy: { amountFrom: 'asc' },
    });
    if (tiers.length === 0) {
      return flatFractionFallback;
    }
    const tier = tiers.find(
      (t) =>
        amount >= Number(t.amountFrom) &&
        (t.amountTo === null || amount < Number(t.amountTo)),
    );
    return tier ? Number(tier.percent) / 100 : flatFractionFallback;
  }
}
