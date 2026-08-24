import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PayinService } from './payin.service';

/** How often stale Pay-In orders are checked against their autocloseAt deadline. */
const AUTOCLOSE_TICK_MS = 30_000;

/**
 * Periodically transitions Pay-In orders past their `autocloseAt` deadline to EXPIRED
 * ("не зашла сделка"). Side effects (merchant webhook, requisite release, realtime)
 * are applied inside PayinService.autocloseStalePayinOrders.
 */
@Injectable()
export class PayinAutocloseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PayinAutocloseService.name);
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly payin: PayinService) {}

  onModuleInit(): void {
    this.timer = setInterval(() => {
      void this.tick().catch((e) => this.logger.error(e));
    }, AUTOCLOSE_TICK_MS);
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private async tick(): Promise<void> {
    const closed = await this.payin.autocloseStalePayinOrders();
    if (closed > 0) {
      this.logger.log(`Auto-closed ${closed} stale Pay-In order(s) as EXPIRED`);
    }
  }
}
