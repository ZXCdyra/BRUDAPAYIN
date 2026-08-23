import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@p2p/shared';
import { Prisma, type TopUpRequestStatus } from '@prisma/client';
import { TopUpRequestsService } from './topup-requests.service';
import type { CreateTopUpRequestDto, ApproveTopUpRequestDto } from './dto/create-topup-request.dto';

/**
 * Trader endpoints for creating and viewing their own top-up requests.
 */
@ApiTags('TopUp Requests (Trader)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TRADER, UserRole.PAYOUT_TRADER)
@Controller('trader/topup-requests')
export class TopUpRequestsTraderController {
  constructor(private readonly service: TopUpRequestsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new top-up request (manual deposit)' })
  async create(
    @CurrentUser('traderId') traderId: string,
    @Body() dto: CreateTopUpRequestDto,
  ) {
    return this.service.create(traderId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get my top-up requests' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  async findByTrader(
    @CurrentUser('traderId') traderId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ) {
    const txStatus = status as TopUpRequestStatus | undefined;
    return this.service.findByTrader(traderId, txStatus, page, limit);
  }
}

/**
 * Admin endpoints for reviewing, approving and rejecting top-up requests.
 */
@ApiTags('TopUp Requests (Admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.OWNER)
@Controller('admin/topup-requests')
export class TopUpRequestsAdminController {
  constructor(private readonly service: TopUpRequestsService) {}

  @Get()
  @ApiOperation({ summary: 'List all top-up requests (admin review queue)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  async listAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ) {
    const txStatus = status as TopUpRequestStatus | undefined;
    return this.service.listAll(page, Math.min(limit, 100), txStatus);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a top-up request and credit trader balance' })
  async approve(
    @Param('id') id: string,
    @Body() dto: ApproveTopUpRequestDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.service.approve(id, dto, adminId);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a top-up request' })
  async reject(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @Body('adminNote') adminNote?: string,
  ) {
    return this.service.reject(id, adminId, adminNote);
  }
}
