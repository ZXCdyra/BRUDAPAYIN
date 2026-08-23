import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '../../config/prisma.module';
import { TelegramModule } from '../telegram/telegram.module';
import { OpsAlertsModule } from '../ops-alerts/ops-alerts.module';
import { RapiraClient } from './rapira.client';
import { ExchangeRateService } from './exchange-rate.service';

@Global()
@Module({
  imports: [PrismaModule, TelegramModule, OpsAlertsModule],
  providers: [RapiraClient, ExchangeRateService],
  exports: [ExchangeRateService],
})
export class ExchangeRateModule {}
