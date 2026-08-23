import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@p2p/shared';
import { InvitesService } from './invites.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { RedeemInviteDto } from './dto/redeem-invite.dto';

@ApiTags('Invites')
@ApiBearerAuth()
@Controller('admin/invites')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Create an invite for a new user (Admin/Owner only)' })
  @ApiResponse({ status: 201, description: 'Invite created and email sent' })
  @ApiResponse({ status: 409, description: 'User or invite already exists' })
  async create(@Body() dto: CreateInviteDto, @CurrentUser() user: any) {
    const invite = await this.invitesService.create(dto, user.id);
    return invite;
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'List all invites (Admin/Owner only)' })
  async findAll(@Query('status') status?: 'active' | 'redeemed' | 'expired') {
    return this.invitesService.findAll(status);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Delete an invite (Admin/Owner only)' })
  async delete(@Param('id') id: string) {
    return this.invitesService.delete(id);
  }
}

@ApiTags('Auth')
@ApiBearerAuth()
@Controller('auth/invite')
export class AuthInviteController {
  constructor(private readonly invitesService: InvitesService) {}

  @Post('verify')
  @ApiOperation({ summary: 'Redeem an invite — create account and set password' })
  @ApiResponse({ status: 201, description: 'Account created successfully' })
  @ApiResponse({ status: 404, description: 'Invalid or expired invite' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async redeem(@Body() dto: RedeemInviteDto) {
    return this.invitesService.redeem(dto);
  }
}
