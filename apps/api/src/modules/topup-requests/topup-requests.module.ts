import { Module } from '@nestjs/common';
import { PrismaModule } from '../../config/prisma.module';
import { TopUpRequestsService } from './topup-requests.service';
import { TopUpRequestsTraderController, TopUpRequestsAdminController } from './topup-requests.controller';

@Module({
  imports: [PrismaModule],
  controllers: [TopUpRequestsTraderController, TopUpRequestsAdminController],
  providers: [TopUpRequestsService],
  exports: [TopUpRequestsService],
})
export class TopUpRequestsModule {}
