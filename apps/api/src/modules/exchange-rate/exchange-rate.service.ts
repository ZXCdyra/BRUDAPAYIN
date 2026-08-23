import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { config } from '@p2p/config';
import { PrismaService } from '../../config/prisma.service';
import { RapiraClient } from './rapira.client';
import { TelegramService } from '../telegram/telegram.service';
import { OpsAlertsService } from '../ops-alerts/ops-alerts.service';

const REDIS_LAST_SUCCESS_KEY = 'rapira:last_success_ms';
const REDIS_STALE_NOTIFY_LOCK = 'rapira:stale_notify_lock';

/** Parser-backed fiat currencies: fiat codes that have an automated USDT rate source (RF market: RUB via Rapira). */
export const PARSER_FIAT_CODES = ['RUB'] as const;
export type ParserFiatCode = (typeof PARSER_FIAT_CODES)[number];

export function isParserFiatCode(code: string): code is ParserFiatCode {
  return (PARSER_FIAT_CODES as readonly string[]).includes(code.trim().toUpperCase());
}

export type CachedParserPayload = {
  rate: string;
  updatedAt: string;
  raw?: unknown;
};

@Injectable()
export class ExchangeRateService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ExchangeRateService.name);
  private redis: Redis | null = null;
  private rapiraPollTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly rapira: RapiraClient,
    private readonly telegram: TelegramService,
    private readonly opsAlerts: OpsAlertsService,
  ) {}

  onModuleInit(): void {
    this.redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      maxRetriesPerRequest: 2,
      lazyConnect: true,
    });
    void this.redis.connect().catch((e) => {
      this.logger.warn(`Redis connect failed (exchange rate cache disabled): ${e}`);
    });

    if (config.rapira.pollEnabled) {
      void this.maybeAlertStaleParserRate();
      void this.refreshFromRapira().catch(() => undefined);
      this.rapiraPollTimer = setInterval(() => {
        void this.maybeAlertStaleParserRate();
        void this.refreshFromRapira().catch(() => undefined);
      }, Math.max(1000, config.rapira.pollMs));
    }
  }

  /**
   * Current cache + DB metadata for admin dashboards.
   */
  async getStatusForAdmin(): Promise<{
    /** Fiat per 1 USDT from the primary Redis slot (same pair as persisted exchange_rate_logs when enabled). */
    primaryPairParserFiatPerUsdt: number | null;
    cacheUpdatedAt: string | null;
    lastSuccessAt: string | null;
    lastLogId: string | null;
    stale: boolean;
    staleThresholdMinutes: number;
    rawSample: unknown;
    /** Current Redis cache `raw` field (live rate sample), if available */
    cacheRawSample: unknown;
    /** USDT/RUB parser rate from Rapira, when available. */
    rubParserFiatPerUsdt: number | null;
  }> {
    const rubRate = await this.getCachedParserFiatPerUsdt('RUB');
    let cacheUpdatedAt: string | null = null;
    let cacheRawSample: unknown = null;
    if (this.redis) {
      try {
        const raw = await this.redis.get(config.rapira.redisKey);
        if (raw) {
          const parsed = JSON.parse(raw) as CachedParserPayload;
          cacheUpdatedAt = parsed.updatedAt ?? null;
          cacheRawSample = parsed.raw ?? null;
        }
      } catch {
        /* ignore */
      }
    }
    const lastLog = await this.prisma.exchangeRateLog.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { id: true, createdAt: true, rawPrices: true, rate: true },
    });
    let lastSuccessAt: string | null = null;
    if (this.redis) {
      try {
        const ms = await this.redis.get(REDIS_LAST_SUCCESS_KEY);
        if (ms) lastSuccessAt = new Date(parseInt(ms, 10)).toISOString();
      } catch {
        /* ignore */
      }
    }
    const thresholdMs = Math.max(1, config.rapira.staleAlertMinutes) * 60_000;
    const lastMs = lastSuccessAt ? new Date(lastSuccessAt).getTime() : 0;
    const stale = lastMs === 0 ? false : Date.now() - lastMs > thresholdMs;
    return {
      primaryPairParserFiatPerUsdt: rubRate,
      cacheUpdatedAt,
      lastSuccessAt,
      lastLogId: lastLog?.id ?? null,
      stale,
      staleThresholdMinutes: config.rapira.staleAlertMinutes,
      rawSample: lastLog?.rawPrices ?? null,
      cacheRawSample,
      rubParserFiatPerUsdt: rubRate,
    };
  }

  onModuleDestroy(): void {
    if (this.rapiraPollTimer) clearInterval(this.rapiraPollTimer);
    void this.redis?.quit();
  }

  /**
   * Cached parser rate P (fiat per 1 USDT) for ISO currencies backed by an automated rate source.
   * RUB reads the Rapira Redis slot with a Rapira-sourced DB log fallback.
   */
  async getCachedParserFiatPerUsdt(currency: string): Promise<number | null> {
    const c = currency.trim().toUpperCase();
    if (c === 'RUB') {
      const fromRedis = await this.readRedisRate(config.rapira.redisKey);
      if (fromRedis !== null) return fromRedis;

      const last = await this.prisma.exchangeRateLog.findFirst({
        where: { source: 'rapira' },
        orderBy: { createdAt: 'desc' },
        select: { rate: true },
      });
      return last ? Number(last.rate) : null;
    }
    return null;
  }

  /**
   * Parser rate P (fiat per 1 USDT) for supported fiat currencies.
   * @param _exchangeParserHint Optional specialist profile value; unmapped values fall back to the default Rapira source.
   */
  async requireParserRateFiatPerUsdt(
    currency: string,
    _exchangeParserHint?: string | null,
  ): Promise<number> {
    const c = currency.trim().toUpperCase();
    if (!isParserFiatCode(c)) {
      throw new Error('PARSER_RATE_UNSUPPORTED_FIAT');
    }
    const r = await this.getCachedParserFiatPerUsdt(c);
    if (r === null || !Number.isFinite(r) || r <= 0) {
      throw new Error('PARSER_RATE_UNAVAILABLE');
    }
    return r;
  }

  private async readRedisRate(redisKey: string): Promise<number | null> {
    if (!this.redis) return null;
    try {
      const raw = await this.redis.get(redisKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as CachedParserPayload;
      const n = parseFloat(parsed.rate);
      return Number.isFinite(n) && n > 0 ? n : null;
    } catch {
      return null;
    }
  }

  /**
   * Refreshes the USDT/RUB parser rate from Rapira: persists an exchange_rate_logs row
   * and updates the Rapira Redis slot consumed by getCachedParserFiatPerUsdt('RUB').
   */
  async refreshFromRapira(): Promise<void> {
    const rate = await this.rapira.fetchUsdtFiatRate('RUB');
    if (rate == null || !Number.isFinite(rate) || rate <= 0) return;

    try {
      await this.prisma.exchangeRateLog.create({
        data: {
          rate,
          rawPrices: { source: 'rapira', symbol: 'USDT/RUB', priceMode: config.rapira.priceMode },
          source: 'rapira',
        },
      });
    } catch (e) {
      this.logger.warn(`Exchange rate log persist failed (rapira): ${e}`);
    }

    const payload: CachedParserPayload = {
      rate: rate.toFixed(6),
      updatedAt: new Date().toISOString(),
      raw: { symbol: 'USDT/RUB', priceMode: config.rapira.priceMode },
    };
    if (this.redis) {
      try {
        await this.redis.set(config.rapira.redisKey, JSON.stringify(payload));
        await this.redis.set(REDIS_LAST_SUCCESS_KEY, String(Date.now()));
      } catch (e) {
        this.logger.warn(`Redis set parser rate failed (rapira): ${e}`);
      }
    }
    this.logger.debug(`Parser rate RUB/USDT updated from Rapira: ${payload.rate}`);
  }

  /**
   * Warn when the Rapira parser has not produced a rate recently.
   * Ops Telegram/email notifies are throttled via Redis lock (10 min) when configured.
   */
  private async maybeAlertStaleParserRate(): Promise<void> {
    const thresholdMs = Math.max(1, config.rapira.staleAlertMinutes) * 60_000;
    if (!this.redis) return;

    let lastMs = 0;
    try {
      const raw = await this.redis.get(REDIS_LAST_SUCCESS_KEY);
      if (raw) lastMs = parseInt(raw, 10);
    } catch {
      return;
    }

    if (lastMs === 0) return;
    if (Date.now() - lastMs <= thresholdMs) return;

    this.logger.warn(
      `Rapira parser rate is stale or missing (threshold ${config.rapira.staleAlertMinutes}m). Last success: ${
        lastMs ? new Date(lastMs).toISOString() : 'never'
      }`,
    );

    try {
      const locked = await this.redis.set(REDIS_STALE_NOTIFY_LOCK, '1', 'EX', 600, 'NX');
      if (locked !== 'OK') return;

      const chatId = config.ownerOps.telegramChatId.trim();
      if (chatId) {
        const msg =
          `<b>Parser rate alert</b>\n` +
          `Rapira USDT/RUB has no fresh success within ${config.rapira.staleAlertMinutes} minutes.\n` +
          `Last OK: ${lastMs ? new Date(lastMs).toISOString() : 'never'}`;
        await this.telegram.sendNotification(chatId, msg);
      }

      await this.opsAlerts.scheduleAlert({
        severity: 'high',
        title: 'Rapira parser rate stale',
        lines: [
          `USDT/RUB has no successful refresh within ${config.rapira.staleAlertMinutes} minutes.`,
          `Last OK: ${lastMs ? new Date(lastMs).toISOString() : 'never'}`,
        ],
      });
    } catch (e) {
      this.logger.warn(`Stale parser ops notify failed: ${e}`);
    }
  }
}
