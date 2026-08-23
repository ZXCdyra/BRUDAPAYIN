import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { UserRole } from '@p2p/shared';
import { PrismaService } from '../../config/prisma.service';
import { hashPassword } from '../../common/utils/password';
import type { CreateInviteDto } from './dto/create-invite.dto';
import type { RedeemInviteDto } from './dto/redeem-invite.dto';

const TOKEN_EXPIRY_HOURS = 168; // 7 days

const INVITE_SELECT = {
  id: true,
  login: true,
  role: true,
  expiresAt: true,
  redeemedAt: true,
  createdAt: true,
  token: true,
} as const;

@Injectable()
export class InvitesService {
  private readonly logger = new Logger(InvitesService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Create an invite token for a new user.
   * Sends invitation email with redeem link.
   */
  async create(dto: CreateInviteDto, createdByUserId: string) {
    const { login, role, frontendUrl } = dto;
    const normalizedFrontendUrl =
      frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000';

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({ where: { login } });
    if (existingUser) {
      throw new ConflictException('A user with this login already exists');
    }

    // Check if there's already an active (unredeemed) invite for this login
    const existingInvite = await this.prisma.inviteToken.findFirst({
      where: {
        login,
        redeemedAt: null,
      },
    });

    let inviteToken: any;

    if (existingInvite) {
      // Resend: update expiry
      inviteToken = await this.prisma.inviteToken.update({
        where: { id: existingInvite.id },
        data: {
          expiresAt: new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000),
        },
        select: INVITE_SELECT,
      });
      this.logger.log(`Resent invite for ${login} (id: ${inviteToken.id})`);
    } else {
      // Create new invite
      const token = this.generateToken();
      const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

      inviteToken = await this.prisma.inviteToken.create({
        data: {
          token,
          login,
          role,
          expiresAt,
          createdBy: createdByUserId,
        },
        select: INVITE_SELECT,
      });
      this.logger.log(`Created invite for ${login} (id: ${inviteToken.id})`);
    }

    // Return with invite link (admin copies & sends manually)
    return {
      ...inviteToken,
      inviteLink: `${normalizedFrontendUrl}/invite/${inviteToken.token}`,
    };
  }

  /**
   * Redeem an invite token — create user and set password.
   */
  async redeem(dto: RedeemInviteDto) {
    const { token, login, password } = dto;

    // Find valid invite
    const invite = await this.prisma.inviteToken.findFirst({
      where: {
        token,
        login,
        redeemedAt: null,
      },
      include: {
        creator: { select: { id: true, login: true } },
      },
    });

    if (!invite) {
      throw new NotFoundException('Invalid or expired invite link');
    }

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({ where: { login } });
    if (existingUser) {
      throw new ConflictException('A user with this login already exists');
    }

    // Check expiry
    if (invite.expiresAt < new Date()) {
      throw new BadRequestException('Invite link has expired');
    }

    // Create user in transaction
    const passwordHash = await hashPassword(password);

    try {
      const user = await this.prisma.$transaction(async (tx) => {
        // Create user with appropriate profile
        const userData: any = {
          login,
          passwordHash,
          role: invite.role,
        };

        // Add role-specific profile creation
        if (invite.role === UserRole.TRADER) {
          userData.traderProfile = {
            create: {
              payoutMinLimit: 0,
              payoutMaxLimit: 0,
              processingMethod: 'CARD' as const,
              cascadeRatingMultiplier: 1,
            },
          };
        }

        // Create user
        const createdUser = await tx.user.create({ data: userData });

        // Mark invite as redeemed and link to user
        await tx.inviteToken.update({
          where: { id: invite.id },
          data: { redeemedAt: new Date(), userId: createdUser.id },
        });

        return createdUser;
      });

      this.logger.log(`User ${login} created from invite (id: ${user.id})`);

      return {
        id: user.id,
        login: user.login,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      };
    } catch (e) {
      if (e instanceof ConflictException || e instanceof BadRequestException) {
        throw e;
      }
      this.logger.error({
        msg: 'invite.redeem_failed',
        inviteId: invite.id,
        error: e instanceof Error ? e.message : String(e),
      });
      throw new BadRequestException('Failed to create account');
    }
  }

  /**
   * List all invites (admin only).
   */
  async findAll(status?: 'active' | 'redeemed' | 'expired') {
    const where: any = {};

    if (status === 'active') {
      where.redeemedAt = null;
      where.expiresAt = { gt: new Date() };
    } else if (status === 'redeemed') {
      where.redeemedAt = { not: null };
    } else if (status === 'expired') {
      where.redeemedAt = null;
      where.expiresAt = { lt: new Date() };
    }

    const invites = await this.prisma.inviteToken.findMany({
      where,
      select: {
        ...INVITE_SELECT,
        creator: { select: { id: true, login: true } },
        user: { select: { id: true, login: true, role: true } },
      },
      orderBy: { id: 'desc' },
    });

    return invites;
  }

  /**
   * Delete an invite (admin only).
   */
  async delete(id: string) {
    const existing = await this.prisma.inviteToken.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Invite not found');
    }

    if (existing.redeemedAt) {
      throw new BadRequestException('Cannot delete a redeemed invite');
    }

    await this.prisma.inviteToken.delete({ where: { id } });
    this.logger.log(`Invite ${id} deleted`);

    return { id, deleted: true };
  }

  private generateToken(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private getRoleDisplay(role: UserRole): string {
    const map: Record<UserRole, string> = {
      [UserRole.TRADER]: 'Трейдер',
      [UserRole.PAYOUT_TRADER]: 'Специалист по выплатам',
      [UserRole.ADMIN]: 'Администратор',
      [UserRole.SUPPORT]: 'Поддержка',
      [UserRole.MERCHANT]: 'Мерчант',
      [UserRole.OWNER]: 'Владелец',
      [UserRole.REFERRAL]: 'Реферал',
    };
    return map[role] || role;
  }
}
