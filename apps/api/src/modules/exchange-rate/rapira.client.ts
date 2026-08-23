import { Injectable, Logger } from '@nestjs/common';
import { config } from '@p2p/config';
import { logExternalFailure } from '../../common/utils/external-error-log';

type RapiraRatesResponse = {
  code?: number | string;
  message?: string;
  data?: Array<{
    symbol?: string;
    baseCurrency?: string;
    quoteCurrency?: string;
    askPrice?: number;
    bidPrice?: number;
    close?: number;
  }>;
};

/**
 * Fetches the USDT/RUB spot rate from the public Rapira market rates endpoint
 * (no auth; limits 5 rps / 100 rpm — polling interval must stay conservative).
 */
@Injectable()
export class RapiraClient {
  private readonly logger = new Logger(RapiraClient.name);

  /**
   * Fiat (RUB) per 1 USDT according to the configured price mode.
   * Returns null when the pair is missing or the response is unusable.
   */
  async fetchUsdtFiatRate(fiat: 'RUB'): Promise<number | null> {
    const symbol = `USDT/${fiat}`;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), config.http.webhookFetchTimeoutMs);
    try {
      const res = await fetch(`${config.rapira.baseUrl.replace(/\/+$/, '')}/open/market/rates`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: ctrl.signal,
      });
      const json = (await res.json()) as RapiraRatesResponse;
      if (!Array.isArray(json.data)) {
        logExternalFailure(this.logger, {
          integration: 'Rapira',
          operation: 'open/market/rates',
          context: { fiat, rapiraCode: json.code },
          error: new Error(json.message ?? 'unexpected response shape'),
          level: 'warn',
        });
        return null;
      }
      const row = json.data.find(
        (r) => r.symbol === symbol || (r.baseCurrency === fiat && r.quoteCurrency === 'USDT'),
      );
      if (!row) {
        logExternalFailure(this.logger, {
          integration: 'Rapira',
          operation: 'open/market/rates',
          context: { fiat },
          error: new Error(`symbol ${symbol} not found in response`),
          level: 'warn',
        });
        return null;
      }
      const mode = config.rapira.priceMode;
      const candidates: Record<string, number | undefined> = {
        mid:
          typeof row.askPrice === 'number' && typeof row.bidPrice === 'number'
            ? (row.askPrice + row.bidPrice) / 2
            : undefined,
        bid: row.bidPrice,
        ask: row.askPrice,
        close: row.close,
      };
      let rate = candidates[mode] ?? candidates.mid;
      const close = row.close;
      if (!Number.isFinite(rate) || (rate as number) <= 0) {
        // Fallback chain: mid → close, so a partially filled payload still yields a usable price.
        rate = typeof close === 'number' && Number.isFinite(close) && close > 0 ? close : undefined;
      }
      if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) return null;
      return rate;
    } catch (e) {
      logExternalFailure(this.logger, {
        integration: 'Rapira',
        operation: 'open/market/rates',
        context: { fiat },
        error: e,
        level: 'warn',
      });
      return null;
    } finally {
      clearTimeout(t);
    }
  }
}
