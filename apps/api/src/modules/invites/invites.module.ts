import { Module } from '@nestjs/common';
import { PrismaModule } from '../../config/prisma.module';
import { InvitesService } from './invites.service';
import { InvitesController, AuthInviteController } from './invites.controller';

@Module({
  imports: [PrismaModule],
  controllers: [InvitesController, AuthInviteController],
  providers: [InvitesService],
  exports: [InvitesService],
})
export class InvitesModule {}
